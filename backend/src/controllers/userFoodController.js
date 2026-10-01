const pool = require('../config/db');

const initUserFoodTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_food_cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255),
        product_id INT,
        name VARCHAR(255),
        image LONGTEXT,
        price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        quantity INT DEFAULT 1,

        chef_user_id VARCHAR(255),
        chef_id VARCHAR(255),
        chef_name VARCHAR(255),
        chef_phone VARCHAR(20),
        chef_email VARCHAR(255),

        franchise_id VARCHAR(255),
        franchise_user_id VARCHAR(255),
        franchise_email VARCHAR(255),
        franchise_name VARCHAR(255),
        franchise_phone VARCHAR(20),

        ordered_by_name VARCHAR(255),
        ordered_by_user_id VARCHAR(255),
        ordered_by_email VARCHAR(255),
        ordered_by_phone VARCHAR(20),

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error('Error initializing user_food_cart table:', err);
  }
};

initUserFoodTable();

const getCartByUser = async (user_id) => {
  const [rows] = await pool.execute('SELECT * FROM `user_food_cart` WHERE user_id = ?', [user_id]);
  return rows;
};

const addToUserFoodCart = async (data) => {
  let {
    user_id,
    product_id,
    name,
    image,
    price,
    total_price,
    quantity,
    chef_user_id,
    chef_id,
    chef_name,
    chef_phone,
    chef_email,
    franchise_id,
    franchise_user_id,
    franchise_email,
    franchise_name,
    franchise_phone,
    ordered_by_name,
    ordered_by_user_id,
    ordered_by_email,
    ordered_by_phone,
  } = data;

  let finalFranchiseUserId = franchise_user_id ? String(franchise_user_id).trim() : '';
  let finalFranchiseName = franchise_name ? String(franchise_name).trim() : '';

  // If franchise_user_id is missing, try to resolve it from chef_food_table or home_chefs
  if (!finalFranchiseUserId && product_id) {
    try {
      const [cfRows] = await pool.execute(
        `SELECT COALESCE(NULLIF(cf.franchise_user_id, ''), NULLIF(hc.created_by, ''), NULLIF(hc.franchise_user_id, ''), NULLIF(u.created_by, '')) AS resolved_franchise_user_id,
                COALESCE(NULLIF(fo.franchise_name, ''), NULLIF(fu.full_name, ''), 'Veetu Rusi Franchise') AS resolved_franchise_name,
                fu.email AS resolved_franchise_email,
                fu.mobile_number AS resolved_franchise_phone
         FROM chef_food_table cf
         LEFT JOIN users u ON cf.created_by = u.user_id
         LEFT JOIN home_chefs hc ON cf.created_by = hc.user_id
         LEFT JOIN users fu ON fu.user_id = COALESCE(NULLIF(cf.franchise_user_id, ''), NULLIF(hc.created_by, ''), NULLIF(hc.franchise_user_id, ''), NULLIF(u.created_by, ''))
         LEFT JOIN franchise_owners fo ON (fo.franch_user_id = COALESCE(NULLIF(cf.franchise_user_id, ''), NULLIF(hc.created_by, ''), NULLIF(hc.franchise_user_id, ''), NULLIF(u.created_by, '')) OR fo.franchise_id = COALESCE(NULLIF(cf.franchise_user_id, ''), NULLIF(hc.created_by, ''), NULLIF(hc.franchise_user_id, ''), NULLIF(u.created_by, '')))
         WHERE cf.id = ? LIMIT 1`,
        [product_id]
      );
      if (cfRows.length > 0 && cfRows[0].resolved_franchise_user_id) {
        finalFranchiseUserId = String(cfRows[0].resolved_franchise_user_id).trim();
        finalFranchiseName = finalFranchiseName || cfRows[0].resolved_franchise_name || '';
        franchise_email = franchise_email || cfRows[0].resolved_franchise_email || '';
        franchise_phone = franchise_phone || cfRows[0].resolved_franchise_phone || '';
      }
    } catch (err) {
      console.warn('Error resolving franchise for food cart:', err.message);
    }
  }

  // Check if existing items in cart belong to a DIFFERENT franchise
  const [existingCartItems] = await pool.execute(
    'SELECT * FROM `user_food_cart` WHERE user_id = ?',
    [user_id]
  );

  if (existingCartItems.length > 0) {
    const existingItemWithFranchise = existingCartItems.find(
      (item) => item.franchise_user_id && String(item.franchise_user_id).trim() !== ''
    );

    if (
      existingItemWithFranchise &&
      finalFranchiseUserId &&
      String(existingItemWithFranchise.franchise_user_id).trim() !== finalFranchiseUserId
    ) {
      const conflictError = new Error(
        `Your food cart contains items from another franchise (${existingItemWithFranchise.franchise_name || 'different franchise'}). You can only order from one franchise admin's home chefs at a time.`
      );
      conflictError.statusCode = 409;
      conflictError.code = 'FRANCHISE_CONFLICT';
      conflictError.existingFranchiseName = existingItemWithFranchise.franchise_name || 'Current Franchise';
      conflictError.existingFranchiseUserId = existingItemWithFranchise.franchise_user_id;
      throw conflictError;
    }
  }

  // check if same product for same user exists
  const existing = existingCartItems.filter((i) => String(i.product_id) === String(product_id));

  if (existing.length > 0) {
    const item = existing[0];
    const newQty = (item.quantity || 0) + (quantity || 1);
    const newTotal = parseFloat(item.price || 0) * newQty;
    await pool.execute('UPDATE `user_food_cart` SET quantity = ?, total_price = ? WHERE id = ?', [newQty, newTotal, item.id]);
    return { updated: true, id: item.id };
  }

  const [result] = await pool.execute(
    `INSERT INTO user_food_cart (user_id, product_id, name, image, price, total_price, quantity, chef_user_id, chef_id, chef_name, chef_phone, chef_email, franchise_id, franchise_user_id, franchise_email, franchise_name, franchise_phone, ordered_by_name, ordered_by_user_id, ordered_by_email, ordered_by_phone) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user_id,
      product_id,
      name,
      image,
      price || 0,
      total_price || 0,
      quantity || 1,
      chef_user_id || '',
      chef_id || '',
      chef_name || '',
      chef_phone || '',
      chef_email || '',
      franchise_id || '',
      finalFranchiseUserId,
      franchise_email || '',
      finalFranchiseName,
      franchise_phone || '',
      ordered_by_name || '',
      ordered_by_user_id || '',
      ordered_by_email || '',
      ordered_by_phone || '',
    ]
  );

  return { insertedId: result.insertId };
};

const updateQuantity = async (id, quantity, price) => {
  const total_price = parseFloat(price || 0) * quantity;
  await pool.execute('UPDATE `user_food_cart` SET quantity = ?, total_price = ? WHERE id = ?', [quantity, total_price, id]);
};

const removeItem = async (id) => {
  await pool.execute('DELETE FROM `user_food_cart` WHERE id = ?', [id]);
};

const clearCart = async (user_id) => {
  await pool.execute('DELETE FROM `user_food_cart` WHERE user_id = ?', [user_id]);
};

module.exports = {
  getCartByUser,
  addToUserFoodCart,
  updateQuantity,
  removeItem,
  clearCart,
};
