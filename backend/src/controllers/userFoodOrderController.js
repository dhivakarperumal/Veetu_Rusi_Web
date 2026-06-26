const pool = require('../config/db');
const { getIo } = require('../utils/socket');

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
      ordered_at,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'New Order')`,
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

  // Fetch the inserted order to include items and full data
  let orderRecord = null;
  try {
    orderRecord = await getOrderById(result.insertId);
  } catch (err) {
    // ignore fetch errors
    orderRecord = null;
  }

  // Emit realtime notification to relevant chefs (if Socket.IO initialized)
  try {
    const io = getIo();
    if (io) {
      const chefIds = new Set();

      if (chef_user_id) chefIds.add(String(chef_user_id));
      if (chef_id) chefIds.add(String(chef_id));

      // inspect items for chef references
      const itemList = Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items || '[]') : []);
      for (const it of itemList) {
        if (it?.chef_user_id) chefIds.add(String(it.chef_user_id));
        if (it?.chef_id) chefIds.add(String(it.chef_id));
      }

      const payload = {
        order_id,
        id: result.insertId,
        order: orderRecord || { id: result.insertId, order_id, items: itemList }
      };

      for (const cid of chefIds) {
        try {
          io.to(`chef:${cid}`).emit('new_order', payload);
        } catch (err) {
          // continue
        }
      }
    }
  } catch (err) {
    // ignore socket errors
  }

  return { insertId: result.insertId, order_id };
};

const getChefOrders = async (chefUserId) => {
  const patterns = [
    `%"chef_user_id":"${chefUserId}"%`,
    `%"chef_user_id":${chefUserId}%`,
    `%"chef_id":"${chefUserId}"%`,
    `%"chef_id":${chefUserId}%`
  ];

  const [rows] = await pool.execute(
    `SELECT * FROM user_food_order_table
     WHERE chef_user_id = ?
       OR chef_id = ?
       OR items LIKE ?
       OR items LIKE ?
       OR items LIKE ?
       OR items LIKE ?
     ORDER BY COALESCE(ordered_at, updated_at) DESC`,
    [chefUserId, chefUserId, ...patterns]
  );

  const chefOrders = [];
  for (const row of rows) {
    const items = parseJson(row.items);
    const chefItems = items.filter((item) =>
      String(item.chef_user_id) === String(chefUserId) ||
      String(item.chef_id) === String(chefUserId) ||
      String(item.created_by_user_id) === String(chefUserId)
    );

    // If no matching items in the JSON but the order-level chef_user_id matches, include all items
    const orderLevelMatch =
      String(row.chef_user_id) === String(chefUserId) ||
      String(row.chef_id) === String(chefUserId);

    const effectiveItems = chefItems.length > 0 ? chefItems : orderLevelMatch ? items : [];
    if (!effectiveItems.length && !orderLevelMatch) continue;

    const chefNames = [...new Set(effectiveItems.map((item) => item.chef_name).filter(Boolean))];
    const chefEmails = [...new Set(effectiveItems.map((item) => item.chef_email).filter(Boolean))];
    const chefPhones = [...new Set(effectiveItems.map((item) => item.chef_phone).filter(Boolean))];
    const chefTotalAmount = effectiveItems.reduce((sum, item) => {
      const price = parseFloat(item.price || item.final_price || item.mrp || 0) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);
    const chefTotalQuantity = effectiveItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    chefOrders.push({
      ...row,
      items: effectiveItems,
      // Normalize ordered_at — fall back to updated_at if null
      ordered_at: row.ordered_at || row.updated_at || null,
      chef_name: chefNames.join(', ') || row.chef_name,
      chef_email: chefEmails[0] || row.chef_email,
      chef_phone: chefPhones[0] || row.chef_phone,
      chef_total_amount: chefTotalAmount > 0 ? parseFloat(chefTotalAmount.toFixed(2)) : parseFloat(Number(row.total_amount || 0).toFixed(2)),
      chef_total_quantity: chefTotalQuantity > 0 ? chefTotalQuantity : effectiveItems.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
    });
  }

  return chefOrders;
};

const getUserOrders = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM user_food_order_table WHERE user_id = ? ORDER BY ordered_at DESC',
    [userId]
  );

  return rows.map((row) => {
    const items = parseJson(row.items);
    const chefNames = [...new Set(items.map((item) => item.chef_name || item.chef || item.created_by_name).filter(Boolean))];

    const chefGroups = Object.values(
      items.reduce((groups, item) => {
        const key = item.chef_name || item.chef_email || item.chef_user_id || item.chef_id || item.created_by_name || 'unknown';
        const chefName = item.chef_name || item.chef || item.created_by_name || 'Unknown Chef';
        const chefEmail = item.chef_email || item.email || 'N/A';
        const chefPhone = item.chef_phone || item.phone || 'N/A';
        const quantity = Number(item.quantity) || 1;
        const price = parseFloat(item.price || item.final_price || item.mrp || 0) || 0;

        if (!groups[key]) {
          groups[key] = {
            chef_name: chefName,
            chef_email: chefEmail,
            chef_phone: chefPhone,
            items: [],
            total_amount: 0,
            total_quantity: 0,
          };
        }

        groups[key].items.push(item);
        groups[key].total_amount += price * quantity;
        groups[key].total_quantity += quantity;
        return groups;
      }, {})
    ).map((group) => ({
      ...group,
      total_amount: parseFloat(group.total_amount.toFixed(2))
    }));

    return {
      ...row,
      items,
      chef_names: chefNames.join(', '),
      chef_groups: chefGroups,
    };
  });
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

const getChefOrderItemsAndTotals = (row, chefId) => {
  const items = parseJson(row.items);
  const filteredItems = items.filter((item) =>
    String(item.chef_user_id) === String(chefId) ||
    String(item.chef_id) === String(chefId)
  );

  const chefTotalQuantity = filteredItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  const chefTotalAmount = filteredItems.reduce((sum, item) => {
    const price = parseFloat(item.price || item.final_price || item.mrp || 0) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + price * quantity;
  }, 0);

  return {
    filteredItems,
    chefTotalQuantity,
    chefTotalAmount: parseFloat(chefTotalAmount.toFixed(2)),
  };
};

const getAllOrders = async (filters = {}) => {
  const { role, userId, numericId, status, chef_id, franchise_user_id, franchise_id, user_id, created_by_user_id, ordered_by_user_id, search } = filters;

  let query = 'SELECT * FROM user_food_order_table WHERE 1=1';
  const params = [];

  // Role-based filtering
  if (role === 'chef' && userId) {
    query += ' AND chef_user_id = ?';
    params.push(userId);
  } else if (role === 'franchise' && userId) {
    query += ' AND franchise_user_id = ?';
    params.push(userId);
  } else if (role === 'user' && userId) {
    query += ' AND (user_id = ? OR ordered_by_user_id = ?)';
    params.push(userId, userId);
  }

  // Status filter
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  // Chef ID filter
  if (chef_id) {
    const patterns = [
      `%"chef_user_id":"${chef_id}"%`,
      `%"chef_user_id":${chef_id}%`,
      `%"chef_id":"${chef_id}"%`,
      `%"chef_id":${chef_id}%`
    ];

    query += ' AND (chef_id = ? OR chef_user_id = ? OR items LIKE ? OR items LIKE ? OR items LIKE ? OR items LIKE ?)';
    params.push(chef_id, chef_id, ...patterns);
  }

  // Franchise filters
  if (franchise_user_id && franchise_id) {
    query += ' AND (franchise_user_id = ? OR franchise_id = ?)';
    params.push(franchise_user_id, franchise_id);
  } else if (franchise_user_id) {
    query += ' AND franchise_user_id = ?';
    params.push(franchise_user_id);
  } else if (franchise_id) {
    query += ' AND franchise_id = ?';
    params.push(franchise_id);
  }

  // User filter (for customers) - match user_id
  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  // Ordered by user filter (for personal orders) - match ordered_by_user_id
  if (ordered_by_user_id) {
    const stringId = String(ordered_by_user_id).trim();
    query += ' AND (user_id = ? OR user_id LIKE ? OR ordered_by_user_id = ? OR ordered_by_user_id LIKE ?)';
    params.push(stringId, `%${stringId}%`, stringId, `%${stringId}%`);
  }

  // Search filter
  if (search) {
    query += ' AND (customer_name LIKE ? OR customer_email LIKE ? OR order_id LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY ordered_at DESC';

  const [rows] = await pool.execute(query, params);

  return rows
    .map((row) => {
      const items = parseJson(row.items);
      const enrichedOrder = {
        ...row,
        items,
      };

      if (chef_id) {
        const chefData = getChefOrderItemsAndTotals(row, chef_id);
        const hasChefRow =
          String(row.chef_id) === String(chef_id) ||
          String(row.chef_user_id) === String(chef_id);

        return {
          ...enrichedOrder,
          items: chefData.filteredItems.length > 0 ? chefData.filteredItems : hasChefRow ? items : [],
          chef_total_amount: chefData.filteredItems.length > 0 ? chefData.chefTotalAmount : hasChefRow ? Number(row.total_amount || 0) : 0,
          chef_total_quantity: chefData.filteredItems.length > 0 ? chefData.chefTotalQuantity : hasChefRow ? items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) : 0,
        };
      }

      return enrichedOrder;
    })
    .filter((row) => {
      if (!chef_id) return true;
      return (
        row.items.length > 0 ||
        String(row.chef_id) === String(chef_id) ||
        String(row.chef_user_id) === String(chef_id)
      );
    });
};

const getFranchiseAdminOrders = async (franchiseUserId) => {
  // First, get all home chefs created by this franchise admin
  const [chefs] = await pool.execute(
    'SELECT chef_id, user_id FROM home_chefs WHERE created_by_user_id = ? OR franchise_user_id = ?',
    [franchiseUserId, franchiseUserId]
  );

  if (!chefs.length) {
    return [];
  }

  // Extract chef IDs and user IDs, filter out null values
  const chefIds = chefs.map(c => c.chef_id).filter(id => id);
  const chefUserIds = chefs.map(c => c.user_id).filter(id => id);

  // If no valid chef IDs, return empty
  if (!chefIds.length && !chefUserIds.length) {
    return [];
  }

  // Build query parts conditionally
  let query = 'SELECT * FROM user_food_order_table WHERE ';
  const queryParams = [];
  const queryParts = [];

  if (chefIds.length > 0) {
    const placeholders = chefIds.map(() => '?').join(',');
    queryParts.push(`chef_id IN (${placeholders})`);
    queryParams.push(...chefIds);
  }

  if (chefUserIds.length > 0) {
    const placeholders = chefUserIds.map(() => '?').join(',');
    queryParts.push(`chef_user_id IN (${placeholders})`);
    queryParams.push(...chefUserIds);
  }

  query += queryParts.join(' OR ');
  query += ' ORDER BY ordered_at DESC';

  const [rows] = await pool.execute(query, queryParams);

  return rows.map((row) => ({
    ...row,
    items: parseJson(row.items)
  }));
};


module.exports = {
  addUserFoodOrder,
  getAllOrders,
  getChefOrders,
  getUserOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  getFranchiseAdminOrders
};
