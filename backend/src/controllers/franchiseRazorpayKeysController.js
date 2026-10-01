const pool = require('../config/db');
const { encryptSecret } = require('../utils/razorpayConfig');

const normalizeStatus = (value) => String(value || '').toLowerCase() === 'active' ? 'Active' : 'Inactive';
const normalizeUsage = (value) => ['User Checkout', 'Delivery Partner', 'Home Chef', 'General'].includes(value) ? value : null;
const getOwnerId = (req) => req.franchiseOwner.id;
const getAuditActor = (req) => req.user?.user_id || req.user?.id || req.user?.email || 'system';
const isEncryptionConfigError = (error) => error.message?.startsWith('Configure RAZORPAY_KEY_ENCRYPTION_SECRET');

exports.list = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const [rows] = await pool.execute(
      `SELECT rk.id, rk.key_name, rk.key_id, rk.business_name, rk.key_usage, rk.status,
              rk.created_at, rk.updated_at, rk.created_by, rk.updated_by,
              COUNT(DISTINCT fuk.user_id) AS assigned_count,
              GROUP_CONCAT(DISTINCT COALESCE(NULLIF(u.full_name, ''), u.email) ORDER BY u.full_name SEPARATOR ', ') AS assigned_to
       FROM franchise_razorpay_keys rk
       LEFT JOIN franchise_user_razorpay_keys fuk ON fuk.razorpay_key_id = rk.id
       LEFT JOIN users u ON u.id = fuk.user_id
       WHERE rk.franchise_id = ? ${activeOnly ? "AND LOWER(rk.status) = 'active'" : ''}
       GROUP BY rk.id
       ORDER BY rk.created_at DESC`,
      [getOwnerId(req)]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load franchise Razorpay keys.' });
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
      `INSERT INTO franchise_razorpay_keys
         (franchise_id, franchise_user_id, key_name, key_id, key_secret, business_name, key_usage, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        getOwnerId(req),
        req.franchiseOwner.franch_user_id || req.user.user_id || null,
        String(key_name).trim(),
        String(key_id).trim(),
        encryptSecret(String(key_secret).trim()),
        String(business_name || '').trim() || null,
        keyUsage,
        normalizeStatus(req.body.status || 'Inactive'),
        actor,
        actor,
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Franchise Razorpay key added.' });
  } catch (error) {
    const duplicate = error.code === 'ER_DUP_ENTRY';
    const configError = isEncryptionConfigError(error);
    res.status(duplicate ? 409 : configError ? 503 : 500).json({
      message: duplicate ? 'This franchise Razorpay Key ID is already registered.' : configError ? error.message : 'Unable to add franchise Razorpay key.',
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute(
      'SELECT id FROM franchise_razorpay_keys WHERE id = ? AND franchise_id = ? LIMIT 1',
      [id, getOwnerId(req)]
    );
    if (!existing.length) return res.status(404).json({ message: 'Franchise Razorpay key not found.' });

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
      params.push(encryptSecret(String(key_secret).trim()));
    }
    params.push(id, getOwnerId(req));
    await pool.execute(`UPDATE franchise_razorpay_keys SET ${fields.join(', ')} WHERE id = ? AND franchise_id = ?`, params);
    res.json({ message: 'Franchise Razorpay key updated.' });
  } catch (error) {
    const duplicate = error.code === 'ER_DUP_ENTRY';
    const configError = isEncryptionConfigError(error);
    res.status(duplicate ? 409 : configError ? 503 : 500).json({
      message: duplicate ? 'This franchise Razorpay Key ID is already registered.' : configError ? error.message : 'Unable to update franchise Razorpay key.',
    });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);
    const [result] = await pool.execute(
      'UPDATE franchise_razorpay_keys SET status = ?, updated_by = ? WHERE id = ? AND franchise_id = ?',
      [status, getAuditActor(req), req.params.id, getOwnerId(req)]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Franchise Razorpay key not found.' });
    res.json({ message: `Franchise key ${status.toLowerCase()}.`, status });
  } catch (error) {
    res.status(500).json({ message: 'Unable to change franchise Razorpay key status.' });
  }
};

exports.remove = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      'SELECT id FROM franchise_razorpay_keys WHERE id = ? AND franchise_id = ? LIMIT 1',
      [req.params.id, getOwnerId(req)]
    );
    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Franchise Razorpay key not found.' });
    }
    await connection.execute('DELETE FROM franchise_user_razorpay_keys WHERE razorpay_key_id = ?', [req.params.id]);
    await connection.execute(
      'DELETE FROM franchise_razorpay_keys WHERE id = ? AND franchise_id = ?',
      [req.params.id, getOwnerId(req)]
    );
    await connection.commit();
    res.json({ message: 'Franchise Razorpay key deleted.' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Unable to delete franchise Razorpay key.' });
  } finally {
    connection.release();
  }
};