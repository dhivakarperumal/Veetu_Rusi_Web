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

        created_by_user_id VARCHAR(255),
        created_by_name VARCHAR(255),
        created_by_email VARCHAR(255),
        created_by_phone VARCHAR(20),

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
  const {
    user_id,
    product_id,
    name,
    image,
    price,
    total_price,
    quantity,
    created_by_user_id,
    created_by_name,
    created_by_email,
    created_by_phone,
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

  // check if same product for same user exists
  const [existing] = await pool.execute(
    'SELECT * FROM `user_food_cart` WHERE user_id = ? AND product_id = ?',
    [user_id, product_id]
  );

  if (existing.length > 0) {
    const item = existing[0];
    const newQty = (item.quantity || 0) + (quantity || 1);
    const newTotal = parseFloat(item.price || 0) * newQty;
    await pool.execute('UPDATE `user_food_cart` SET quantity = ?, total_price = ? WHERE id = ?', [newQty, newTotal, item.id]);
    return { updated: true, id: item.id };
  }

  const [result] = await pool.execute(
    `INSERT INTO 
      \
      `user_food_cart` (user_id, product_id, name, image, price, total_price, quantity, created_by_user_id, created_by_name, created_by_email, created_by_phone, chef_user_id, chef_id, chef_name, chef_phone, chef_email, franchise_id, franchise_user_id, franchise_email, franchise_name, franchise_phone, ordered_by_name, ordered_by_user_id, ordered_by_email, ordered_by_phone) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user_id,
      product_id,
      name,
      image,
      price || 0,
      total_price || 0,
      quantity || 1,
      created_by_user_id || '',
      created_by_name || '',
      created_by_email || '',
      created_by_phone || '',
      chef_user_id || '',
      chef_id || '',
      chef_name || '',
      chef_phone || '',
      chef_email || '',
      franchise_id || '',
      franchise_user_id || '',
      franchise_email || '',
      franchise_name || '',
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
