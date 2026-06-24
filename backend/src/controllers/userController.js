const crypto = require('crypto');
const pool = require('../config/db');
const { generateRoleId } = require('../utils/idGenerator');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

exports.createUser = async (req, res) => {
  try {
    const { full_name, mobile_number, email, password, role, profile_image, status, district, area, pincode, latitude, longitude, location_name } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: 'Full name, email, password, and role are required.' });
    }

    const [existing] = await pool.execute('SELECT id FROM `users` WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = hashPassword(password);
    const userId = generateRoleId(role);
    const userStatus = status || 'Active';

    const [result] = await pool.execute(
      'INSERT INTO `users` (user_id, full_name, email, mobile_number, password, profile_image, role, status, district, area, pincode, latitude, longitude, location_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, full_name, email, mobile_number || null, hashedPassword, profile_image || null, role, userStatus, district || null, area || null, pincode || null, latitude || null, longitude || null, location_name || null]
    );

    const user = {
      id: result.insertId,
      user_id: userId,
      full_name,
      email,
      mobile_number: mobile_number || null,
      profile_image: profile_image || null,
      role,
      status: userStatus,
      district: district || null,
      area: area || null,
      pincode: pincode || null,
      latitude: latitude || null,
      longitude: longitude || null,
      location_name: location_name || null
    };

    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit, search, role, status } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, user_id, full_name, email, mobile_number, profile_image, role, status, latitude, longitude, location_name, pincode, district, area, created_at, updated_at FROM `users` WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM `users` WHERE 1=1';
    const queryParams = [];

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR user_id LIKE ?)';
      countQuery += ' AND (full_name LIKE ? OR email LIKE ? OR user_id LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      queryParams.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    queryParams.push(limit.toString(), offset.toString());

    // Fix query execution with limit/offset which requires numbers or proper formatting
    // pool.execute with strings for LIMIT/OFFSET can cause issues in strict mode, but prepared statements typically handle it if sent as string.
    // However, it's safer to use pool.query for limit/offset or cast them.
    // Using pool.query allows proper parameter substitution for LIMIT
    const [users] = await pool.query(query, queryParams.map(p => {
      // Convert numeric strings back to numbers for LIMIT/OFFSET to avoid syntax error
      if (!isNaN(p) && typeof p === 'string' && (query.endsWith('OFFSET ?') || query.includes('LIMIT ?'))) {
          return parseInt(p);
      }
      return p;
    }));

    return res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Lightweight list for admin UI (returns array of users)
exports.listAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, user_id, full_name AS name, email, mobile_number AS phone, role, status, created_at FROM `users` ORDER BY created_at DESC');
    return res.status(200).json(users);
  } catch (error) {
    console.error('List all users error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute(
      'SELECT id, user_id, full_name, email, mobile_number, profile_image, role, status, latitude, longitude, location_name, pincode, district, area, created_at, updated_at FROM `users` WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, mobile_number, profile_image, status, role, latitude, longitude, location_name, pincode, district, area } = req.body;

    const [users] = await pool.execute('SELECT id FROM `users` WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let updateQuery = 'UPDATE `users` SET ';
    const updateParams = [];

    if (full_name !== undefined) {
      updateQuery += 'full_name = ?, ';
      updateParams.push(full_name);
    }
    if (mobile_number !== undefined) {
      updateQuery += 'mobile_number = ?, ';
      updateParams.push(mobile_number);
    }
    if (profile_image !== undefined) {
      updateQuery += 'profile_image = ?, ';
      updateParams.push(profile_image);
    }
    if (status !== undefined) {
      updateQuery += 'status = ?, ';
      updateParams.push(status);
    }
    if (role !== undefined) {
      updateQuery += 'role = ?, ';
      updateParams.push(role);
    }
    if (latitude !== undefined) {
      updateQuery += 'latitude = ?, ';
      updateParams.push(latitude);
    }
    if (longitude !== undefined) {
      updateQuery += 'longitude = ?, ';
      updateParams.push(longitude);
    }
    if (location_name !== undefined) {
      updateQuery += 'location_name = ?, ';
      updateParams.push(location_name);
    }
    if (pincode !== undefined) {
      updateQuery += 'pincode = ?, ';
      updateParams.push(pincode);
    }
    if (district !== undefined) {
      updateQuery += 'district = ?, ';
      updateParams.push(district);
    }
    if (area !== undefined) {
      updateQuery += 'area = ?, ';
      updateParams.push(area);
    }

    if (updateParams.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
    updateParams.push(id);

    await pool.execute(updateQuery, updateParams);

    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute('SELECT id FROM `users` WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.execute('DELETE FROM `users` WHERE id = ?', [id]);

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserDashboardStats = async (req, res) => {
  try {
    const [totalUsersRes] = await pool.execute('SELECT COUNT(*) as count FROM `users`');
    const [activeUsersRes] = await pool.execute('SELECT COUNT(*) as count FROM `users` WHERE status = "Active"');
    
    const [roleStats] = await pool.execute('SELECT role, COUNT(*) as count FROM `users` GROUP BY role');

    const stats = {
      totalUsers: totalUsersRes[0].count,
      activeUsers: activeUsersRes[0].count,
      inactiveUsers: totalUsersRes[0].count - activeUsersRes[0].count,
      roles: {}
    };

    roleStats.forEach(stat => {
      stats.roles[stat.role] = stat.count;
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
