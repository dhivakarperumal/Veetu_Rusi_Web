const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

async function validateFranchiseAdminSubscription(user) {
  if (!user || user.role !== 'admin' || !user.email) return null;
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM franchise_owners WHERE email = ? LIMIT 1',
      [user.email]
    );
    if (!rows.length) return null;

    const [payments] = await pool.execute(
      `SELECT sp.id FROM subscription_payments sp
       LEFT JOIN subscription_plans p ON p.id = sp.plan_id
       WHERE sp.franchise_id = ?
         AND COALESCE(sp.subscription_expiry_date, DATE_ADD(sp.created_at, INTERVAL COALESCE(sp.duration_days, p.durationDays, 0) DAY)) >= CURDATE()
       ORDER BY COALESCE(sp.subscription_expiry_date, DATE_ADD(sp.created_at, INTERVAL COALESCE(sp.duration_days, p.durationDays, 0) DAY)) DESC LIMIT 1`,
      [rows[0].id]
    );
    if (!payments.length) return 'No active subscription found. Please purchase a plan to continue.';

    return null;
  } catch (err) {
    console.warn('validateFranchiseAdminSubscription: failed to query franchise_owners:', err?.message || err);
    // If the franchise table is missing or the query fails, do not block authentication flow.
    return null;
  }
}

const verifyTokenRequest = async (req, res, next, checkSubscription = true) => {
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
    if (checkSubscription) {
      const subscriptionError = await validateFranchiseAdminSubscription(decoded);
      if (subscriptionError) {
        console.warn(`verifyToken subscription failure for user ${decoded?.email || decoded?.user_id}: ${subscriptionError}`);
        return res.status(403).json({ message: subscriptionError });
      }
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

exports.verifyToken = (req, res, next) => verifyTokenRequest(req, res, next, true);
exports.verifyTokenWithoutSubscription = (req, res, next) => verifyTokenRequest(req, res, next, false);

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
