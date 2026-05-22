const pool = require('./src/config/db');

(async () => {
  try {
    const name = 'Test Product';
    const description = 'Test desc';
    const category = 'Snacks';
    const product_type = 'Cooked Food';
    const subcategory = null;
    const mrp = 100.00;
    const offer = 0;
    const offer_price = 100.00;
    const finalProductCode = 'SP999';
    const total_stock = 10;
    const params = [
      name, description, category, product_type, subcategory,
      mrp, offer, offer_price, finalProductCode, total_stock,
      5, 'Active', null, null,
      'Keep Refrigerated', null,
      null, null, null, null, null,
      null, null, null, 'Medium', null, null, null,
      'Pouch', null, null, 'chef-123', 'Chef Test', '9876543210', 'chef@test.com', null, null, null, null, null
    ];
    const columns = `name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, variants, chef_id, chef_name, chef_phone, chef_email,
            created_by_user_id, created_by_email, created_by_name, created_by_phone, franchise_id`;
    const placeholders = params.map(() => '?').join(', ');
    const [result] = await pool.execute(`INSERT INTO products (${columns}) VALUES (${placeholders})`, params);
    console.log('Inserted id', result.insertId);
  } catch (e) {
    console.error(e);
  } finally { process.exit(0); }
})();
