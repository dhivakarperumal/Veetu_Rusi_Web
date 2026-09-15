const crypto = require('crypto');
const pool = require('../config/db');

const ADDRESS_FIELDS = [
  'customer_name',
  'customer_email',
  'customer_phone',
  'street_address',
  'city',
  'district',
  'state',
  'country',
  'zip_code'
];

const normalize = (value, fallback = '') => String(value ?? fallback).trim();

const normalizeAddress = (address = {}) => ({
  customer_name: normalize(address.customer_name),
  customer_email: normalize(address.customer_email),
  customer_phone: normalize(address.customer_phone),
  street_address: normalize(address.street_address),
  city: normalize(address.city),
  district: normalize(address.district),
  state: normalize(address.state),
  country: normalize(address.country, 'India') || 'India',
  zip_code: normalize(address.zip_code)
});

const getAddressKey = (address) => crypto
  .createHash('sha256')
  .update(ADDRESS_FIELDS.map((field) => normalize(address[field]).toLowerCase()).join('|'))
  .digest('hex');

const ensureAddressTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_address (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255),
      customer_phone VARCHAR(50),
      street_address TEXT NOT NULL,
      city VARCHAR(100),
      district VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100) DEFAULT 'India',
      zip_code VARCHAR(50),
      address_key CHAR(64) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_address_key (user_id, address_key),
      KEY idx_user_address_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

const saveUserAddress = async (userId, address) => {
  if (!userId) return null;

  const normalized = normalizeAddress(address);
  const addressKey = getAddressKey(normalized);
  await ensureAddressTable();

  await pool.execute(
    `INSERT INTO user_address
      (user_id, customer_name, customer_email, customer_phone, street_address, city, district, state, country, zip_code, address_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      normalized.customer_name,
      normalized.customer_email || null,
      normalized.customer_phone || null,
      normalized.street_address,
      normalized.city || null,
      normalized.district || null,
      normalized.state || null,
      normalized.country,
      normalized.zip_code || null,
      addressKey
    ]
  );
};

const getUserAddresses = async (req, res) => {
  try {
    await ensureAddressTable();
    const userId = req.user?.user_id || req.user?.id;
    const [rows] = await pool.execute(
      'SELECT id, user_id, customer_name, customer_email, customer_phone, street_address, city, district, state, country, zip_code, created_at, updated_at FROM user_address WHERE user_id = ? ORDER BY updated_at DESC, id DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
};

const createUserAddress = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    await saveUserAddress(userId, req.body);
    const [rows] = await pool.execute(
      'SELECT id, user_id, customer_name, customer_email, customer_phone, street_address, city, district, state, country, zip_code, created_at, updated_at FROM user_address WHERE user_id = ? ORDER BY updated_at DESC, id DESC',
      [userId]
    );
    res.status(201).json(rows);
  } catch (error) {
    console.error('Error saving user address:', error);
    res.status(500).json({ message: 'Error saving address', error: error.message });
  }
};

const updateUserAddress = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    const normalized = normalizeAddress(req.body);
    const addressKey = getAddressKey(normalized);
    await ensureAddressTable();
    await pool.execute(
      `UPDATE user_address
       SET customer_name = ?, customer_email = ?, customer_phone = ?, street_address = ?, city = ?, district = ?, state = ?, country = ?, zip_code = ?, address_key = ?
       WHERE id = ? AND user_id = ?`,
      [normalized.customer_name, normalized.customer_email || null, normalized.customer_phone || null, normalized.street_address, normalized.city || null, normalized.district || null, normalized.state || null, normalized.country, normalized.zip_code || null, addressKey, req.params.id, userId]
    );
    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error('Error updating user address:', error);
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
};

const deleteUserAddress = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    await ensureAddressTable();
    await pool.execute('DELETE FROM user_address WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting user address:', error);
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};

module.exports = { ensureAddressTable, saveUserAddress, getUserAddresses, createUserAddress, updateUserAddress, deleteUserAddress };
