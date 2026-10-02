const pool = require('../config/db');
const { encryptSecret } = require('../utils/razorpayConfig');

const KEY_USAGES = ['User Checkout', 'Delivery Partner', 'Home Chef', 'General', 'Franchise Subscription'];
const normalizeStatus = (value) => String(value || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
const getAuditActor = (req) => req.user?.user_id || req.user?.id || req.user?.email || 'system';
const isEncryptionConfigError = (error) => error.message?.startsWith('Configure RAZORPAY_KEY_ENCRYPTION_SECRET');

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const [rows] = await pool.execute(
      `SELECT rk.id, rk.franchise_id, rk.franchise_user_id, rk.key_name, rk.key_id, rk.business_name,
              rk.key_usage, rk.status, rk.created_at, rk.updated_at, rk.created_by, rk.updated_by,
              COUNT(DISTINCT u.id) AS assigned_count
       FROM franchise_razorpay_keys rk
       LEFT JOIN franchise_user_razorpay_keys urk ON urk.razorpay_key_id = rk.id
       LEFT JOIN users u ON u.id = urk.user_id
       ${activeOnly ? "WHERE LOWER(rk.status) = 'active'" : ''}
       GROUP BY rk.id
       ORDER BY rk.created_at DESC`,
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load franchise Razorpay keys.' });
  }
};

exports.create = async (req, res) => {
  try {
    const keyName = String(req.body.key_name || '').trim();
    const keyId = String(req.body.key_id || '').trim();
    const keySecret = String(req.body.key_secret || '').trim();
    const keyUsage = String(req.body.key_usage || '').trim();
    if (!keyName || !keyId) {
      return res.status(400).json({ message: 'Key name and Key ID are required.' });
    }
    if (!KEY_USAGES.includes(keyUsage)) {
      return res.status(400).json({ message: 'Select a valid Razorpay usage.' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM franchise_razorpay_keys WHERE key_id = ? LIMIT 1',
      [keyId]
    );
    if (existing.length) return res.status(409).json({ message: 'This franchise Razorpay Key ID is already registered.' });

    const actor = getAuditActor(req);
    const [result] = await pool.execute(
      `INSERT INTO franchise_razorpay_keys
         (franchise_id, franchise_user_id, key_name, key_id, key_secret, business_name, key_usage, status, created_by, updated_by)
       VALUES (NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        keyName,
        keyId,
        keySecret ? encryptSecret(keySecret) : null,
        String(req.body.business_name || '').trim() || null,
        keyUsage,
        normalizeStatus(req.body.status || 'Inactive'),
        actor,
        actor,
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Franchise Razorpay key added.' });
  } catch (error) {
    const configError = isEncryptionConfigError(error);
    res.status(configError ? 503 : 500).json({
      message: configError ? error.message : 'Unable to add franchise Razorpay key.',
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute(
      'SELECT id FROM franchise_razorpay_keys WHERE id = ? LIMIT 1',
      [id]
    );
    if (!existing.length) return res.status(404).json({ message: 'Franchise Razorpay key not found.' });

    const keyName = String(req.body.key_name || '').trim();
    const keyId = String(req.body.key_id || '').trim();
    const keySecret = String(req.body.key_secret || '').trim();
    const keyUsage = String(req.body.key_usage || '').trim();
    if (!keyName || !keyId) {
      return res.status(400).json({ message: 'Key name and Key ID are required.' });
    }
    if (!KEY_USAGES.includes(keyUsage)) {
      return res.status(400).json({ message: 'Select a valid Razorpay usage.' });
    }

    const [duplicate] = await pool.execute(
      'SELECT id FROM franchise_razorpay_keys WHERE key_id = ? AND id <> ? LIMIT 1',
      [keyId, id]
    );
    if (duplicate.length) return res.status(409).json({ message: 'This franchise Razorpay Key ID is already registered.' });

    const fields = ['key_name = ?', 'key_id = ?', 'business_name = ?', 'key_usage = ?', 'status = ?', 'updated_by = ?'];
    const params = [
      keyName,
      keyId,
      String(req.body.business_name || '').trim() || null,
      keyUsage,
      normalizeStatus(req.body.status),
      getAuditActor(req),
    ];
    if (keySecret) {
      fields.push('key_secret = ?');
      params.push(encryptSecret(keySecret));
    }
    params.push(id);
    await pool.execute(`UPDATE franchise_razorpay_keys SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Franchise Razorpay key updated.' });
  } catch (error) {
    const configError = isEncryptionConfigError(error);
    res.status(configError ? 503 : 500).json({
      message: configError ? error.message : 'Unable to update franchise Razorpay key.',
    });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);
    const [result] = await pool.execute(
      'UPDATE franchise_razorpay_keys SET status = ?, updated_by = ? WHERE id = ?',
      [status, getAuditActor(req), req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Franchise Razorpay key not found.' });
    res.json({ message: `Franchise Razorpay key ${status.toLowerCase()}.`, status });
  } catch (error) {
    res.status(500).json({ message: 'Unable to change franchise Razorpay key status.' });
  }
};

exports.remove = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      'SELECT id FROM franchise_razorpay_keys WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Franchise Razorpay key not found.' });
    }

    await connection.execute(
      'DELETE FROM franchise_user_razorpay_keys WHERE razorpay_key_id = ?',
      [req.params.id]
    );
    await connection.execute('DELETE FROM franchise_razorpay_keys WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.json({ message: 'Franchise Razorpay key deleted.' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Unable to delete franchise Razorpay key.' });
  } finally {
    if (connection) connection.release();
  }
};
