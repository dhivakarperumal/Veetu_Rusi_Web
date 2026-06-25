const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

async function validateFranchiseAdminSubscription(user) {
  if (!user || user.role !== 'admin' || !user.email) return null;
  try {
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
  } catch (err) {
    console.warn('validateFranchiseAdminSubscription: failed to query franchise_owners:', err?.message || err);
    // If the franchise table is missing or the query fails, do not block authentication flow.
    return null;
  }
}

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  if (!authHeader) {
    console.warn(`verifyToken failed: missing Authorization header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'No authorization header provided.' });
  }

  const token = authHeader.split(/\s+/).pop();
  if (!token) {
    console.warn(`verifyToken failed: Bearer token missing for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Access token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    const subscriptionError = await validateFranchiseAdminSubscription(decoded);
    if (subscriptionError) {
      console.warn(`verifyToken subscription failure for user ${decoded?.email || decoded?.user_id}: ${subscriptionError}`);
      return res.status(403).json({ message: subscriptionError });
    }
    next();
  } catch (error) {
    console.error(`JWT verification failed for ${req.method} ${req.originalUrl}:`, error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired.' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  }
};

exports.attachUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Ignore invalid token for optional auth attachment
  }
  next();
};

exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }
    next();
  };
};
