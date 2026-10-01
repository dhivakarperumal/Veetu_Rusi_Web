const crypto = require('crypto');
const pool = require('../config/db');

const encryptionKey = () => {
  const secret = process.env.RAZORPAY_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!secret || secret === 'default-secret') {
    throw new Error('Configure RAZORPAY_KEY_ENCRYPTION_SECRET or a strong JWT_SECRET before managing Razorpay keys.');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptSecret = (secret) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptSecret = (value) => {
  const [version, ivHex, tagHex, encryptedHex] = String(value || '').split(':');
  if (version !== 'v1' || !ivHex || !tagHex || !encryptedHex) {
    throw new Error('Stored Razorpay secret cannot be decrypted.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
};

const getAssignedRazorpayConfig = async (userIdentity) => {
  const identity = userIdentity == null ? '' : String(userIdentity);
  const [rows] = await pool.execute(
    `SELECT rk.id, rk.key_id, rk.key_secret
     FROM users u
     INNER JOIN razorpay_keys rk ON rk.id = u.razorpay_key_id
    WHERE (u.id = ? OR u.user_id = ? OR u.email = ?) AND LOWER(rk.status) = 'active'
     LIMIT 1`,
      [identity, identity, identity]
  );
  if (!rows.length) {
    throw new Error('Razorpay payment configuration is not assigned for this account.');
  }
  return { id: rows[0].id, keyId: rows[0].key_id, keySecret: decryptSecret(rows[0].key_secret) };
};

module.exports = { encryptSecret, decryptSecret, getAssignedRazorpayConfig };