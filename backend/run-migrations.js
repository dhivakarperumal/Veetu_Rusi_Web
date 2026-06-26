const migrations = require('./src/config/migrations');

async function run() {
  try {
    console.log('Starting products migration...');
    if (typeof migrations.createProductsTable === 'function') {
      await migrations.createProductsTable();
      console.log('createProductsTable completed');
    } else {
      console.warn('createProductsTable not found in migrations module');
    }

    if (typeof migrations.createFranchiseProductsTable === 'function') {
      await migrations.createFranchiseProductsTable();
      console.log('createFranchiseProductsTable completed');
    } else {
      console.warn('createFranchiseProductsTable not found in migrations module');
    }

    if (typeof migrations.createChefFoodTable === 'function') {
      await migrations.createChefFoodTable();
      console.log('createChefFoodTable completed');
    } else {
      console.warn('createChefFoodTable not found in migrations module');
    }

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
