const pool = require('../config/db');
const { encryptSecret } = require('../utils/razorpayConfig');

const normalizeStatus = (value) => String(value || '').toLowerCase() === 'active' ? 'Active' : 'Inactive';
const normalizeUsage = (value) => ['User Checkout', 'Delivery Partner', 'Home Chef', 'General'].includes(value) ? value : null;
const getAuditActor = (req) => req.user?.user_id || req.user?.id || req.user?.email || 'system';

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const [rows] = await pool.execute(
      `SELECT rk.id, rk.key_name, rk.key_id, rk.business_name, rk.key_usage, rk.status, rk.created_at, rk.updated_at, rk.created_by, rk.updated_by,
              COUNT(DISTINCT u.id) AS assigned_count,
              GROUP_CONCAT(DISTINCT COALESCE(NULLIF(u.full_name, ''), u.email) ORDER BY u.full_name SEPARATOR ', ') AS assigned_to
       FROM razorpay_keys rk
      LEFT JOIN user_razorpay_keys urk ON urk.razorpay_key_id = rk.id
      LEFT JOIN users u ON u.id = urk.user_id
       ${activeOnly ? "WHERE LOWER(rk.status) = 'active'" : ''}
       GROUP BY rk.id ORDER BY rk.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load Razorpay keys.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { key_name, key_id, key_secret, business_name } = req.body;
    const keyUsage = normalizeUsage(req.body.key_usage);
    if (!String(key_name || '').trim() || !String(key_id || '').trim() || !String(key_secret || '').trim()) {
      return res.status(400).json({ message: 'Key name, Key ID, and Key Secret are required.' });
    }
    if (!keyUsage) return res.status(400).json({ message: 'Select a valid Razorpay usage.' });
    const actor = getAuditActor(req);
    const [result] = await pool.execute(
      `INSERT INTO razorpay_keys (key_name, key_id, key_secret, business_name, key_usage, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [String(key_name).trim(), String(key_id).trim(), encryptSecret(String(key_secret)), String(business_name || '').trim() || null, keyUsage, normalizeStatus(req.body.status || 'Inactive'), actor, actor]
    );
    res.status(201).json({ id: result.insertId, message: 'Razorpay key added.' });
  } catch (error) {
    const duplicate = error.code === 'ER_DUP_ENTRY';
    const configError = error.message?.startsWith('Configure RAZORPAY_KEY_ENCRYPTION_SECRET');
    res.status(duplicate ? 409 : configError ? 503 : 500).json({ message: duplicate ? 'This Razorpay Key ID is already registered.' : configError ? error.message : 'Unable to add Razorpay key.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT id FROM razorpay_keys WHERE id = ? LIMIT 1', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Razorpay key not found.' });
    const { key_name, key_id, key_secret, business_name } = req.body;
    const keyUsage = normalizeUsage(req.body.key_usage);
    if (!String(key_name || '').trim() || !String(key_id || '').trim()) {
      return res.status(400).json({ message: 'Key name and Key ID are required.' });
    }
    if (!keyUsage) return res.status(400).json({ message: 'Select a valid Razorpay usage.' });
    const fields = ['key_name = ?', 'key_id = ?', 'business_name = ?', 'key_usage = ?', 'status = ?', 'updated_by = ?'];
    const params = [String(key_name).trim(), String(key_id).trim(), String(business_name || '').trim() || null, keyUsage, normalizeStatus(req.body.status), getAuditActor(req)];
    if (String(key_secret || '').trim()) {
      fields.push('key_secret = ?');
      params.push(encryptSecret(String(key_secret)));
    }
    params.push(id);
    await pool.execute(`UPDATE razorpay_keys SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Razorpay key updated.' });
  } catch (error) {
    const duplicate = error.code === 'ER_DUP_ENTRY';
    const configError = error.message?.startsWith('Configure RAZORPAY_KEY_ENCRYPTION_SECRET');
    res.status(duplicate ? 409 : configError ? 503 : 500).json({ message: duplicate ? 'This Razorpay Key ID is already registered.' : configError ? error.message : 'Unable to update Razorpay key.' });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);
    const [result] = await pool.execute('UPDATE razorpay_keys SET status = ?, updated_by = ? WHERE id = ?', [status, getAuditActor(req), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Razorpay key not found.' });
    res.json({ message: `Razorpay key ${status.toLowerCase()}.`, status });
  } catch (error) {
    res.status(500).json({ message: 'Unable to change Razorpay key status.' });
  }
};

exports.remove = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM razorpay_keys WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Razorpay key not found.' });
    }
    await connection.execute('DELETE FROM user_razorpay_keys WHERE razorpay_key_id = ?', [req.params.id]);
    await connection.execute('DELETE FROM razorpay_keys WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.json({ message: 'Razorpay key deleted and user assignments cleared.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Unable to delete Razorpay key.' });
  } finally {
    connection.release();
  }
};

exports.getUserKey = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT rk.id, rk.key_name, rk.key_id, rk.business_name, rk.status
      FROM users u
      LEFT JOIN user_razorpay_keys urk ON urk.user_id = u.id
      LEFT JOIN razorpay_keys rk ON rk.id = urk.razorpay_key_id
       WHERE u.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json(rows[0].id ? rows[0] : null);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load the user Razorpay key.' });
  }
};

exports.assignUserKey = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [req.params.id]);
    if (!users.length) return res.status(404).json({ message: 'User not found.' });
    const keyId = req.body.razorpay_key_id == null || req.body.razorpay_key_id === '' ? null : Number(req.body.razorpay_key_id);
    if (keyId !== null) {
      if (!Number.isInteger(keyId) || keyId < 1) return res.status(400).json({ message: 'Invalid Razorpay key.' });
      const [keys] = await pool.execute('SELECT id FROM razorpay_keys WHERE id = ? AND LOWER(status) = \'active\' LIMIT 1', [keyId]);
      if (!keys.length) return res.status(400).json({ message: 'Select an active Razorpay key.' });
    }
    if (keyId === null) {
      await pool.execute('DELETE FROM user_razorpay_keys WHERE user_id = ?', [req.params.id]);
    } else {
      await pool.execute(
        `INSERT INTO user_razorpay_keys (user_id, razorpay_key_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE razorpay_key_id = VALUES(razorpay_key_id)`,
        [req.params.id, keyId]
      );
    }
    res.json({ message: keyId ? 'Razorpay key assigned to user.' : 'Razorpay key assignment removed.', razorpay_key_id: keyId });
  } catch (error) {
    res.status(500).json({ message: 'Unable to assign the Razorpay key.' });
  }
};