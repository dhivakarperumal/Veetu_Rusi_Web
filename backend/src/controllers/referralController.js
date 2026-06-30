const crypto = require('crypto');
const pool = require('../config/db');

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const normalizeReferralCodeInput = (value) => {
  if (value == null) return '';
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const ensureSettings = async () => {
  const [rows] = await pool.execute('SELECT * FROM referral_settings ORDER BY id DESC LIMIT 1');
  if (rows.length > 0) return rows[0];

  const defaultSettings = {
    is_enabled: 1,
    referrer_reward_amount: 50,
    referee_reward_amount: 50,
    reward_type: 'wallet_credit',
    min_order_value: 0,
    first_order_only: 1,
    reward_expiry_days: 30,
    max_referrals_per_user: 10,
    daily_referral_limit: 5,
    monthly_referral_limit: 20,
    updated_by: 'system',
  };

  await pool.execute(
    `INSERT INTO referral_settings (
      is_enabled,
      referrer_reward_amount,
      referee_reward_amount,
      reward_type,
      min_order_value,
      first_order_only,
      reward_expiry_days,
      max_referrals_per_user,
      daily_referral_limit,
      monthly_referral_limit,
      updated_by,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      defaultSettings.is_enabled,
      defaultSettings.referrer_reward_amount,
      defaultSettings.referee_reward_amount,
      defaultSettings.reward_type,
      defaultSettings.min_order_value,
      defaultSettings.first_order_only,
      defaultSettings.reward_expiry_days,
      defaultSettings.max_referrals_per_user,
      defaultSettings.daily_referral_limit,
      defaultSettings.monthly_referral_limit,
      defaultSettings.updated_by,
    ]
  );

  const [freshRows] = await pool.execute('SELECT * FROM referral_settings ORDER BY id DESC LIMIT 1');
  return freshRows[0] || defaultSettings;
};

const generateReferralCodeText = () => {
  const prefix = 'USER';
  return `${prefix}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

const generateCodeFromUser = async () => {
  let code = '';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    code = generateReferralCodeText();
    const [rows] = await pool.execute('SELECT id FROM users WHERE referral_code = ? LIMIT 1', [code]);
    if (!rows.length) return code;
  }
  return generateReferralCodeText();
};

const generateReferralCode = async () => {
  return generateCodeFromUser();
};

const generateCodeForUser = async (userId) => {
  const code = await generateReferralCode();
  await pool.execute('UPDATE users SET referral_code = ? WHERE id = ?', [code, userId]);
  return code;
};

const validateCode = async (code) => {
  const [rows] = await pool.execute(
    'SELECT id, user_id, full_name, email, referral_code FROM users WHERE referral_code = ? LIMIT 1',
    [code]
  );
  if (!rows.length) {
    const error = new Error('Referral code not found.');
    error.statusCode = 404;
    throw error;
  }
  return rows[0];
};

const getOrCreateWallet = async (userId) => {
  const [walletRows] = await pool.execute('SELECT * FROM user_wallets WHERE user_id = ? LIMIT 1', [userId]);
  if (walletRows.length > 0) return walletRows[0];

  await pool.execute(
    'INSERT INTO user_wallets (user_id, balance, total_earned, total_spent) VALUES (?, 0, 0, 0)',
    [userId]
  );
  const [freshRows] = await pool.execute('SELECT * FROM user_wallets WHERE user_id = ? LIMIT 1', [userId]);
  return freshRows[0];
};

const creditWallet = async ({ userId, amount, source, referenceId, description }) => {
  if (!userId || !amount || Number(amount) <= 0) return null;
  await getOrCreateWallet(userId);
  await pool.execute(
    'UPDATE user_wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
    [amount, amount, userId]
  );
  await pool.execute(
    `INSERT INTO wallet_transactions (user_id, amount, transaction_type, source, reference_id, description, status, created_at, updated_at)
     VALUES (?, ?, 'credit', ?, ?, ?, 'completed', NOW(), NOW())`,
    [userId, amount, source, referenceId, description]
  );
  return true;
};

const getUserIdValue = (user) => user?.user_id || user?.id || null;

const getDashboard = async (req, res) => {
  try {
    const userId = getUserIdValue(req.user);
    if (!userId) return res.status(400).json({ message: 'User identity not available.' });

        const [userRows] = await pool.execute(
      'SELECT id, full_name, email, referral_code, referred_by FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const user = userRows[0] || {};

    if (!user.referral_code && user.id) {
      const generatedCode = await generateCodeForUser(user.id);
      user.referral_code = generatedCode;
    }

    const [statsRows] = await pool.execute(
      `SELECT
        COUNT(*) AS total_referrals,
        SUM(CASE WHEN status = 'rewarded' THEN 1 ELSE 0 END) AS successful,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN reward_status = 'credited' THEN reward_amount ELSE 0 END) AS total_earnings
      FROM referrals
      WHERE referrer_user_id = ? OR referee_user_id = ?`,
      [userId, userId]
    );
    const stats = statsRows[0] || {};

    const [walletRows] = await pool.execute('SELECT balance FROM user_wallets WHERE user_id = ? LIMIT 1', [userId]);
    const walletBalance = walletRows[0]?.balance || 0;

    const [historyRows] = await pool.execute(
      `SELECT r.*, u.full_name AS referee_name, u.email AS referee_email, u.mobile_number AS referee_phone
       FROM referrals r
       LEFT JOIN users u ON u.user_id = r.referee_user_id
       WHERE r.referrer_user_id = ? OR r.referee_user_id = ?
       ORDER BY r.created_at DESC LIMIT 20`,
      [userId, userId]
    );

    return res.json({
      my_code: user.referral_code || null,
      referred_by: user.referred_by || null,
      stats: {
        total_referrals: Number(stats.total_referrals || 0),
        successful: Number(stats.successful || 0),
        pending: Number(stats.pending || 0),
        total_earnings: Number(stats.total_earnings || 0),
        wallet_balance: Number(walletBalance || 0),
      },
      history: historyRows,
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({ message: 'Failed to load referral dashboard.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = getUserIdValue(req.user);
    const [rows] = await pool.execute(
      `SELECT r.*, u.full_name AS referee_name, u.email AS referee_email, u.mobile_number AS referee_phone
       FROM referrals r
       LEFT JOIN users u ON u.user_id = r.referee_user_id
       WHERE r.referrer_user_id = ? OR r.referee_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId, userId]
    );
    return res.json(rows);
  } catch (error) {
    console.error('getHistory error:', error);
    return res.status(500).json({ message: 'Failed to load referral history.' });
  }
};

const getWalletTransactions = async (req, res) => {
  try {
    const userId = getUserIdValue(req.user);
    const [rows] = await pool.execute(
      'SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return res.json(rows);
  } catch (error) {
    console.error('getWalletTransactions error:', error);
    return res.status(500).json({ message: 'Failed to load wallet transactions.' });
  }
};

const validateReferralCode = async (req, res) => {
  try {
    const { referral_code } = req.body;
    if (!referral_code) {
      return res.status(400).json({ message: 'Referral code is required.' });
    }

    const settings = await ensureSettings();
    if (!Number(settings.is_enabled)) {
      return res.status(403).json({ message: 'Referral program is currently disabled.' });
    }

    const referrer = await validateCode(referral_code);
    return res.json({ valid: true, referrer });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Invalid referral code.' });
  }
};

const applyCode = async (req, res) => {
  try {
    const userId = getUserIdValue(req.user);
    const { referral_code } = req.body;
    if (!userId) return res.status(400).json({ message: 'User identity not available.' });
    if (!referral_code) return res.status(400).json({ message: 'Referral code is required.' });

    const [userRows] = await pool.execute('SELECT id, user_id, referral_code, referred_by FROM users WHERE user_id = ? LIMIT 1', [userId]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.referred_by) {
      return res.status(400).json({ message: 'A referral code has already been applied to this account.' });
    }

    const settings = await ensureSettings();
    if (!Number(settings.is_enabled)) {
      return res.status(403).json({ message: 'Referral program is currently disabled.' });
    }

    const referrer = await validateCode(referral_code);
    if (String(referrer.user_id || referrer.id) === String(user.user_id || user.id)) {
      return res.status(400).json({ message: 'You cannot refer yourself.' });
    }

    const [existingRows] = await pool.execute(
      'SELECT id FROM referrals WHERE referee_user_id = ? LIMIT 1',
      [user.user_id || user.id]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ message: 'This account already has a referral record.' });
    }

    const [sameReferrerCountRows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM referrals WHERE referrer_user_id = ?',
      [referrer.user_id || referrer.id]
    );
    const sameReferrerCount = Number(sameReferrerCountRows[0]?.count || 0);
    if (settings.max_referrals_per_user && sameReferrerCount >= Number(settings.max_referrals_per_user)) {
      return res.status(400).json({ message: 'This referrer has reached the maximum number of referrals.' });
    }

    const [dailyCountRows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM referrals WHERE referrer_user_id = ? AND created_at >= CURDATE()',
      [referrer.user_id || referrer.id]
    );
    if (settings.daily_referral_limit && Number(dailyCountRows[0]?.count || 0) >= Number(settings.daily_referral_limit)) {
      return res.status(400).json({ message: 'Daily referral limit reached for this referrer.' });
    }

    const [monthlyCountRows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM referrals WHERE referrer_user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)',
      [referrer.user_id || referrer.id]
    );
    if (settings.monthly_referral_limit && Number(monthlyCountRows[0]?.count || 0) >= Number(settings.monthly_referral_limit)) {
      return res.status(400).json({ message: 'Monthly referral limit reached for this referrer.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO referrals (
        referral_code,
        referrer_user_id,
        referee_user_id,
        status,
        registered_at,
        reward_amount,
        reward_type,
        reward_status,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 'pending', NOW(), ?, ?, 'pending', 'Applied through signup', NOW(), NOW())`,
      [referral_code, referrer.user_id || referrer.id, user.user_id || user.id, Number(settings.referrer_reward_amount || 0), settings.reward_type || 'wallet_credit']
    );

    await pool.execute('UPDATE users SET referred_by = ? WHERE user_id = ?', [referral_code, user.user_id || user.id]);

    const [rows] = await pool.execute('SELECT * FROM referrals WHERE id = ? LIMIT 1', [result.insertId]);
    return res.status(201).json({ message: 'Referral code applied successfully.', referral: rows[0] });
  } catch (error) {
    console.error('applyCode error:', error);
    return res.status(500).json({ message: error.message || 'Failed to apply referral code.' });
  }
};

const adminGetSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    return res.json(settings);
  } catch (error) {
    console.error('adminGetSettings error:', error);
    return res.status(500).json({ message: 'Failed to load referral settings.' });
  }
};

const adminUpdateSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    const settings = await ensureSettings();
    const fields = [
      'is_enabled',
      'referrer_reward_amount',
      'referee_reward_amount',
      'reward_type',
      'min_order_value',
      'first_order_only',
      'reward_expiry_days',
      'max_referrals_per_user',
      'daily_referral_limit',
      'monthly_referral_limit',
      'updated_by',
    ];

    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => payload[field] ?? settings[field]);
    values.push(settings.id);

    await pool.execute(`UPDATE referral_settings SET ${setClause}, updated_at = NOW() WHERE id = ?`, values);
    const [rows] = await pool.execute('SELECT * FROM referral_settings WHERE id = ? LIMIT 1', [settings.id]);
    return res.json(rows[0]);
  } catch (error) {
    console.error('adminUpdateSettings error:', error);
    return res.status(500).json({ message: 'Failed to update referral settings.' });
  }
};

const adminGetReports = async (req, res) => {
  try {
    const [statsRows] = await pool.execute(
      `SELECT
        COUNT(*) AS total_referrals,
        SUM(CASE WHEN status = 'rewarded' THEN 1 ELSE 0 END) AS successful,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN reward_status = 'credited' THEN reward_amount ELSE 0 END) AS total_rewards_paid
      FROM referrals`
    );
    const [walletRows] = await pool.execute(
      `SELECT COALESCE(SUM(balance), 0) AS wallet_balance FROM user_wallets`
    );
    return res.json({
      stats: statsRows[0],
      wallet_balance: walletRows[0]?.wallet_balance || 0,
    });
  } catch (error) {
    console.error('adminGetReports error:', error);
    return res.status(500).json({ message: 'Failed to load referral reports.' });
  }
};

const adminGetReferrals = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, 
        referrer.full_name AS referrer_name,
        referrer.email AS referrer_email,
        referee.full_name AS referee_name,
        referee.email AS referee_email,
        referee.mobile_number AS referee_phone
       FROM referrals r
       LEFT JOIN users referrer ON referrer.user_id = r.referrer_user_id
       LEFT JOIN users referee ON referee.user_id = r.referee_user_id
       ORDER BY r.created_at DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('adminGetReferrals error:', error);
    return res.status(500).json({ message: 'Failed to load referrals.' });
  }
};

const adminCreateReferralCode = async (req, res) => {
  try {
    const { user_id, referral_code, notes } = req.body || {};
    if (!user_id) {
      return res.status(400).json({ message: 'User is required.' });
    }

    const normalizedCode = normalizeReferralCodeInput(referral_code || '');
    if (!normalizedCode) {
      return res.status(400).json({ message: 'Referral code is required.' });
    }

    const [userRows] = await pool.execute('SELECT id, user_id, referral_code FROM users WHERE user_id = ? OR id = ? LIMIT 1', [user_id, user_id]);
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const [existingCodeRows] = await pool.execute('SELECT id FROM users WHERE referral_code = ? AND id <> ? LIMIT 1', [normalizedCode, user.id]);
    if (existingCodeRows.length > 0) {
      return res.status(409).json({ message: 'This referral code is already in use.' });
    }

    await pool.execute('UPDATE users SET referral_code = ? WHERE id = ? ', [normalizedCode, user.id]);
    await pool.execute('UPDATE users SET referred_by = ? WHERE id = ? AND (referred_by IS NULL OR referred_by = \'\')', [normalizedCode, user.id]);

    const [updatedRows] = await pool.execute('SELECT id, user_id, referral_code, referred_by FROM users WHERE id = ? LIMIT 1', [user.id]);
    return res.json({
      message: 'Referral code created successfully.',
      user: updatedRows[0],
      notes: notes || null,
    });
  } catch (error) {
    console.error('adminCreateReferralCode error:', error);
    return res.status(500).json({ message: 'Failed to create referral code.' });
  }
};

const adminUpdateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    const action = normalizeStatus(status);
    const allowedStatus = ['approve', 'reject', 'cancel', 'resend'];
    if (!allowedStatus.includes(action)) {
      return res.status(400).json({ message: 'Invalid status action.' });
    }

    let mappedStatus = 'pending';
    let rewardStatus = 'pending';
    if (action === 'approve') {
      mappedStatus = 'pending';
      rewardStatus = 'pending';
    } else if (action === 'reject') {
      mappedStatus = 'rejected';
      rewardStatus = 'expired';
    } else if (action === 'cancel') {
      mappedStatus = 'cancelled';
      rewardStatus = 'expired';
    } else if (action === 'resend') {
      mappedStatus = 'pending';
      rewardStatus = 'pending';
    }

    await pool.execute(
      `UPDATE referrals SET status = ?, reward_status = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
      [mappedStatus, rewardStatus, notes || null, id]
    );

    const [rows] = await pool.execute('SELECT * FROM referrals WHERE id = ? LIMIT 1', [id]);
    return res.json(rows[0]);
  } catch (error) {
    console.error('adminUpdateReferralStatus error:', error);
    return res.status(500).json({ message: 'Failed to update referral status.' });
  }
};

const adminExport = async (req, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    const [rows] = await pool.execute(
      `SELECT r.id, r.referral_code, r.referrer_user_id, r.referee_user_id, r.status, r.reward_status, r.reward_amount, r.reward_type, r.created_at
       FROM referrals r ORDER BY r.created_at DESC`
    );

    const header = ['id', 'referral_code', 'referrer_user_id', 'referee_user_id', 'status', 'reward_status', 'reward_amount', 'reward_type', 'created_at'];
    const csvRows = [header.join(',')];
    rows.forEach((row) => {
      const values = header.map((field) => `"${String(row[field] ?? '').replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    });

    const content = csvRows.join('\n');
    if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=referrals.xls');
      return res.send(content);
    }
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=referrals.pdf');
      return res.send(`%PDF-1.4\n% Generated referral export\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n`);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=referrals.csv');
    return res.send(content);
  } catch (error) {
    console.error('adminExport error:', error);
    return res.status(500).json({ message: 'Failed to export referrals.' });
  }
};

const processFirstOrderReward = async (targetOrderId) => {
  try {
    const [orderRows] = await pool.execute(
      'SELECT * FROM user_food_order_table WHERE id = ? OR order_id = ? LIMIT 1',
      [targetOrderId, targetOrderId]
    );
    const order = orderRows[0];
    if (!order) return { status: 'skipped', reason: 'Order not found.' };

    const settings = await ensureSettings();
    if (!Number(settings.is_enabled)) return { status: 'skipped', reason: 'Referral disabled.' };

    const normalizedStatus = normalizeStatus(order.status);
    if (!['delivered', 'completed'].includes(normalizedStatus)) {
      return { status: 'skipped', reason: 'Order status is not delivered.' };
    }

    if (Number(order.final_total || order.total_amount || 0) < Number(settings.min_order_value || 0)) {
      return { status: 'skipped', reason: 'Order value below minimum.' };
    }

    const userId = order.user_id || null;
    if (!userId) return { status: 'skipped', reason: 'No customer linked to order.' };

    const [pendingRows] = await pool.execute(
      'SELECT * FROM referrals WHERE referee_user_id = ? AND status = ? AND reward_status = ? LIMIT 1',
      [userId, 'pending', 'pending']
    );
    const referral = pendingRows[0];
    if (!referral) return { status: 'skipped', reason: 'No pending referral.' };

    const [previousOrderRows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM user_food_order_table
       WHERE user_id = ? AND id <> ? AND status IN ('Delivered', 'Completed', 'delivered', 'completed')`,
      [userId, order.id]
    );
    if (Number(settings.first_order_only) && Number(previousOrderRows[0]?.count || 0) > 0) {
      return { status: 'skipped', reason: 'First-order-only reward already satisfied.' };
    }

    const referrerAmount = Number(settings.referrer_reward_amount || 0);
    const refereeAmount = Number(settings.referee_reward_amount || 0);
    const rewardType = settings.reward_type || 'wallet_credit';

    if (rewardType === 'wallet_credit') {
      await creditWallet({
        userId: referral.referrer_user_id,
        amount: referrerAmount,
        source: 'referral',
        referenceId: referral.id,
        description: `Reward for referral ${referral.referral_code}`,
      });
      await creditWallet({
        userId: referral.referee_user_id,
        amount: refereeAmount,
        source: 'referral',
        referenceId: referral.id,
        description: `Welcome reward for referral ${referral.referral_code}`,
      });
    }

    await pool.execute(
      `UPDATE referrals
       SET status = 'rewarded',
           reward_amount = ?,
           reward_type = ?,
           reward_status = ?,
           first_order_id = ?,
           first_order_date = ?,
           first_order_value = ?,
           reward_credited_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [rewardType === 'wallet_credit' ? (referrerAmount + refereeAmount) : 0, rewardType, rewardType === 'wallet_credit' ? 'credited' : 'pending', order.id, order.ordered_at || new Date(), Number(order.final_total || order.total_amount || 0), referral.id]
    );

    return { status: 'rewarded', referralId: referral.id };
  } catch (error) {
    console.error('processFirstOrderReward error:', error);
    return { status: 'error', message: error.message || 'Referral reward processing failed.' };
  }
};

module.exports = {
  generateReferralCode,
  generateCodeForUser,
  generateReferralCodeText,
  validateReferralCode,
  applyCode,
  getDashboard,
  getHistory,
  getWalletTransactions,
  adminGetSettings,
  adminUpdateSettings,
  adminGetReports,
  adminGetReferrals,
  adminCreateReferralCode,
  adminUpdateReferralStatus,
  adminExport,
  processFirstOrderReward,
  normalizeReferralCodeInput,
};
