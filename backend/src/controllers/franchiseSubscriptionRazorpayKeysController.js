const pool = require('../config/db');
const { encryptSecret } = require('../utils/razorpayConfig');

const KEY_USAGE = 'Franchise Subscription';
const normalizeStatus = (value) => String(value || '').toLowerCase() === 'active' ? 'Active' : 'Inactive';
const getAuditActor = (req) => req.user?.user_id || req.user?.id || req.user?.email || 'system';
const isEncryptionConfigError = (error) => error.message?.startsWith('Configure RAZORPAY_KEY_ENCRYPTION_SECRET');

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const [rows] = await pool.execute(
      `SELECT id, key_name, key_id, business_name, key_usage, status, created_at, updated_at, created_by, updated_by
       FROM franchise_razorpay_keys
       WHERE LOWER(TRIM(key_usage)) = LOWER(?) ${activeOnly ? "AND LOWER(status) = 'active'" : ''}
       ORDER BY created_at DESC`,
      [KEY_USAGE]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load franchise subscription Razorpay keys.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { key_name, key_id, key_secret, business_name } = req.body;
    const cleanKeyName = String(key_name || '').trim();
    const cleanKeyId = String(key_id || '').trim();
    const cleanSecret = String(key_secret || '').trim();
    if (!cleanKeyName || !cleanKeyId) {
      return res.status(400).json({ message: 'Key name and Key ID are required.' });
    }
    if (!cleanSecret && cleanKeyId !== process.env.RAZORPAY_KEY_ID) {
      return res.status(400).json({ message: 'Razorpay Key Secret is required when registering a custom Key ID.' });
    }
    const [existing] = await pool.execute('SELECT id FROM franchise_razorpay_keys WHERE key_id = ? LIMIT 1', [cleanKeyId]);
    if (existing.length) return res.status(409).json({ message: 'This franchise subscription Key ID is already registered.' });

    const finalSecret = cleanSecret || (cleanKeyId === process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_SECRET || '' : '');
    const actor = getAuditActor(req);
    const [result] = await pool.execute(
      `INSERT INTO franchise_razorpay_keys
         (franchise_id, franchise_user_id, key_name, key_id, key_secret, business_name, key_usage, status, created_by, updated_by)
       VALUES (NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cleanKeyName, cleanKeyId, finalSecret ? encryptSecret(finalSecret) : null, String(business_name || '').trim() || null, KEY_USAGE, normalizeStatus(req.body.status || 'Inactive'), actor, actor]
    );
    res.status(201).json({ id: result.insertId, message: 'Franchise subscription Razorpay key added.' });
  } catch (error) {
    const configError = isEncryptionConfigError(error);
    res.status(configError ? 503 : 500).json({ message: configError ? error.message : 'Unable to add franchise subscription Razorpay key.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute(
      `SELECT id, key_id FROM franchise_razorpay_keys WHERE id = ? AND LOWER(TRIM(key_usage)) = LOWER(?) LIMIT 1`,
      [id, KEY_USAGE]
    );
    if (!existing.length) return res.status(404).json({ message: 'Franchise subscription Razorpay key not found.' });

    const { key_name, key_id, key_secret, business_name } = req.body;
    const cleanKeyName = String(key_name || '').trim();
    const cleanKeyId = String(key_id || '').trim();
    const cleanSecret = String(key_secret || '').trim();
    if (!cleanKeyName || !cleanKeyId) {
      return res.status(400).json({ message: 'Key name and Key ID are required.' });
    }
    const [duplicate] = await pool.execute('SELECT id FROM franchise_razorpay_keys WHERE key_id = ? AND id <> ? LIMIT 1', [cleanKeyId, id]);
    if (duplicate.length) return res.status(409).json({ message: 'This franchise subscription Key ID is already registered.' });

    if (existing[0].key_id !== cleanKeyId && !cleanSecret && cleanKeyId !== process.env.RAZORPAY_KEY_ID) {
      return res.status(400).json({ message: 'Razorpay Key Secret is required when changing to a custom Key ID.' });
    }

    const fields = ['key_name = ?', 'key_id = ?', 'business_name = ?', 'status = ?', 'updated_by = ?'];
    const params = [cleanKeyName, cleanKeyId, String(business_name || '').trim() || null, normalizeStatus(req.body.status), getAuditActor(req)];
    if (cleanSecret) {
      fields.push('key_secret = ?');
      params.push(encryptSecret(cleanSecret));
    } else if (cleanKeyId === process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      fields.push('key_secret = ?');
      params.push(encryptSecret(process.env.RAZORPAY_KEY_SECRET));
    }
    params.push(id, KEY_USAGE);
    await pool.execute(
      `UPDATE franchise_razorpay_keys SET ${fields.join(', ')} WHERE id = ? AND LOWER(TRIM(key_usage)) = LOWER(?)`,
      params
    );
    res.json({ message: 'Franchise subscription Razorpay key updated.' });
  } catch (error) {
    const configError = isEncryptionConfigError(error);
    res.status(configError ? 503 : 500).json({ message: configError ? error.message : 'Unable to update franchise subscription Razorpay key.' });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);
    const [result] = await pool.execute(
      `UPDATE franchise_razorpay_keys SET status = ?, updated_by = ?
       WHERE id = ? AND LOWER(TRIM(key_usage)) = LOWER(?)`,
      [status, getAuditActor(req), req.params.id, KEY_USAGE]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Franchise subscription Razorpay key not found.' });
    res.json({ message: `Franchise subscription key ${status.toLowerCase()}.`, status });
  } catch (error) {
    res.status(500).json({ message: 'Unable to change franchise subscription Razorpay key status.' });
  }
};

exports.remove = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      `SELECT id FROM franchise_razorpay_keys WHERE id = ? AND LOWER(TRIM(key_usage)) = LOWER(?) LIMIT 1`,
      [req.params.id, KEY_USAGE]
    );
    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Franchise subscription Razorpay key not found.' });
    }
    await connection.execute('DELETE FROM franchise_user_razorpay_keys WHERE razorpay_key_id = ?', [req.params.id]);
    await connection.execute(
      `DELETE FROM franchise_razorpay_keys WHERE id = ? AND LOWER(TRIM(key_usage)) = LOWER(?)`,
      [req.params.id, KEY_USAGE]
    );
    await connection.commit();
    res.json({ message: 'Franchise subscription Razorpay key deleted.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Unable to delete franchise subscription Razorpay key.' });
  } finally {
    connection.release();
  }
};