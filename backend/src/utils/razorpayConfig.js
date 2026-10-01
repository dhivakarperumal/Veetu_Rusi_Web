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

const getFranchiseAdminIdentifiers = async (candidate) => {
  if (!candidate) return [];
  const raw = String(candidate).trim();
  if (!raw) return [];
  const idSet = new Set([raw]);
  try {
    const [fRows] = await pool.execute(
      'SELECT id, franchise_id, franch_user_id, email FROM franchise_owners WHERE id = ? OR franchise_id = ? OR franch_user_id = ? OR email = ? LIMIT 1',
      [raw, raw, raw, raw]
    );
    if (fRows.length) {
      const f = fRows[0];
      if (f.id != null) idSet.add(String(f.id));
      if (f.franchise_id) idSet.add(String(f.franchise_id));
      if (f.franch_user_id) idSet.add(String(f.franch_user_id));
      if (f.email) idSet.add(String(f.email));
      const [uRows] = await pool.execute(
        'SELECT id, user_id, email FROM users WHERE email = ? OR user_id = ? OR user_id = ? LIMIT 1',
        [f.email || '', f.franch_user_id || '', raw]
      );
      if (uRows.length) {
        const u = uRows[0];
        if (u.id != null) idSet.add(String(u.id));
        if (u.user_id) idSet.add(String(u.user_id));
        if (u.email) idSet.add(String(u.email));
      }
    } else {
      const [uRows] = await pool.execute(
        'SELECT id, user_id, email, role, created_by, franchise_user_id FROM users WHERE id = ? OR user_id = ? OR email = ? LIMIT 1',
        [raw, raw, raw]
      );
      if (uRows.length) {
        const u = uRows[0];
        if (u.id != null) idSet.add(String(u.id));
        if (u.user_id) idSet.add(String(u.user_id));
        if (u.email) idSet.add(String(u.email));
        const [fRows2] = await pool.execute(
          'SELECT id, franchise_id, franch_user_id, email FROM franchise_owners WHERE franch_user_id = ? OR email = ? LIMIT 1',
          [u.user_id || '', u.email || '']
        );
        if (fRows2.length) {
          const f = fRows2[0];
          if (f.id != null) idSet.add(String(f.id));
          if (f.franchise_id) idSet.add(String(f.franchise_id));
          if (f.franch_user_id) idSet.add(String(f.franch_user_id));
          if (f.email) idSet.add(String(f.email));
        }
      }
    }
  } catch (err) {}
  return Array.from(idSet).filter(Boolean);
};

const resolveFranchiseAdminId = async ({ franchiseUserId, chefUserId, userId, userRole } = {}) => {
  if (franchiseUserId && String(franchiseUserId).trim()) {
    const raw = String(franchiseUserId).trim();
    if (raw.startsWith('FRAN-')) return raw;
    try {
      const [rows] = await pool.execute(
        'SELECT franch_user_id FROM franchise_owners WHERE id = ? OR franchise_id = ? OR franch_user_id = ? LIMIT 1',
        [raw, raw, raw]
      );
      if (rows.length && rows[0].franch_user_id) return rows[0].franch_user_id;
    } catch {}
    return raw;
  }

  if (chefUserId && String(chefUserId).trim()) {
    const rawChef = String(chefUserId).trim();
    try {
      const [rows] = await pool.execute(
        'SELECT created_by, franchise_user_id FROM home_chefs WHERE user_id = ? OR id = ? OR email = ? LIMIT 1',
        [rawChef, rawChef, rawChef]
      );
      if (rows.length) {
        const found = rows[0].franchise_user_id || rows[0].created_by;
        if (found) return found;
      }
    } catch {}
  }

  if (userRole === 'admin' || userRole === 'franchise' || userRole === 'franchise_admin' || String(userId || '').startsWith('FRAN-')) {
    if (userId) {
      const rawUser = String(userId).trim();
      if (rawUser.startsWith('FRAN-')) return rawUser;
      try {
        const [rows] = await pool.execute('SELECT user_id, email FROM users WHERE id = ? OR user_id = ? LIMIT 1', [rawUser, rawUser]);
        if (rows.length && rows[0].user_id) return rows[0].user_id;
      } catch {}
      return rawUser;
    }
  }

  if ((userRole === 'home_chef' || userRole === 'chef' || userRole === 'homechef' || String(userId || '').startsWith('CHEF-')) && userId) {
    const rawChef = String(userId).trim();
    try {
      const [rows] = await pool.execute(
        'SELECT created_by, franchise_user_id FROM home_chefs WHERE user_id = ? OR id = ? OR email = ? LIMIT 1',
        [rawChef, rawChef, rawChef]
      );
      if (rows.length) {
        const found = rows[0].franchise_user_id || rows[0].created_by;
        if (found) return found;
      }
    } catch {}
  }

  if ((userRole === 'delivery' || userRole === 'delivery_partner' || String(userId || '').startsWith('DEL-')) && userId) {
    const rawDel = String(userId).trim();
    try {
      const [rows] = await pool.execute(
        'SELECT created_by FROM delivery_partners WHERE user_id = ? OR id = ? OR email = ? LIMIT 1',
        [rawDel, rawDel, rawDel]
      );
      if (rows.length && rows[0].created_by) return rows[0].created_by;
    } catch {}
  }

  if (userId) {
    const rawUser = String(userId).trim();
    try {
      const [rows] = await pool.execute(
        'SELECT franchise_user_id, created_by FROM users WHERE user_id = ? OR id = ? LIMIT 1',
        [rawUser, rawUser]
      );
      if (rows.length && (rows[0].franchise_user_id || rows[0].created_by)) {
        return rows[0].franchise_user_id || rows[0].created_by;
      }
    } catch {}
  }

  return null;
};

const getAssignedRazorpayConfig = async (userIdentity, { paymentProfile, franchiseUserId, userRole } = {}) => {
  const identity = userIdentity == null ? '' : String(userIdentity);

  // 1. Direct assignment in user_razorpay_keys
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

  // 2. Franchise admin scope
  const role = userRole || (identity.startsWith('CHEF-') ? 'home_chef' : identity.startsWith('DEL-') ? 'delivery' : null);
  const franchiseAdminId = await resolveFranchiseAdminId({ franchiseUserId, userId: identity, userRole: role });

  const targetUsage = (paymentProfile === 'home_chef' || role === 'home_chef') ? 'Home Chef' :
                      (paymentProfile === 'delivery' || role === 'delivery') ? 'Delivery Partner' : 'User Checkout';

  if (franchiseAdminId) {
    const adminIdentifiers = await getFranchiseAdminIdentifiers(franchiseAdminId);
    if (adminIdentifiers.length) {
      const placeholders = adminIdentifiers.map(() => '?').join(', ');

      // 2a. Franchise admin's specific usage key
      try {
        const [rows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}))
             AND (LOWER(TRIM(key_usage)) = LOWER(?) OR LOWER(TRIM(key_name)) LIKE ?)
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers, targetUsage, `%${targetUsage.toLowerCase()}%`]
        );
        if (rows.length && rows[0].key_id) {
          const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
          return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {
        console.error('getAssignedRazorpayConfig franchise lookup error:', err.message);
      }

      // 2b. Franchise admin's General key
      try {
        const [genRows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}))
             AND (LOWER(TRIM(key_usage)) = 'general' OR LOWER(TRIM(key_name)) LIKE '%general%')
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers]
        );
        if (genRows.length && genRows[0].key_id) {
          const storedSecret = genRows[0].key_secret ? decryptStoredSecret(genRows[0].key_secret) : '';
          return { id: genRows[0].id, keyId: genRows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {}

      // 2c. Franchise admin's ANY active key in razorpay_keys
      try {
        const [anyRows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}))
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers]
        );
        if (anyRows.length && anyRows[0].key_id) {
          const storedSecret = anyRows[0].key_secret ? decryptStoredSecret(anyRows[0].key_secret) : '';
          return { id: anyRows[0].id, keyId: anyRows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {}

      // 2d. Franchise admin's ANY active key in franchise_razorpay_keys
      try {
        const [fRows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM franchise_razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}) OR franchise_user_id IN (${placeholders}))
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers, ...adminIdentifiers]
        );
        if (fRows.length && fRows[0].key_id) {
          const storedSecret = fRows[0].key_secret ? decryptStoredSecret(fRows[0].key_secret) : '';
          return { id: fRows[0].id, keyId: fRows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {}
    }

    throw new Error('Razorpay key not configured by your admin yet');
  }

  // 3. Fallback to active platform keys in razorpay_keys if no franchise context
  try {
    const [specRows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM razorpay_keys
       WHERE (LOWER(TRIM(key_usage)) = LOWER(?) OR LOWER(TRIM(key_name)) LIKE ?)
         AND (created_by IS NULL OR created_by = 'system' OR created_by = 'superadmin' OR (created_by NOT LIKE 'FRAN-%' AND created_by NOT LIKE 'franchise%'))
         AND LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      [targetUsage, `%${targetUsage.toLowerCase()}%`]
    );
    if (specRows.length && specRows[0].key_id) {
      const storedSecret = specRows[0].key_secret ? decryptStoredSecret(specRows[0].key_secret) : '';
      return { id: specRows[0].id, keyId: specRows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {}

  try {
    const [genRows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM razorpay_keys
       WHERE (LOWER(TRIM(key_usage)) = 'general' OR LOWER(TRIM(key_name)) LIKE '%general%')
         AND (created_by IS NULL OR created_by = 'system' OR created_by = 'superadmin' OR (created_by NOT LIKE 'FRAN-%' AND created_by NOT LIKE 'franchise%'))
         AND LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (genRows.length && genRows[0].key_id) {
      const storedSecret = genRows[0].key_secret ? decryptStoredSecret(genRows[0].key_secret) : '';
      return { id: genRows[0].id, keyId: genRows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {}

  throw new Error('Razorpay key not configured by your admin yet');
};

const getUserCheckoutRazorpayConfig = async ({ franchiseUserId, chefUserId, userId, userRole } = {}) => {
  const franchiseAdminId = await resolveFranchiseAdminId({ franchiseUserId, chefUserId, userId, userRole });

  if (franchiseAdminId) {
    const adminIdentifiers = await getFranchiseAdminIdentifiers(franchiseAdminId);
    if (adminIdentifiers.length) {
      const placeholders = adminIdentifiers.map(() => '?').join(', ');

      // 1. Franchise admin's specific User Checkout key
      try {
        const [rows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}))
             AND (LOWER(TRIM(key_usage)) = 'user checkout' OR LOWER(TRIM(key_name)) LIKE '%user%' OR LOWER(TRIM(key_name)) LIKE '%checkout%')
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers]
        );
        if (rows.length && rows[0].key_id) {
          const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
          return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {
        console.error('getUserCheckoutRazorpayConfig franchise lookup error:', err.message);
      }

      // 2. Franchise admin's General key
      try {
        const [genRows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}))
             AND (LOWER(TRIM(key_usage)) = 'general' OR LOWER(TRIM(key_name)) LIKE '%general%')
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers]
        );
        if (genRows.length && genRows[0].key_id) {
          const storedSecret = genRows[0].key_secret ? decryptStoredSecret(genRows[0].key_secret) : '';
          return { id: genRows[0].id, keyId: genRows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {}

      // 3. Franchise admin's ANY active key in razorpay_keys
      try {
        const [anyRows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}))
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers]
        );
        if (anyRows.length && anyRows[0].key_id) {
          const storedSecret = anyRows[0].key_secret ? decryptStoredSecret(anyRows[0].key_secret) : '';
          return { id: anyRows[0].id, keyId: anyRows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {}

      // 4. Franchise admin's ANY active key in franchise_razorpay_keys
      try {
        const [fRows] = await pool.execute(
          `SELECT id, key_id, key_secret
           FROM franchise_razorpay_keys
           WHERE (created_by IN (${placeholders}) OR updated_by IN (${placeholders}) OR franchise_user_id IN (${placeholders}))
             AND LOWER(status) = 'active'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [...adminIdentifiers, ...adminIdentifiers, ...adminIdentifiers]
        );
        if (fRows.length && fRows[0].key_id) {
          const storedSecret = fRows[0].key_secret ? decryptStoredSecret(fRows[0].key_secret) : '';
          return { id: fRows[0].id, keyId: fRows[0].key_id, keySecret: storedSecret, franchiseAdminId };
        }
      } catch (err) {}
    }

    throw new Error('Razorpay key not configured by your admin yet');
  }

  // 5. Fallback to active platform keys (superadmin / system only) when there is no franchise context
  try {
    const [rows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM razorpay_keys
       WHERE (LOWER(TRIM(key_usage)) = 'user checkout' OR LOWER(TRIM(key_name)) LIKE '%user%' OR LOWER(TRIM(key_name)) LIKE '%checkout%')
         AND (created_by IS NULL OR created_by = 'system' OR created_by = 'superadmin' OR (created_by NOT LIKE 'FRAN-%' AND created_by NOT LIKE 'franchise%'))
         AND LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (rows.length && rows[0].key_id) {
      const storedSecret = rows[0].key_secret ? decryptStoredSecret(rows[0].key_secret) : '';
      return { id: rows[0].id, keyId: rows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {
    console.error('getUserCheckoutRazorpayConfig platform fallback error:', err.message);
  }

  // 6. Fallback to active General key across platform (system only)
  try {
    const [genRows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM razorpay_keys
       WHERE (LOWER(TRIM(key_usage)) = 'general' OR LOWER(TRIM(key_name)) LIKE '%general%')
         AND (created_by IS NULL OR created_by = 'system' OR created_by = 'superadmin' OR (created_by NOT LIKE 'FRAN-%' AND created_by NOT LIKE 'franchise%'))
         AND LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (genRows.length && genRows[0].key_id) {
      const storedSecret = genRows[0].key_secret ? decryptStoredSecret(genRows[0].key_secret) : '';
      return { id: genRows[0].id, keyId: genRows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {}

  throw new Error('Razorpay key not configured by your admin yet');
};

const getUserCheckoutRazorpayKeyId = async (options = {}) => {
  const config = await getUserCheckoutRazorpayConfig(options);
  return { id: config.id, keyId: config.keyId };
};

const getFranchiseSubscriptionRazorpayConfig = async () => {
  // 1. Check franchise_razorpay_keys for specific usage
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

  // 2. Check franchise_razorpay_keys for any active key
  try {
    const [anyFRows] = await pool.execute(
      `SELECT id, key_id, key_secret
       FROM franchise_razorpay_keys
       WHERE LOWER(status) = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
    if (anyFRows.length && anyFRows[0].key_id) {
      const storedSecret = anyFRows[0].key_secret ? decryptStoredSecret(anyFRows[0].key_secret) : '';
      return { id: anyFRows[0].id, keyId: anyFRows[0].key_id, keySecret: storedSecret };
    }
  } catch (err) {}

  // 3. Fallback to active key in razorpay_keys table
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
  getFranchiseAdminIdentifiers,
  resolveFranchiseAdminId,
  getAssignedRazorpayConfig,
  getUserCheckoutRazorpayConfig,
  getUserCheckoutRazorpayKeyId,
  getFranchiseSubscriptionRazorpayConfig
};