const pool = require('./backend/src/config/db');

async function setupActiveSubscription() {
  try {
    const connection = await pool.getConnection();
    
    // Insert/Update admin franchise subscription with active date
    const adminEmail = 'admin@gmail.com';
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Started 30 days ago
    const formattedStartDate = startDate.toISOString().split('T')[0];

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 335); // Expires in 335 days (~11 months)
    const formattedExpiryDate = expiryDate.toISOString().split('T')[0];
    
    await connection.execute(
      `INSERT INTO franchise_owners (
        franchise_name, 
        owner_name, 
        email, 
        mobile, 
        city, 
        state, 
        status, 
        start_date, 
        expiry_date,
        login_status,
        franchise_id
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UUID())
       ON DUPLICATE KEY UPDATE 
       franchise_name = VALUES(franchise_name),
       owner_name = VALUES(owner_name),
       mobile = VALUES(mobile),
       city = VALUES(city),
       state = VALUES(state),
       status = VALUES(status), 
       start_date = VALUES(start_date), 
       expiry_date = VALUES(expiry_date),
       login_status = VALUES(login_status)`,
      [
        'Veetu Rusi Admin Franchise',
        'Dhivakar P',
        adminEmail,
        '9876543210',
        'Coimbatore',
        'Tamil Nadu',
        'Approved',
        formattedStartDate, 
        formattedExpiryDate,
        'Active'
      ]
    );
    
    console.log('✅ Active test subscription created for', adminEmail);
    console.log('📅 Start Date:', formattedStartDate);
    console.log('📅 Expiry Date:', formattedExpiryDate);
    console.log('🟢 Status: Active');
    
    connection.release();
  } catch (error) {
    console.error('Error setting up active subscription:', error);
  } finally {
    process.exit(0);
  }
}

setupActiveSubscription();
