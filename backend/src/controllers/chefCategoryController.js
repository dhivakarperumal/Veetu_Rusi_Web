  const pool = require('../config/db');

const parseJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const generateNextChefCategoryId = async (chefUserId) => {
  const [rows] = await pool.execute(
    'SELECT catId FROM chef_category WHERE chef_user_id <=> ? ORDER BY id DESC',
    [chefUserId]
  );

  let maxId = 0;
  rows.forEach((row) => {
    if (!row.catId) return;
    const match = row.catId.match(/\d+/);
    if (match) {
      const numericId = parseInt(match[0], 10);
      if (!Number.isNaN(numericId) && numericId > maxId) {
        maxId = numericId;
      }
    }
  });

  return `CAT${String(maxId + 1).padStart(3, '0')}`;
};

const resolveChefCategoryMetadata = async (req, body) => {
  const {
    chef_id,
    chef_user_id,
    chef_name,
    chef_phone,
    chef_email,
    franchise_id,
    franchise_user_id,
    franchise_name,
    franchise_email,
    franchise_phone
  } = body;

  const candidateChefId = chef_id || chef_user_id || req.user?.user_id || req.user?.id || null;
  const candidateEmail = chef_email || req.user?.email || null;
  const candidatePhone = chef_phone || req.user?.phone || null;

  let homeChef = null;
  if (candidateChefId || candidateEmail || candidatePhone) {
    const [rows] = await pool.execute(
      `SELECT hc.*, u.id AS user_id, u.user_id AS user_user_id, u.full_name AS user_name, u.mobile_number AS user_phone, u.email AS user_email
       FROM home_chefs hc
       LEFT JOIN users u ON (u.email = hc.email OR u.mobile_number = hc.mobile)
       WHERE hc.user_id = ?
          OR hc.email = ?
          OR hc.mobile = ?
          OR u.user_id = ?
          OR u.id = ?
       LIMIT 1`,
      [candidateChefId, candidateEmail, candidatePhone, candidateChefId, candidateChefId]
    );

    if (rows.length > 0) homeChef = rows[0];
  }

  const finalChefUserId = chef_user_id || req.user?.user_id || req.user?.id || homeChef?.user_user_id || homeChef?.user_id || null;
  const finalChefId = chef_id || homeChef?.chef_id || homeChef?.user_id || homeChef?.user_user_id || null;
  const finalChefName = chef_name || homeChef?.name || req.user?.name || homeChef?.user_name || null;
  const finalChefPhone = chef_phone || homeChef?.mobile || req.user?.phone || homeChef?.user_phone || null;
  const finalChefEmail = chef_email || homeChef?.email || req.user?.email || homeChef?.user_email || null;

  const finalFranchiseUserId = franchise_user_id || homeChef?.created_by_user_id || null;
  const finalFranchiseId = franchise_id || homeChef?.created_by_id || null;
  let finalFranchiseName = franchise_name || homeChef?.created_by_name || null;
  let finalFranchiseEmail = franchise_email || homeChef?.created_by_email || null;
  let finalFranchisePhone = franchise_phone || homeChef?.created_by_phone || null;

  if (finalFranchiseUserId) {
    const [franchiseUsers] = await pool.execute(
      'SELECT id, user_id, full_name AS name, mobile_number AS phone, email FROM users WHERE id = ? OR user_id = ? LIMIT 1',
      [finalFranchiseUserId, finalFranchiseUserId]
    );
    if (franchiseUsers.length > 0) {
      const fu = franchiseUsers[0];
      finalFranchiseName = finalFranchiseName || fu.name || null;
      finalFranchiseEmail = finalFranchiseEmail || fu.email || null;
      finalFranchisePhone = finalFranchisePhone || fu.phone || null;
    }
  }

  return {
    finalChefId,
    finalChefUserId,
    finalChefName,
    finalChefPhone,
    finalChefEmail,
    finalFranchiseId,
    finalFranchiseUserId,
    finalFranchiseName,
    finalFranchiseEmail,
    finalFranchisePhone
  };
};

exports.getChefCategories = async (req, res) => {
  try {
    const {
      chef_user_id,
      chef_id,
      franchise_user_id,
      franchise_id
    } = req.query;

    let query = `SELECT id, catId, name, description, subcategory, images,
      chef_user_id, chef_id, chef_name, chef_phone, chef_email,
      franchise_user_id, franchise_id, franchise_name, franchise_email, franchise_phone,
      created_by_user_id, created_by_email, created_by_name, created_by_phone
      FROM chef_category WHERE 1=1`;
    const params = [];

    if (chef_id) {
      query += ' AND chef_id = ?';
      params.push(chef_id);
    }
    if (chef_user_id) {
      query += ' AND chef_user_id = ?';
      params.push(chef_user_id);
    }
    if (franchise_id) {
      query += ' AND franchise_id = ?';
      params.push(franchise_id);
    }
    if (franchise_user_id) {
      query += ' AND franchise_user_id = ?';
      params.push(franchise_user_id);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    const categories = rows.map((row) => ({
      ...row,
      subcategory: parseJsonField(row.subcategory) || [],
      images: parseJsonField(row.images) || []
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching chef categories:', error);
    res.status(500).json({ message: 'Failed to fetch chef categories', error: error.message });
  }
};

exports.createChefCategory = async (req, res) => {
  try {
    const {
      catId,
      name,
      description,
      subcategory = [],
      images = [],
      created_by_user_id,
      created_by_name,
      created_by_phone
    } = req.body;

    const categoryName = name || req.body.cname;
    const categoryDescription = description || req.body.cdescription || '';

    if (!categoryName) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const metadata = await resolveChefCategoryMetadata(req, req.body);
    const {
      finalChefId,
      finalChefUserId,
      finalChefName,
      finalChefPhone,
      finalChefEmail,
      finalFranchiseId,
      finalFranchiseUserId,
      finalFranchiseName,
      finalFranchiseEmail,
      finalFranchisePhone
    } = metadata;

    const finalCreatedByUserId = created_by_user_id || req.user?.user_id || req.user?.id || null;
    const finalCreatedByEmail = req.user?.email || null;
    const finalCreatedByName = created_by_name || finalChefName || req.user?.name || null;
    const finalCreatedByPhone = created_by_phone || finalChefPhone || req.user?.phone || null;

    let finalCatId = catId || await generateNextChefCategoryId(finalChefUserId);

    const insertSql = `INSERT INTO chef_category
      (catId, name, description, subcategory, images,
      chef_id, chef_user_id, chef_name, chef_phone, chef_email,
      franchise_user_id, franchise_id, franchise_name, franchise_email, franchise_phone,
      created_by_user_id, created_by_email, created_by_name, created_by_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertParams = [
      finalCatId,
      categoryName,
      categoryDescription,
      JSON.stringify(subcategory),
      JSON.stringify(images),
      finalChefId,
      finalChefUserId,
      finalChefName,
      finalChefPhone,
      finalChefEmail,
      finalFranchiseUserId,
      finalFranchiseId,
      finalFranchiseName,
      finalFranchiseEmail,
      finalFranchisePhone,
      finalCreatedByUserId,
      finalCreatedByEmail,
      finalCreatedByName,
      finalCreatedByPhone
    ];

    let result;
    let attempt = 0;
    const maxAttempts = 5;

    while (attempt < maxAttempts) {
      try {
        [result] = await pool.execute(insertSql, insertParams);
        break;
      } catch (insertErr) {
        if (insertErr.code === 'ER_DUP_ENTRY') {
          attempt += 1;
          finalCatId = await generateNextChefCategoryId(finalChefUserId);
          insertParams[0] = finalCatId;
          continue;
        }
        throw insertErr;
      }
    }

    if (!result) {
      return res.status(409).json({ message: 'Unable to generate a unique Category ID. Please try again.' });
    }

    res.status(201).json({ message: 'Chef category created successfully', id: result.insertId, catId: finalCatId });
  } catch (err) {
    console.error('Failed to create chef category:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category ID already exists for this chef user. Please try again.' });
    }
    res.status(500).json({ message: 'Failed to create chef category', error: err.message });
  }
};

exports.updateChefCategory = async (req, res) => {
  try {
    const catId = req.params.catId;
    const updates = req.body;
    const fields = [];
    const params = [];

    if (updates.catId) {
      fields.push('catId = ?');
      params.push(updates.catId);
    }
    if (updates.name || updates.cname) {
      fields.push('name = ?');
      params.push(updates.name || updates.cname);
    }
    if (updates.description !== undefined || updates.cdescription !== undefined) {
      fields.push('description = ?');
      params.push(updates.description !== undefined ? updates.description : updates.cdescription);
    }
    if (updates.subcategory !== undefined) {
      fields.push('subcategory = ?');
      params.push(JSON.stringify(updates.subcategory));
    }
    if (updates.images !== undefined || updates.cimgs !== undefined) {
      fields.push('images = ?');
      params.push(JSON.stringify(updates.images !== undefined ? updates.images : updates.cimgs));
    }
    if (updates.chef_user_id !== undefined) {
      fields.push('chef_user_id = ?');
      params.push(updates.chef_user_id);
    }
    if (updates.chef_id !== undefined) {
      fields.push('chef_id = ?');
      params.push(updates.chef_id);
    }
    if (updates.chef_name !== undefined) {
      fields.push('chef_name = ?');
      params.push(updates.chef_name);
    }
    if (updates.chef_phone !== undefined) {
      fields.push('chef_phone = ?');
      params.push(updates.chef_phone);
    }
    if (updates.chef_email !== undefined) {
      fields.push('chef_email = ?');
      params.push(updates.chef_email);
    }
    if (updates.franchise_user_id !== undefined) {
      fields.push('franchise_user_id = ?');
      params.push(updates.franchise_user_id);
    }
    if (updates.franchise_id !== undefined) {
      fields.push('franchise_id = ?');
      params.push(updates.franchise_id);
    }
    if (updates.franchise_name !== undefined) {
      fields.push('franchise_name = ?');
      params.push(updates.franchise_name);
    }
    if (updates.franchise_email !== undefined) {
      fields.push('franchise_email = ?');
      params.push(updates.franchise_email);
    }
    if (updates.franchise_phone !== undefined) {
      fields.push('franchise_phone = ?');
      params.push(updates.franchise_phone);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(catId, catId);
    const [result] = await pool.execute(
      `UPDATE chef_category SET ${fields.join(', ')} WHERE catId = ? OR id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Failed to update chef category:', err);
    res.status(500).json({ message: 'Failed to update chef category', error: err.message });
  }
};

exports.deleteChefCategory = async (req, res) => {
  try {
    const catId = req.params.catId;
    const [result] = await pool.execute(
      'DELETE FROM chef_category WHERE catId = ? OR id = ?',
      [catId, catId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Failed to delete chef category:', err);
    res.status(500).json({ message: 'Failed to delete chef category', error: err.message });
  }
};
