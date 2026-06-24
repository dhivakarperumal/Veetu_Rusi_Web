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

  const currentUserId = req.user?.user_id || req.user?.id || null;
  const isFranchiseActor = ['admin', 'franchise', 'superadmin'].includes(req.user?.role);
  const finalFranchiseUserId = franchise_user_id || (isFranchiseActor ? currentUserId : null) || homeChef?.created_by || homeChef?.franchise_user_id || homeChef?.created_by_user_id || null;
  const finalFranchiseId = franchise_id || homeChef?.franchise_id || homeChef?.created_by_id || null;
  const finalFranchiseName = franchise_name || homeChef?.franchise_name || homeChef?.created_by_name || null;
  const finalFranchiseEmail = franchise_email || homeChef?.franchise_email || homeChef?.created_by_email || null;
  const finalFranchisePhone = franchise_phone || homeChef?.franchise_phone || homeChef?.created_by_phone || null;

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
      status,
      user_lat,
      user_lon,
      radius,
      area,
      district,
      pincode
    } = req.query;

    const lat = parseFloat(user_lat || req.user?.latitude);
    const lon = parseFloat(user_lon || req.user?.longitude);
    const searchRadius = parseFloat(radius) || 10;

    let query = 'SELECT cf.*, u.full_name as chef_name';
    if (!isNaN(lat) && !isNaN(lon)) {
      query += `, ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( hc.latitude ) ) * cos( radians( hc.longitude ) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians( hc.latitude ) ) ) ) AS distance`;
    } else {
      query += `, NULL as distance`;
    }

    query += ' FROM chef_food_table cf LEFT JOIN users u ON cf.created_by = u.user_id LEFT JOIN home_chefs hc ON cf.created_by = hc.user_id WHERE 1=1';
    const params = [];

    // Enforce role-based restrictions
    if (req.user) {
      const currentUserId = req.user.user_id || req.user.id || null;
      if (['chef', 'homechef'].includes(req.user.role) && currentUserId) {
        query += ' AND (cf.created_by = ? OR cf.updated_by = ?)';
        params.push(currentUserId, currentUserId);
      } else if (['admin', 'franchise', 'superadmin'].includes(req.user.role) && currentUserId) {
        query += ' AND cf.franchise_user_id = ?';
        params.push(currentUserId);
      }
      // superadmin can see all when no explicit filter is applied
    }

    if (franchise_user_id) {
      query += ' AND cf.franchise_user_id = ?';
      params.push(franchise_user_id);
    }
    if (category) {
      query += ' AND cf.category = ?';
      params.push(category);
    }
    if (dietary_tag) {
      query += ' AND cf.dietary_tag = ?';
      params.push(dietary_tag);
    }
    if (status && status !== 'All') {
      query += ' AND cf.status = ?';
      params.push(status);
    }

    if (area) {
      query += ' AND hc.area_name = ?';
      params.push(area);
    }
    if (district) {
      query += ' AND hc.district = ?';
      params.push(district);
    }
    if (pincode) {
      query += ' AND hc.pincode = ?';
      params.push(pincode);
    }

    if (!isNaN(lat) && !isNaN(lon)) {
      query += ` HAVING distance <= ${searchRadius}`;
      query += ' ORDER BY distance ASC, cf.created_at DESC';
    } else {
      query += ' ORDER BY cf.created_at DESC';
    }

    const [rows] = await pool.execute(query, params);
    const foods = rows.map((row) => ({
      ...row,
      distance: row.distance !== null && row.distance !== undefined ? `${parseFloat(row.distance).toFixed(2)} KM` : null,
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
    const [rows] = await pool.execute(
      `SELECT cf.*, u.full_name AS chef_name, u.user_id AS chef_user_id, u.email AS chef_email, u.mobile_number AS chef_phone
       FROM chef_food_table cf
       LEFT JOIN users u ON cf.created_by = u.user_id
       WHERE cf.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Chef food item not found' });
    }
    const food = rows[0];
    res.json({
      ...food,
      // Ensure chef_user_id is always the correct user_id (created_by)
      chef_user_id: food.chef_user_id || food.created_by || null,
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
      product_type,
      name,
      description,
      cuisine,
      prep_time,
      preparation_url,
      shelf_life_days,
      mrp,
      offer,
      final_price,
      dietary_tag,
      net_weight,
      packaging_type,
      packaging_image,
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
      finalFranchiseUserId
    } = metadata;

    const createdBy = finalChefUserId || req.user?.user_id || req.user?.id || null;
    const updatedBy = createdBy;

    const computedFinalPrice = Number(final_price) || (Number(mrp) - (Number(offer) || 0) * Number(mrp) / 100) || Number(mrp);

    const insertSql = `INSERT INTO chef_food_table
      (category, product_type, name, description, cuisine, prep_time, preparation_url, shelf_life_days, mrp, offer, final_price,
       dietary_tag, net_weight, packaging_type, packaging_image, ingredients, instructions, images, status,
       franchise_user_id, created_by, updated_by
      )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      category,
      product_type || 'Food',
      name,
      description,
      cuisine || null,
      prep_time || null,
      preparation_url || null,
      shelf_life_days || null,
      mrp,
      offer || 0,
      computedFinalPrice,
      dietary_tag || null,
      net_weight || null,
      packaging_type || null,
      packaging_image || null,
      ingredients || null,
      instructions || null,
      normalizeJsonField(images) || null,
      status || 'Inactive',
      finalFranchiseUserId,
      createdBy,
      updatedBy
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
      'category', 'product_type', 'name', 'description', 'cuisine', 'prep_time', 'preparation_url', 'shelf_life_days', 'mrp',
      'offer', 'final_price', 'dietary_tag', 'net_weight', 'packaging_type', 'packaging_image',
      'ingredients', 'instructions', 'images', 'status', 'franchise_user_id'
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

    const updateUpdatedBy = req.user?.user_id || req.user?.id || null;
    if (updateUpdatedBy) {
      fields.push('updated_by = ?');
      params.push(updateUpdatedBy);
    }

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
