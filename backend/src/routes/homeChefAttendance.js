const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireRole(['chef', 'homechef']));

const getHomeChefProfile = async (user, connection = pool, lock = false) => {
  const identifiers = [...new Set([user?.user_id, user?.id]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(String))];
  const clauses = [];
  const params = [];
  if (identifiers.length) {
    clauses.push(`user_id IN (${identifiers.map(() => '?').join(', ')})`);
    params.push(...identifiers);
  }
  if (user?.email) {
    clauses.push('email = ?');
    params.push(user.email);
  }
  if (!clauses.length) return null;

  const [rows] = await connection.execute(
      `SELECT id, user_id, name, email, created_by, franchise_user_id
     FROM home_chefs
     WHERE ${clauses.join(' OR ')}
     ORDER BY id DESC
     LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    params
  );
  return rows[0] || null;
};

const selectAttendance = async (chefUserId) => {
  const [rows] = await pool.execute(
    `SELECT id, DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendance_date,
            check_in_at, check_out_at
     FROM home_chef_attendance
     WHERE home_chef_user_id = ?
    ORDER BY check_in_at DESC`,
    [chefUserId]
  );
  const [[todayRow]] = await pool.execute("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
  return {
    today: todayRow.today,
    currentSession: rows.find((record) => !record.check_out_at) || null,
    records: rows,
  };
};

router.get('/', async (req, res) => {
  try {
    const chef = await getHomeChefProfile(req.user);
    if (!chef?.user_id) return res.status(404).json({ message: 'Home chef profile not found.' });
    res.json(await selectAttendance(chef.user_id));
  } catch (error) {
    console.error('Home chef attendance fetch error:', error);
    res.status(500).json({ message: 'Unable to load attendance.' });
  }
});

router.post('/', async (req, res) => {
  let connection;
  let transactionStarted = false;
  try {
    const action = req.body?.action || 'check_in';
    if (!['check_in', 'check_out'].includes(action)) {
      return res.status(400).json({ message: 'Attendance action must be check_in or check_out.' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const chef = await getHomeChefProfile(req.user, connection, true);
    if (!chef?.user_id) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ message: 'Home chef profile not found.' });
    }

    const [openSessions] = await connection.execute(
      `SELECT id FROM home_chef_attendance
       WHERE home_chef_user_id = ? AND check_out_at IS NULL
       ORDER BY check_in_at DESC LIMIT 1 FOR UPDATE`,
      [chef.user_id]
    );

    let sessionId;
    let message;
    if (action === 'check_in') {
      if (openSessions.length) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({ message: 'You are already checked in.' });
      }
      const [result] = await connection.execute(
        `INSERT INTO home_chef_attendance
           (home_chef_id, home_chef_user_id, home_chef_name, franchise_admin_id,
            attendance_date, check_in_at)
         VALUES (?, ?, ?, ?, CURDATE(), NOW())`,
        [chef.id, chef.user_id, chef.name || req.user?.name || 'Home Chef',
          chef.created_by || chef.franchise_user_id || null]
      );
      sessionId = result.insertId;
      message = 'Checked in successfully.';
    } else {
      if (!openSessions.length) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({ message: 'There is no active session to check out.' });
      }
      sessionId = openSessions[0].id;
      await connection.execute(
        'UPDATE home_chef_attendance SET check_out_at = NOW() WHERE id = ?',
        [sessionId]
      );
      message = 'Checked out successfully.';
    }

    await connection.commit();
    transactionStarted = false;
    res.status(action === 'check_in' ? 201 : 200).json({
      message,
      attendance: await selectAttendance(chef.user_id),
    });
  } catch (error) {
    if (transactionStarted && connection) await connection.rollback();
    console.error('Home chef attendance save error:', error);
    res.status(500).json({ message: 'Unable to save attendance.' });
  } finally {
    connection?.release();
  }
});

module.exports = router;