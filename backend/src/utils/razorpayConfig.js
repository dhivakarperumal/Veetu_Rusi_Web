const crypto = require('crypto');
const pool = require('../config/db');

const encryptionKey = () => {
  const secret = process.env.RAZORPAY_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'veetu-rusi-razorpay-encryption-fallback-key-32';
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptSecret = (secret) => {
  if (!secret) return '';
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
    return `v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    console.warn('Secret encryption fallback to raw value:', err.message);
    return String(secret);
  }
};

const decryptSecret = (value) => {
  const [version, ivHex, tagHex, encryptedHex] = String(value || '').split(':');
  if (version !== 'v1' || !ivHex || !tagHex || !encryptedHex) {
    throw new Error('Stored Razorpay secret is not in encrypted format.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
};

const decryptStoredSecret = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';
  if (!str.startsWith('v1:')) {
    return str;
  }
  try {
    return decryptSecret(str);
  } catch (err) {
    console.warn('Could not decrypt Razorpay key secret with current key:', err.message);
    return '';
  }
};

const getAssignedRazorpayConfig = async (userIdentity) => {
  const identity = userIdentity == null ? '' : String(userIdentity);
  try {
    const [rows] = await pool.execute(
      `SELECT rk.id, rk.key_id, rk.key_secret
       FROM users u
       INNER JOIN user_razorpay_keys urk ON urk.user_id = u.id
       INNER JOIN razorpay_keys rk ON rk.id = urk.razorpay_key_id
       WHERE (u.id = ? OR u.user_id = ? OR u.email = ?) AND LOWER(rk.status) = 'active'
       LIMIT 1`,
      [identity, identity, identity]
    );
    if (rows.length && rows[0].key_id) {
      const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
      return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {
    console.error('getAssignedRazorpayConfig database error:', err.message);
  }

  // Fallback to active key in database
  try {
    const [fallbackRows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM razorpay_keys
       WHERE LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (fallbackRows.length && fallbackRows[0].key_id) {
      const storedSecret = fallbackRows[0].key_secret ? decryptStoredSecret(fallbackRows[0].key_secret) : '';
      return { id: fallbackRows[0].id, keyId: fallbackRows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {
    console.error('getAssignedRazorpayConfig fallback query error:', err.message);
  }

  throw new Error('Razorpay payment configuration is not assigned for this account in database.');
};

const getUserCheckoutRazorpayConfig = async () => {
  try {
    let [rows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM razorpay_keys
       WHERE (LOWER(TRIM(key_name)) = 'user' OR LOWER(TRIM(key_usage)) = 'user checkout')
         AND LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (!rows.length) {
      [rows] = await pool.execute(
        `SELECT id, key_id, key_secret
         FROM razorpay_keys
         WHERE LOWER(status) = 'active'
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`
      );
    }
    if (rows.length && rows[0].key_id) {
      const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
      return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {
    console.error('getUserCheckoutRazorpayConfig error:', err.message);
  }

  throw new Error('Razorpay User Checkout key is not configured or active in database.');
};

const getUserCheckoutRazorpayKeyId = async () => {
  const config = await getUserCheckoutRazorpayConfig();
  return { id: config.id, keyId: config.keyId };
};

const getFranchiseSubscriptionRazorpayConfig = async () => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM franchise_razorpay_keys
       WHERE LOWER(TRIM(key_usage)) = 'franchise subscription'
         AND LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (rows.length && rows[0].key_id) {
      const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
      return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {
    console.error('getFranchiseSubscriptionRazorpayConfig database error:', err.message);
  }

  // Fallback to active key in razorpay_keys table if franchise_razorpay_keys has no active key
  try {
    const [fallbackRows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM razorpay_keys
       WHERE LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (fallbackRows.length && fallbackRows[0].key_id) {
      const storedSecret = fallbackRows[0].key_secret ? decryptStoredSecret(fallbackRows[0].key_secret) : '';
      return { id: fallbackRows[0].id, keyId: fallbackRows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {
    console.error('getFranchiseSubscriptionRazorpayConfig razorpay_keys fallback error:', err.message);
  }

  throw new Error('Franchise subscription Razorpay key is not configured or active in database.');
};

module.exports = {
  encryptSecret,
  decryptSecret,
  decryptStoredSecret,
  getAssignedRazorpayConfig,
  getUserCheckoutRazorpayConfig,
  getUserCheckoutRazorpayKeyId,
  getFranchiseSubscriptionRazorpayConfig
};