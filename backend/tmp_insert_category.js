const pool = require('./src/config/db');
(async () => {
  try {
    const sql = `INSERT INTO cheffoodcategorytable
      (catId, name, description, category_image, images, subcategory,
      chef_id, chef_user_id, chef_name, chef_phone, chef_email,
      franchise_id, franchise_user_id, franchise_name, franchise_email, franchise_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      'CAT999',
      'Test Category',
      'Inserted by test',
      null,
      JSON.stringify([]),
      JSON.stringify([]),
      null,
      'user_test_123',
      'Test Chef',
      '0000000000',
      'test@example.com',
      null,
      null,
      null,
      null,
      null
    ];
    const [result] = await pool.execute(sql, params);
    console.log('INSERT_OK', result.insertId);
  } catch (e) {
    console.error('INSERT_ERR', e.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
