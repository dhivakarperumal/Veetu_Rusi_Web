const pool = require('../config/db');
const { encryptSecret, getFranchiseAdminIdentifiers, resolveFranchiseAdminId } = require('../utils/razorpayConfig');

const normalizeStatus = (value) => String(value || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
const normalizeUsage = (value) => ['User Checkout', 'Delivery Partner', 'Home Chef', 'General'].includes(value) ? value : null;
const getAuditActor = async (req) => {
  const actor = req.user?.user_id || req.user?.id || req.user?.email || 'system';
  if (req.user?.role !== 'admin') return actor;

  const identifiers = await getFranchiseAdminIdentifiers(actor);
  return identifiers.find((identifier) => /^FRAN-/i.test(identifier))
    || await resolveFranchiseAdminId({ userId: actor, userRole: req.user.role })
    || actor;
};

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const conditions = [];
    const params = [];

    if (activeOnly) {
      conditions.push("LOWER(rk.status) = 'active'");
    }

    if (req.user?.role === 'admin') {
      const actorId = req.user.user_id || req.user.id || req.user.email;
      const identifiers = await getFranchiseAdminIdentifiers(actorId);
      if (identifiers.length) {
        const ph = identifiers.map(() => '?').join(', ');
        conditions.push(`(rk.created_by IN (${ph}) OR rk.updated_by IN (${ph}))`);
        params.push(...identifiers, ...identifiers);
      } else {
        conditions.push('(rk.created_by = ? OR rk.created_by = ?)');
        params.push(actorId, req.user.email || actorId);
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT rk.id, rk.key_name, rk.key_id, rk.business_name, rk.key_usage, rk.status, rk.created_at, rk.updated_at, rk.created_by, rk.updated_by,
              COUNT(DISTINCT u.id) AS assigned_count,
              GROUP_CONCAT(DISTINCT COALESCE(NULLIF(u.full_name, ''), u.email) ORDER BY u.full_name SEPARATOR ', ') AS assigned_to
       FROM razorpay_keys rk
      LEFT JOIN user_razorpay_keys urk ON urk.razorpay_key_id = rk.id
      LEFT JOIN users u ON u.id = urk.user_id
       ${whereClause}
       GROUP BY rk.id ORDER BY rk.created_at DESC`,
      params
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
    if (!String(key_name || '').trim() || !String(key_id || '').trim()) {
      return res.status(400).json({ message: 'Key name and Key ID are required.' });
    }
    if (!/^rzp_(test|live)_[a-zA-Z0-9]{14,}$/i.test(String(key_id).trim())) {
      return res.status(400).json({ message: 'Invalid Razorpay Key ID. It must start with rzp_test_ or rzp_live_ followed by 14 alphanumeric characters.' });
    }
    if (!keyUsage) return res.status(400).json({ message: 'Select a valid Razorpay usage.' });
    const actor = await getAuditActor(req);
    const secretVal = String(key_secret || '').trim() ? encryptSecret(String(key_secret).trim()) : '';
    const [result] = await pool.execute(
      `INSERT INTO razorpay_keys (key_name, key_id, key_secret, business_name, key_usage, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [String(key_name).trim(), String(key_id).trim(), secretVal, String(business_name || '').trim() || null, keyUsage, normalizeStatus(req.body.status || 'Active'), actor, actor]
    );
    res.status(201).json({ id: result.insertId, message: 'Razorpay key added.' });
  } catch (error) {
    const configError = error.message?.startsWith('Configure RAZORPAY_KEY_ENCRYPTION_SECRET');
    res.status(configError ? 503 : 500).json({ message: configError ? error.message : 'Unable to add Razorpay key.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    let findQuery = 'SELECT id, created_by FROM razorpay_keys WHERE id = ?';
    const findParams = [id];
    if (req.user?.role === 'admin') {
      const actorId = req.user.user_id || req.user.id || req.user.email;
      const identifiers = await getFranchiseAdminIdentifiers(actorId);
      if (identifiers.length) {
        const ph = identifiers.map(() => '?').join(', ');
        findQuery += ` AND (created_by IN (${ph}) OR updated_by IN (${ph}))`;
        findParams.push(...identifiers, ...identifiers);
      } else {
        findQuery += ' AND (created_by = ? OR created_by = ?)';
        findParams.push(actorId, req.user.email || actorId);
      }
    }
    const [existing] = await pool.execute(findQuery + ' LIMIT 1', findParams);
    if (!existing.length) return res.status(404).json({ message: 'Razorpay key not found.' });
    const { key_name, key_id, key_secret, business_name } = req.body;
    const keyUsage = normalizeUsage(req.body.key_usage);
    if (!String(key_name || '').trim() || !String(key_id || '').trim()) {
      return res.status(400).json({ message: 'Key name and Key ID are required.' });
    }
    if (!/^rzp_(test|live)_[a-zA-Z0-9]{14,}$/i.test(String(key_id).trim())) {
      return res.status(400).json({ message: 'Invalid Razorpay Key ID. It must start with rzp_test_ or rzp_live_ followed by 14 alphanumeric characters.' });
    }
    if (!keyUsage) return res.status(400).json({ message: 'Select a valid Razorpay usage.' });
    const fields = ['key_name = ?', 'key_id = ?', 'business_name = ?', 'key_usage = ?', 'status = ?', 'updated_by = ?'];
    const params = [String(key_name).trim(), String(key_id).trim(), String(business_name || '').trim() || null, keyUsage, normalizeStatus(req.body.status || 'Active'), await getAuditActor(req)];
    if (String(key_secret || '').trim()) {
      fields.push('key_secret = ?');
      params.push(encryptSecret(String(key_secret)));
    }
    params.push(id);
    await pool.execute(`UPDATE razorpay_keys SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Razorpay key updated.' });
  } catch (error) {
    const configError = error.message?.startsWith('Configure RAZORPAY_KEY_ENCRYPTION_SECRET');
    res.status(configError ? 503 : 500).json({ message: configError ? error.message : 'Unable to update Razorpay key.' });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);
    let updateQuery = 'UPDATE razorpay_keys SET status = ?, updated_by = ? WHERE id = ?';
    const updateParams = [status, await getAuditActor(req), req.params.id];
    if (req.user?.role === 'admin') {
      const actorId = req.user.user_id || req.user.id || req.user.email;
      const identifiers = await getFranchiseAdminIdentifiers(actorId);
      if (identifiers.length) {
        const ph = identifiers.map(() => '?').join(', ');
        updateQuery += ` AND (created_by IN (${ph}) OR updated_by IN (${ph}))`;
        updateParams.push(...identifiers, ...identifiers);
      } else {
        updateQuery += ' AND (created_by = ? OR created_by = ?)';
        updateParams.push(actorId, req.user.email || actorId);
      }
    }
    const [result] = await pool.execute(updateQuery, updateParams);
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
    let findQuery = 'SELECT id FROM razorpay_keys WHERE id = ?';
    const findParams = [req.params.id];
    if (req.user?.role === 'admin') {
      const actorId = req.user.user_id || req.user.id || req.user.email;
      const identifiers = await getFranchiseAdminIdentifiers(actorId);
      if (identifiers.length) {
        const ph = identifiers.map(() => '?').join(', ');
        findQuery += ` AND (created_by IN (${ph}) OR updated_by IN (${ph}))`;
        findParams.push(...identifiers, ...identifiers);
      } else {
        findQuery += ' AND (created_by = ? OR created_by = ?)';
        findParams.push(actorId, req.user.email || actorId);
      }
    }
    const [existing] = await connection.execute(findQuery + ' LIMIT 1', findParams);
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