const migrations = require('./src/config/migrations');

async function run() {
  try {
    console.log('Starting delivery_partners migration...');
    if (typeof migrations.createDeliveryPartnersTable === 'function') {
      await migrations.createDeliveryPartnersTable();
      console.log('createDeliveryPartnersTable completed');
    } else {
      console.warn('createDeliveryPartnersTable not found in migrations module');
    }
    try {
      if (typeof migrations.ensureAuditColumns === 'function') {
        await migrations.ensureAuditColumns();
        console.log('ensureAuditColumns completed');
      }
    } catch (e) {
      console.warn('ensureAuditColumns failed:', e.message || e);
    }
    console.log('Migration runner finished');
    process.exit(0);
  } catch (err) {
    console.error('Migration runner error:', err.message || err);
    process.exit(1);
  }
}

run();
