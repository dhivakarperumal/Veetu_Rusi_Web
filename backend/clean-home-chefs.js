const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'veetu_rusi'
    });

    console.log('Removing all verbose audit columns from home_chefs...');
    
    const columnsToRemove = [
      'created_by_id',
      'created_by_user_id', 
      'created_by_name',
      'created_by_email',
      'created_by_phone',
      'updated_by_id',
      'updated_by_user_id',
      'updated_by_name',
      'updated_by_email',
      'updated_by_phone'
    ];

    for (const col of columnsToRemove) {
      try {
        await conn.execute(`ALTER TABLE home_chefs DROP COLUMN ${col}`);
        console.log(`  ✓ Dropped: ${col}`);
      } catch (err) {
        if (err.message.includes('Unknown column')) {
          console.log(`  - ${col} does not exist`);
        } else {
          console.log(`  ✗ Error dropping ${col}: ${err.message}`);
        }
      }
    }

    // Verify final schema
    const [columns] = await conn.execute('SHOW COLUMNS FROM home_chefs');
    console.log(`\n✓ Final schema has ${columns.length} clean columns`);

    // Check for any remaining verbose columns
    const verboseCols = columns.filter(c => 
      c.Field.startsWith('created_by_') || c.Field.startsWith('updated_by_')
    );

    if (verboseCols.length > 0) {
      console.log('✗ WARNING: Still have verbose columns:');
      verboseCols.forEach(c => console.log(`  - ${c.Field}`));
    } else {
      console.log('✓ All verbose columns removed successfully!');
    }

    // Show final unique indexes
    const [indexes] = await conn.execute("SHOW INDEXES FROM home_chefs WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
    console.log(`\n✓ Unique constraints: ${[...new Set(indexes.map(i => i.Column_name))].join(', ')}`);

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
