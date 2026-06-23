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
    const { id, role, email } = req.user;

    const [users] = await pool.execute(
      `SELECT id, user_id, full_name AS username, full_name AS name, email, mobile_number AS phone, role, status, profile_image, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const response = {
      user: users[0],
    };

    if (role === 'chef' || role === 'homechef') {
      const userId = users[0].user_id;
      const [rows] = await pool.execute('SELECT * FROM home_chefs WHERE user_id = ? OR email = ? LIMIT 1', [userId, email || '']);
      if (rows.length > 0) {
        response.homeChef = rows[0];
      }
    }

    if (role === 'admin') {
      const [rows] = await pool.execute('SELECT id, franchise_id, franchise_name, franch_user_id, status FROM franchise_owners WHERE email = ? LIMIT 1', [email]);
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

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, name, email, phone, street_address, city, district, state, country, zip_code } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required.' });
    }

    const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ? AND id <> ?', [email, userId]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }

    const [columns] = await pool.execute('SHOW COLUMNS FROM `users`');
    const availableColumns = columns.map((column) => column.Field);

    const updateFields = [
      { field: 'full_name', value: username },
      { field: 'email', value: email },
      { field: 'mobile_number', value: phone || null },
    ];

    if (availableColumns.includes('street_address')) updateFields.push({ field: 'street_address', value: street_address || null });
    if (availableColumns.includes('city')) updateFields.push({ field: 'city', value: city || null });
    if (availableColumns.includes('district')) updateFields.push({ field: 'district', value: district || null });
    if (availableColumns.includes('state')) updateFields.push({ field: 'state', value: state || null });
    if (availableColumns.includes('country')) updateFields.push({ field: 'country', value: country || null });
    if (availableColumns.includes('zip_code')) updateFields.push({ field: 'zip_code', value: zip_code || null });

    const setClause = updateFields.map((item) => '`' + item.field + '` = ?').join(', ');
    const values = updateFields.map((item) => item.value).concat([userId]);

    await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, values);

    const [updatedRows] = await pool.execute(
      'SELECT id, user_id, full_name AS username, full_name AS name, email, mobile_number AS phone, role, status, profile_image, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    return res.status(200).json({ message: 'Profile updated successfully', user: updatedRows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error while updating profile.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const hashedCurrent = hashPassword(currentPassword);
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (rows[0].password !== hashedCurrent) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hashedNew = hashPassword(newPassword);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNew, userId]);

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error while changing password.' });
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

// ── Forgot Password ──────────────────────────────────────────────────────
const resetTokens = new Map(); // In-memory store: token -> { email, expiresAt }

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const [users] = await pool.execute('SELECT id, email FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    // Generate a reset token
    const resetToken = crypto.randomUUID();
    resetTokens.set(resetToken, { email, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 min expiry

    return res.status(200).json({ message: 'Email verified', resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) return res.status(400).json({ message: 'Token and password are required.' });

    const tokenData = resetTokens.get(resetToken);
    if (!tokenData) return res.status(400).json({ message: 'Invalid or expired reset token.' });

    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(resetToken);
      return res.status(400).json({ message: 'Reset token has expired. Please try again.' });
    }

    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const hashedPassword = hashPassword(password);
    await pool.execute('UPDATE users SET password = ?, status = ? WHERE email = ?', [hashedPassword, 'Active', tokenData.email]);

    resetTokens.delete(resetToken);
    return res.status(200).json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
