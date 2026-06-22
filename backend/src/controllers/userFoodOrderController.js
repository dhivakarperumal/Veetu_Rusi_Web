const pool = require('../config/db');

const parseJson = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return [];
    }
  }
  return value;
};

const addUserFoodOrder = async (payload) => {
  const {
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    street_address,
    city,
    district,
    state,
    country,
    zip_code,
    delivery_date,
    delivery_time,
    payment_method,
    payment_status,
    total_amount,
    items,
    created_by_user_id,
    created_by_name,
    created_by_email,
    created_by_phone,
    chef_user_id,
    chef_id,
    chef_name,
    chef_email,
    chef_phone,
    franchise_user_id,
    franchise_id,
    franchise_name,
    franchise_email,
    franchise_phone,
    ordered_by_name,
    ordered_by_email,
    ordered_by_phone
  } = payload;

  const order_id = `UFO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const [result] = await pool.execute(
    `INSERT INTO user_food_order_table (
      order_id,
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      street_address,
      city,
      district,
      state,
      country,
      zip_code,
      delivery_date,
      delivery_time,
      payment_method,
      payment_status,
      total_amount,
      items,
      created_by_user_id,
      created_by_name,
      created_by_email,
      created_by_phone,
      chef_user_id,
      chef_id,
      chef_name,
      chef_email,
      chef_phone,
      franchise_user_id,
      franchise_id,
      franchise_name,
      franchise_email,
      franchise_phone,
      ordered_by_name,
      ordered_by_email,
      ordered_by_phone,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
    [
      order_id,
      user_id || null,
      customer_name || null,
      customer_email || null,
      customer_phone || null,
      street_address || null,
      city || null,
      district || null,
      state || null,
      country || null,
      zip_code || null,
      delivery_date || null,
      delivery_time || null,
      payment_method || null,
      payment_status || 'Pending',
      total_amount || 0,
      JSON.stringify(items || []),
      created_by_user_id || null,
      created_by_name || null,
      created_by_email || null,
      created_by_phone || null,
      chef_user_id || null,
      chef_id || null,
      chef_name || null,
      chef_email || null,
      chef_phone || null,
      franchise_user_id || null,
      franchise_id || null,
      franchise_name || null,
      franchise_email || null,
      franchise_phone || null,
      ordered_by_name || null,
      ordered_by_email || null,
      ordered_by_phone || null
    ]
  );

  return { insertId: result.insertId, order_id };
};

const getChefOrders = async (chefUserId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM user_food_order_table WHERE chef_user_id = ? OR chef_id = ? ORDER BY ordered_at DESC',
    [chefUserId, chefUserId]
  );

  return rows.map((row) => ({
    ...row,
    items: parseJson(row.items)
  }));
};

const getUserOrders = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM user_food_order_table WHERE user_id = ? ORDER BY ordered_at DESC',
    [userId]
  );

  return rows.map((row) => ({
    ...row,
    items: parseJson(row.items)
  }));
};

const getOrderById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM user_food_order_table WHERE id = ?', [id]);
  if (!rows.length) return null;
  const order = rows[0];
  return {
    ...order,
    items: parseJson(order.items)
  };
};

const updateOrder = async (id, payload) => {
  const fields = [];
  const values = [];
  const allowedFields = [
    'customer_name',
    'customer_email',
    'customer_phone',
    'street_address',
    'city',
    'district',
    'state',
    'country',
    'zip_code',
    'delivery_date',
    'delivery_time',
    'payment_method',
    'payment_status',
    'total_amount',
    'status',
    'delivery_partner'
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      fields.push(`${field} = ?`);
      values.push(payload[field]);
    }
  });

  if (!fields.length) return;

  values.push(id);
  await pool.execute(`UPDATE user_food_order_table SET ${fields.join(', ')} WHERE id = ?`, values);
};

const updateOrderStatus = async (id, status) => {
  await pool.execute('UPDATE user_food_order_table SET status = ? WHERE id = ?', [status, id]);
};

const getAllOrders = async ({ role, userId, numericId, status, chef_id, search }) => {
  let query = 'SELECT * FROM user_food_order_table WHERE 1=1';
  const params = [];

  if (role === 'chef') {
    query += ' AND (chef_user_id = ? OR chef_id = ?)';
    params.push(userId, userId);
  } else if (role === 'admin') {
    query += ' AND (franchise_user_id = ? OR franchise_id = ?)';
    params.push(userId, String(numericId));
  }
  // superadmin sees all

  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (chef_id) {
    query += ' AND chef_id = ?';
    params.push(chef_id);
  }
  if (search) {
    query += ' AND (customer_name LIKE ? OR order_id LIKE ? OR chef_name LIKE ? OR ordered_by_name LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  query += ' ORDER BY ordered_at DESC';
  const [rows] = await pool.execute(query, params);
  return rows.map((row) => ({ ...row, items: parseJson(row.items) }));
};

module.exports = {
  addUserFoodOrder,
  getAllOrders,
  getChefOrders,
  getUserOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus
};
