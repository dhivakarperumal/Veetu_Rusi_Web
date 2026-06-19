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

const normalizeJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value);
    }
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
};

const resolveChefFoodMetadata = async (req, body) => {
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
  const candidateChefEmail = chef_email || req.user?.email || null;
  const candidateChefPhone = chef_phone || null;

  let homeChef = null;
  if (candidateChefId || candidateChefEmail || candidateChefPhone) {
    const [rows] = await pool.execute(
      `SELECT hc.*, u.id AS user_id, u.user_id AS user_user_id, u.full_name AS user_name, u.mobile_number AS user_phone, u.email AS user_email
       FROM home_chefs hc
       LEFT JOIN users u ON (u.email = hc.email OR u.mobile_number = hc.mobile)
       WHERE hc.user_id = ? OR hc.email = ? OR hc.mobile = ? OR u.user_id = ? OR u.id = ?
       LIMIT 1`,
      [candidateChefId, candidateChefEmail, candidateChefPhone, candidateChefId, candidateChefId]
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
  const finalFranchiseName = franchise_name || homeChef?.created_by_name || null;
  const finalFranchiseEmail = franchise_email || homeChef?.created_by_email || null;
  const finalFranchisePhone = franchise_phone || homeChef?.created_by_phone || null;

  return {
    finalChefUserId,
    finalChefId,
    finalChefName,
    finalChefPhone,
    finalChefEmail,
    finalFranchiseUserId,
    finalFranchiseId,
    finalFranchiseName,
    finalFranchiseEmail,
    finalFranchisePhone
  };
};

exports.getFoods = async (req, res) => {
  try {
    const {
      chef_user_id,
      chef_id,
      franchise_user_id,
      franchise_id,
      category,
      dietary_tag,
      status
    } = req.query;

    let query = 'SELECT * FROM chef_food_table WHERE 1=1';
    const params = [];

    // Enforce role-based restrictions
    if (req.user) {
      if (req.user.role === 'chef') {
        query += ' AND (chef_id = ? OR chef_user_id = ?)';
        params.push(req.user.id, req.user.user_id);
      } else if (req.user.role === 'admin') {
        query += ' AND (franchise_id = ? OR franchise_user_id = ?)';
        params.push(req.user.id, req.user.user_id);
      }
      // superadmin can see all
    }

    if (chef_id) {
      query += ' AND chef_id = ?';
      params.push(chef_id);
    }
    if (chef_user_id) {
      query += ' AND chef_user_id = ?';
      params.push(chef_user_id);
    }
    // Use OR logic for franchise: match if either franchise_id OR franchise_user_id matches
    if (franchise_id && franchise_user_id) {
      query += ' AND (franchise_id = ? OR franchise_user_id = ?)';
      params.push(franchise_id, franchise_user_id);
    } else if (franchise_id) {
      query += ' AND franchise_id = ?';
      params.push(franchise_id);
    } else if (franchise_user_id) {
      query += ' AND franchise_user_id = ?';
      params.push(franchise_user_id);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (dietary_tag) {
      query += ' AND dietary_tag = ?';
      params.push(dietary_tag);
    }
    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    const foods = rows.map((row) => ({
      ...row,
      ingredients: parseJsonField(row.ingredients) || row.ingredients,
      instructions: parseJsonField(row.instructions) || row.instructions,
      images: parseJsonField(row.images) || row.images || []
    }));
    res.json(foods);
  } catch (error) {
    console.error('Error fetching chef foods:', error);
    res.status(500).json({ message: 'Failed to fetch chef foods', error: error.message });
  }
};

exports.getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM chef_food_table WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Chef food item not found' });
    }
    const food = rows[0];
    res.json({
      ...food,
      ingredients: parseJsonField(food.ingredients) || food.ingredients,
      instructions: parseJsonField(food.instructions) || food.instructions,
      images: parseJsonField(food.images) || food.images || []
    });
  } catch (error) {
    console.error('Error fetching chef food item:', error);
    res.status(500).json({ message: 'Failed to fetch chef food item', error: error.message });
  }
};

exports.createFood = async (req, res) => {
  try {
    const {
      category,
      name,
      description,
      cuisine,
      prep_time,
      shelf_life_days,
      mrp,
      offer,
      final_price,
      dietary_tag,
      net_weight,
      packaging_type,
      ingredients,
      instructions,
      images,
      status
    } = req.body;

    if (!category || !name || !description || !mrp) {
      return res.status(400).json({ message: 'Required fields: category, food name, description, mrp' });
    }

    const metadata = await resolveChefFoodMetadata(req, req.body);
    const {
      finalChefUserId,
      finalChefId,
      finalChefName,
      finalChefPhone,
      finalChefEmail,
      finalFranchiseUserId,
      finalFranchiseId,
      finalFranchiseName,
      finalFranchiseEmail,
      finalFranchisePhone
    } = metadata;

    // created_by_* columns removed from chef_food_table schema; skipping population

    const computedFinalPrice = Number(final_price) || (Number(mrp) - (Number(offer) || 0) * Number(mrp) / 100) || Number(mrp);

    const insertSql = `INSERT INTO chef_food_table
      (category, name, description, cuisine, prep_time, shelf_life_days, mrp, offer, final_price,
       dietary_tag, net_weight, packaging_type, ingredients, instructions, images, status,
       chef_id, chef_user_id, chef_name, chef_phone, chef_email,
      franchise_id, franchise_user_id, franchise_name, franchise_email, franchise_phone
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      category,
      name,
      description,
      cuisine || null,
      prep_time || null,
      shelf_life_days || null,
      mrp,
      offer || 0,
      computedFinalPrice,
      dietary_tag || null,
      net_weight || null,
      packaging_type || null,
      ingredients || null,
      instructions || null,
      normalizeJsonField(images) || null,
      status || 'Active',
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
    ];

    const [result] = await pool.execute(insertSql, params);
    res.status(201).json({ message: 'Chef food item created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating chef food item:', error);
    res.status(500).json({ message: 'Failed to create chef food item', error: error.message });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const params = [];

    const allowed = [
      'category', 'name', 'description', 'cuisine', 'prep_time', 'shelf_life_days', 'mrp',
      'offer', 'final_price', 'dietary_tag', 'net_weight', 'packaging_type',
      'ingredients', 'instructions', 'images', 'status', 'chef_id', 'chef_user_id', 'chef_name',
      'chef_phone', 'chef_email', 'franchise_id', 'franchise_user_id', 'franchise_name',
      'franchise_email', 'franchise_phone'
    ];

    allowed.forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'images') {
          params.push(normalizeJsonField(updates[key]));
        } else {
          params.push(updates[key]);
        }
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id);
    const [result] = await pool.execute(
      `UPDATE chef_food_table SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Chef food item not found' });
    }

    res.json({ message: 'Chef food item updated successfully' });
  } catch (error) {
    console.error('Error updating chef food item:', error);
    res.status(500).json({ message: 'Failed to update chef food item', error: error.message });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM chef_food_table WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Chef food item not found' });
    }
    res.json({ message: 'Chef food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting chef food item:', error);
    res.status(500).json({ message: 'Failed to delete chef food item', error: error.message });
  }
};
