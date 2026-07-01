const pool = require('./src/config/db');

async function migrate() {
    try {
        await pool.query('ALTER TABLE dp_earnings_settings ADD COLUMN upi_enabled BOOLEAN DEFAULT FALSE, ADD COLUMN upi_id VARCHAR(255) DEFAULT ""');
        console.log('Migration successful');
    } catch (e) {
        console.error('Migration failed:', e.message);
    } finally {
        process.exit();
    }
}
migrate();
