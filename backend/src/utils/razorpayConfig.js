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
    if (rows.length) {
      const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
      if (storedSecret) {
        return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret };
      }
      if (process.env.RAZORPAY_KEY_ID && rows[0].key_id === process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return { id: rows[0].id, keyId: rows[0].key_id, keySecret: process.env.RAZORPAY_KEY_SECRET };
      }
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
    if (fallbackRows.length) {
      const storedSecret = fallbackRows[0].key_secret ? decryptStoredSecret(fallbackRows[0].key_secret) : '';
      if (storedSecret) {
        return { id: fallbackRows[0].id, keyId: fallbackRows[0].key_id, keySecret: storedSecret };
      }
      if (process.env.RAZORPAY_KEY_ID && fallbackRows[0].key_id === process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return { id: fallbackRows[0].id, keyId: fallbackRows[0].key_id, keySecret: process.env.RAZORPAY_KEY_SECRET };
      }
    }
  } catch (err) {
    console.error('getAssignedRazorpayConfig fallback query error:', err.message);
  }

  // Fallback to environment variables
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return { id: 0, keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET };
  }

  throw new Error('Razorpay payment configuration is not assigned for this account.');
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
    if (rows.length) {
      const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
      if (storedSecret) {
        return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret };
      }
      if (process.env.RAZORPAY_KEY_ID && rows[0].key_id === process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return { id: rows[0].id, keyId: rows[0].key_id, keySecret: process.env.RAZORPAY_KEY_SECRET };
      }
      console.warn(`User checkout key "${rows[0].key_id}" has no valid secret; falling back to environment credentials.`);
    }
  } catch (err) {
    console.error('getUserCheckoutRazorpayConfig error:', err.message);
  }

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return { id: 0, keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET };
  }

  throw new Error('Razorpay User Checkout key is not configured or active.');
};

const getUserCheckoutRazorpayKeyId = async () => {
  try {
    const config = await getUserCheckoutRazorpayConfig();
    return { id: config.id, keyId: config.keyId };
  } catch (err) {
    if (process.env.RAZORPAY_KEY_ID) {
      return { id: 0, keyId: process.env.RAZORPAY_KEY_ID };
    }
    throw new Error('Razorpay User Checkout key is not configured or active.');
  }
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
    if (rows.length) {
      const keyId = rows[0].key_id;
      const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
      if (storedSecret) {
        return { id: rows[0].id, keyId, keySecret: storedSecret };
      }
      if (process.env.RAZORPAY_KEY_ID && keyId === process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return { id: rows[0].id, keyId, keySecret: process.env.RAZORPAY_KEY_SECRET };
      }
      console.warn(`Franchise subscription key "${keyId}" has no valid secret; falling back to environment credentials.`);
    }
  } catch (err) {
    console.error('getFranchiseSubscriptionRazorpayConfig error:', err.message);
  }

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return { id: 0, keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET };
  }

  throw new Error('Franchise subscription payment credentials are not configured on the server.');
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