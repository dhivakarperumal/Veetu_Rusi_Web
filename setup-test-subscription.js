const pool = require('./backend/src/config/db');

async function setupTestSubscription() {
  try {
    const connection = await pool.getConnection();
    
    // Insert/Update admin franchise subscription with expired date
    const adminEmail = 'admin@gmail.com';
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const formattedDate = yesterdayDate.toISOString().split('T')[0];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const formattedStartDate = startDate.toISOString().split('T')[0];

    await connection.execute(
      `INSERT INTO franchise_owners (email, name, status, start_date, expiry_date)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       status = VALUES(status), 
       start_date = VALUES(start_date), 
       expiry_date = VALUES(expiry_date)`,
      [adminEmail, 'Admin Franchise', 'Inactive', formattedStartDate, formattedDate]
    );
    
    console.log('✅ Test subscription created for admin@gmail.com');
    console.log('📅 Start Date:', formattedStartDate);
    console.log('📅 Expiry Date:', formattedDate);
    console.log('🔴 Status: Inactive (Expired)');
    
    connection.release();
  } catch (error) {
    console.error('Error setting up test subscription:', error);
  }
}

setupTestSubscription();
