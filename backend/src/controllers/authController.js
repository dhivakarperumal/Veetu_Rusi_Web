const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateRoleId } = require('../utils/idGenerator');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name || user.full_name || user.fullName || null,
      phone: user.phone || user.mobile_number || user.mobile || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function validateFranchiseAdminLogin(user) {
  if (!user || user.role !== 'admin' || !user.email) return null;
  const [rows] = await pool.execute(
    'SELECT id, status, expiry_date FROM franchise_owners WHERE email = ? LIMIT 1',
    [user.email]
  );
  if (!rows.length) return null;

  const franchise = rows[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (franchise.expiry_date) {
    const expiry = new Date(franchise.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    if (expiry < today) {
      return 'Your franchise subscription has expired. Please renew to continue.';
    }
  }

  if (franchise.status !== 'Active') {
    return 'Your franchise status is not active. Please contact support.';
  }

  return null;
}

exports.register = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required.' });
    }

    const [existing] = await pool.execute('SELECT id FROM `users` WHERE email = ? OR full_name = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email or username already registered.' });
    }

    const hashedPassword = hashPassword(password);
    const role = 'user';
    const userId = generateRoleId(role);

    const [result] = await pool.execute(
      'INSERT INTO `users` (user_id, full_name, email, mobile_number, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, email, phone || null, hashedPassword, role]
    );

    const user = {
      id: result.insertId,
      user_id: userId,
      name: username,
      email,
      phone: phone || null,
      role: role,
    };

    return res.status(201).json({ message: 'Registration successful', user });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required.' });
    }

    const hashedPassword = hashPassword(password);
    const [users] = await pool.execute(
      'SELECT id, user_id, full_name as name, email, mobile_number as phone, role, status FROM `users` WHERE (email = ? OR full_name = ?) AND password = ?',
      [identifier, identifier, hashedPassword]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = users[0];
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
    }

    const subscriptionError = await validateFranchiseAdminLogin(user);
    if (subscriptionError) {
      return res.status(403).json({ message: subscriptionError });
    }

    const token = createToken(user);

    return res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.profile = async (req, res) => {
  try {
    const { email, role } = req.user;
    const response = {
      user: req.user,
    };

    if (role === 'chef') {
      const [rows] = await pool.execute('SELECT * FROM home_chefs WHERE email = ? LIMIT 1', [email]);
      if (rows.length > 0) {
        response.homeChef = rows[0];
      }
    }

    if (role === 'admin') {
      const [rows] = await pool.execute('SELECT id, franchise_id, franchise_name, status FROM franchise_owners WHERE email = ? LIMIT 1', [email]);
      if (rows.length > 0) {
        response.franchise = rows[0];
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Server error while fetching profile.' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { name, email, picture, googleId } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Google login requires name and email.' });
    }

    const [existing] = await pool.execute('SELECT id, user_id, full_name as name, email, mobile_number as phone, role, status FROM `users` WHERE email = ?', [email]);
    let user;

    if (existing.length > 0) {
      user = existing[0];
      if (user.status !== 'Active') {
        return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
      }
    } else {
      const role = 'user';
      const userId = generateRoleId(role);
      const [result] = await pool.execute(
        'INSERT INTO `users` (user_id, full_name, email, mobile_number, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, email, null, hashPassword(googleId || crypto.randomUUID()), role]
      );
      user = {
        id: result.insertId,
        user_id: userId,
        name,
        email,
        phone: null,
        role: role,
      };
    }

    const token = createToken(user);
    return res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
