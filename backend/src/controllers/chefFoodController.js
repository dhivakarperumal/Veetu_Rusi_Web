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
    try {
      const [rows] = await pool.execute(
        `SELECT hc.*, u.id AS user_id, u.user_id AS user_user_id, u.full_name AS user_name, u.mobile_number AS user_phone, u.email AS user_email
         FROM home_chefs hc
         LEFT JOIN users u ON (u.email = hc.email OR u.mobile_number = hc.mobile)
         WHERE hc.user_id = ? OR hc.email = ? OR hc.mobile = ? OR u.user_id = ? OR u.id = ?
         LIMIT 1`,
        [candidateChefId, candidateChefEmail, candidateChefPhone, candidateChefId, candidateChefId]
      );
      if (rows.length > 0) homeChef = rows[0];
    } catch (err) {
      console.warn('resolveChefFoodMetadata: failed to query home_chefs:', err?.message || err);
      // tolerate missing home_chefs table or query failures by leaving homeChef null
    }
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

    let query = `
SELECT
    cf.*,
    u.full_name AS chef_name,

    hc.delivery_radius,
    hc.latitude,
    hc.longitude,
    hc.area_name,
    hc.city,
    hc.district,
    hc.state,
    hc.pincode
`;
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
      } else if (['admin', 'franchise'].includes(req.user.role) && currentUserId && !franchise_user_id) {
        query += ' AND cf.franchise_user_id = ?';
        params.push(currentUserId);
      }
      // superadmin can see all chef foods when filtering by franchise_user_id or with no explicit restriction
    }

    if (chef_user_id) {
      query += ' AND cf.created_by = ?';
      params.push(chef_user_id);
    }
    if (chef_id) {
      query += ' AND cf.chef_id = ?';
      params.push(chef_id);
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
      const normalizedStatus = String(status || '').trim().toLowerCase();
      if (normalizedStatus === 'active' || normalizedStatus === 'approved') {
        query += " AND (cf.status = 'Active' OR cf.status = 'Approved')";
      } else if (normalizedStatus === 'not approved') {
        query += " AND (cf.status <> 'Active' AND cf.status <> 'Approved')";
      } else {
        query += ' AND cf.status = ?';
        params.push(status);
      }
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
      images: parseJsonField(row.images) || row.images || [],
      variants: parseJsonField(row.variants) || row.variants || [],
      manufacture_date: row.manufacture_date || null,
      expiry_date: row.expiry_date || null,
      total_stock: row.total_stock || 0
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
      images: parseJsonField(food.images) || food.images || [],
      variants: parseJsonField(food.variants) || food.variants || [],
      manufacture_date: food.manufacture_date || null,
      expiry_date: food.expiry_date || null,
      total_stock: food.total_stock || 0
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
      manufacture_date,
      expiry_date,
      mrp,
      offer,
      offer_price,
      final_price,
      dietary_tag,
      net_weight,
      packaging_type,
      packaging_image,
      ingredients,
      instructions,
      images,
      total_stock,
      variants,
      status
    } = req.body;

    // mrp can be 0 (falsy) when provided explicitly; treat only undefined/null as missing
    if (!category || !name || !description || mrp === undefined || mrp === null) {
      return res.status(400).json({ message: 'Required fields: category, food name, description, mrp' });
    }

    const metadata = await resolveChefFoodMetadata(req, req.body);
    const {
      finalChefUserId,
      finalFranchiseUserId
    } = metadata;

    const createdBy = finalChefUserId || req.user?.user_id || req.user?.id || null;
    const updatedBy = createdBy;

    const incomingFinalPrice = offer_price !== undefined && offer_price !== null
      ? Number(offer_price)
      : final_price !== undefined && final_price !== null
        ? Number(final_price)
        : null;

    const computedFinalPrice = incomingFinalPrice !== null
      ? incomingFinalPrice
      : (Number(mrp) - (Number(offer) || 0) * Number(mrp) / 100);

    // Normalize incoming images/variants (they might be JSON strings)
    const parsedVariants = Array.isArray(variants) ? variants : (parseJsonField(variants) || []);
    const parsedImages = Array.isArray(images) ? images : (parseJsonField(images) || []);
    const allVariantImages = parsedVariants.flatMap(v => (v && v.images) ? v.images : []);

    // Build insert dynamically based on actual columns present in chef_food_table
    const [cols] = await pool.execute('SHOW COLUMNS FROM chef_food_table');
    const available = cols.map(c => c.Field);

    const fieldMap = {
      category: category || 'Food Product',
      product_type: product_type || 'Food',
      name,
      description: description || null,
      cuisine: cuisine || null,
      prep_time: prep_time || null,
      preparation_url: preparation_url || null,
      shelf_life_days: shelf_life_days ? Number(shelf_life_days) : null,
      manufacture_date: manufacture_date || null,
      expiry_date: expiry_date || null,
      mrp,
      offer: offer || 0,
      final_price: computedFinalPrice,
      dietary_tag: dietary_tag || null,
      net_weight: net_weight || null,
      packaging_type: packaging_type || null,
      packaging_image: packaging_image || null,
      ingredients: ingredients || null,
      instructions: instructions || null,
      images: (parsedImages.length > 0 ? normalizeJsonField(parsedImages) : (allVariantImages.length > 0 ? normalizeJsonField(allVariantImages) : null)),
      total_stock: total_stock || 0,
      variants: (parsedVariants.length > 0 ? normalizeJsonField(parsedVariants.map(v => ({ weight: v.weight || null, price: v.price ? Number(v.price) : 0, offer: v.offer ? Number(v.offer) : 0, final_price: v.final_price ? Number(v.final_price) : 0, stock: Number(v.stock) || 0, images: v.images || [] }))) : null),
      status: status || 'Inactive',
      franchise_user_id: finalFranchiseUserId || null,
      created_by: createdBy || null,
      updated_by: updatedBy || null
    };

    const insertCols = [];
    const placeholders = [];
    const params = [];
    for (const [key, val] of Object.entries(fieldMap)) {
      if (available.includes(key)) {
        insertCols.push(key);
        placeholders.push('?');
        params.push(val);
      }
    }

    if (insertCols.length === 0) {
      return res.status(500).json({ message: 'No valid columns found for chef_food_table' });
    }

    const insertSql = `INSERT INTO chef_food_table (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`;
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
    // Only update columns that exist in the table to tolerate schema differences
    const [cols] = await pool.execute('SHOW COLUMNS FROM chef_food_table');
    const available = cols.map(c => c.Field);

    const allowed = [
      'category', 'product_type', 'name', 'description', 'cuisine', 'prep_time', 'preparation_url', 'shelf_life_days', 'manufacture_date', 'expiry_date', 'mrp',
      'offer', 'final_price', 'dietary_tag', 'net_weight', 'packaging_type', 'packaging_image',
      'ingredients', 'instructions', 'images', 'total_stock', 'variants', 'status', 'franchise_user_id'
    ];

    const fields = [];
    const params = [];

    allowed.forEach((key) => {
      if (updates[key] !== undefined && available.includes(key)) {
        fields.push(`${key} = ?`);
        if (key === 'images' || key === 'variants') {
          params.push(normalizeJsonField(updates[key]));
        } else {
          params.push(updates[key]);
        }
      }
    });

    const updateUpdatedBy = req.user?.user_id || req.user?.id || null;
    if (updateUpdatedBy && available.includes('updated_by')) {
      fields.push('updated_by = ?');
      params.push(updateUpdatedBy);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update or no matching columns in DB' });
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
