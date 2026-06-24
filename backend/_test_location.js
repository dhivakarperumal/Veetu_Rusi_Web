const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', database: 'veetu_rusi'});
  
  // Test 1: User pincode 635653 should match chefs with pincode 635653
  console.log('=== Test 1: Pincode 635653 match ===');
  const [r1] = await conn.execute(
    `SELECT cf.id, cf.food_name, cf.status, hc.pincode as chef_pincode, hc.city as chef_city
     FROM chef_food_table cf 
     LEFT JOIN home_chefs hc ON cf.created_by = hc.user_id 
     WHERE hc.pincode = '635653'`
  );
  console.log(`Found ${r1.length} products from chefs with pincode 635653`);
  r1.forEach(r => console.log(`  - [${r.status}] ${r.food_name} (chef pincode: ${r.chef_pincode}, city: ${r.chef_city})`));

  // Test 2: User pincode 635600 should NOT match 635653
  console.log('\n=== Test 2: Pincode 635600 (no match with 635653) ===');
  const [r2] = await conn.execute(
    `SELECT cf.id, cf.food_name, hc.pincode as chef_pincode
     FROM chef_food_table cf 
     LEFT JOIN home_chefs hc ON cf.created_by = hc.user_id 
     WHERE hc.pincode = '635600'`
  );
  console.log(`Found ${r2.length} products from chefs with pincode 635600`);

  // Test 3: City "Tirupattur" match
  console.log('\n=== Test 3: City Tirupattur match ===');
  const [r3] = await conn.execute(
    `SELECT cf.id, cf.food_name, cf.status, hc.city as chef_city, hc.pincode as chef_pincode
     FROM chef_food_table cf 
     LEFT JOIN home_chefs hc ON cf.created_by = hc.user_id 
     WHERE hc.city LIKE '%Tirupattur%' OR hc.city LIKE '%tirupattur%'`
  );
  console.log(`Found ${r3.length} products from chefs in Tirupattur`);
  r3.forEach(r => console.log(`  - [${r.status}] ${r.food_name} (city: ${r.chef_city}, pincode: ${r.chef_pincode})`));

  // Test 4: All foods with chef location info
  console.log('\n=== Test 4: All foods with location info ===');
  const [r4] = await conn.execute(
    `SELECT cf.id, cf.food_name, cf.status, hc.pincode, hc.city, hc.district, hc.area_name, hc.delivery_radius
     FROM chef_food_table cf 
     LEFT JOIN home_chefs hc ON cf.created_by = hc.user_id`
  );
  console.log(`Total foods: ${r4.length}`);
  r4.forEach(r => console.log(`  - [${r.status}] ${r.food_name} | pincode:${r.pincode} city:${r.city} district:${r.district} area:${r.area_name} radius:${r.delivery_radius}`));

  process.exit(0);
})();
