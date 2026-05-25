const pool = require('./db');

const createProductsTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS products (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            description LONGTEXT,
            category VARCHAR(100),
            product_type VARCHAR(100),
            subcategory VARCHAR(100),
            mrp DECIMAL(10, 2) NOT NULL,
            offer INT DEFAULT 0,
            offer_price DECIMAL(10, 2),
            product_code VARCHAR(50) UNIQUE,
            total_stock INT DEFAULT 0,
            rating DECIMAL(2, 1) DEFAULT 5,
            status VARCHAR(50) DEFAULT 'Active',
            material VARCHAR(255),
            nutrition_info VARCHAR(255),
            storage_instructions VARCHAR(255),
            presentation_style VARCHAR(255),
            portion_format VARCHAR(255),
            service_type VARCHAR(255),
            packaging_notes VARCHAR(255),
            dietary_tag VARCHAR(255),
            heat_profile VARCHAR(255),
            serving_size VARCHAR(100),
            prep_time VARCHAR(100),
            ingredients LONGTEXT,
            spice_level VARCHAR(50),
            shelf_life_days INT,
            net_weight VARCHAR(100),
            package_count INT,
            packaging_type VARCHAR(100),
            manufacture_date DATE,
            variants LONGTEXT,
            chef_id VARCHAR(255) NOT NULL,
            chef_user_id VARCHAR(255),
            chef_name VARCHAR(255),
            chef_phone VARCHAR(20),
            chef_email VARCHAR(255),
            created_by_user_id VARCHAR(255),
            created_by_email VARCHAR(255),
            created_by_name VARCHAR(255),
            created_by_phone VARCHAR(20),
            franchise_user_id VARCHAR(255),
            franchise_name VARCHAR(255),
            franchise_email VARCHAR(255),
            franchise_phone VARCHAR(20),
            franchise_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_chef_id (chef_id),
            KEY idx_category (category),
            KEY idx_status (status),
            KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);
        // Ensure optional columns exist (use individual try/catch for compatibility with older MySQL)
        try { await pool.execute('ALTER TABLE products ADD COLUMN chef_user_id VARCHAR(255)'); } catch (e) { /* ignore if exists */ }
        try { await pool.execute('ALTER TABLE products ADD COLUMN franchise_user_id VARCHAR(255)'); } catch (e) { /* ignore if exists */ }
        try { await pool.execute('ALTER TABLE products ADD COLUMN franchise_name VARCHAR(255)'); } catch (e) { /* ignore if exists */ }
        try { await pool.execute('ALTER TABLE products ADD COLUMN franchise_email VARCHAR(255)'); } catch (e) { /* ignore if exists */ }
        try { await pool.execute('ALTER TABLE products ADD COLUMN franchise_phone VARCHAR(20)'); } catch (e) { /* ignore if exists */ }
        console.log('✓ Products table created or already exists');
    } catch (error) {
        console.error('✗ Error creating products table:', error.message);
    }
};

const createSubscriptionPlansTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            durationDays INT NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await pool.execute(createTableSQL);

        // Seed initial plans if empty
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM subscription_plans');
        if (rows[0].count === 0) {
            const initialPlans = [
                { id: 'plan_monthly', name: 'Monthly', amount: 1999, currency: 'INR', durationDays: 30 },
                { id: 'plan_quarter', name: 'Quarterly', amount: 4999, currency: 'INR', durationDays: 90 },
                { id: 'plan_yearly', name: 'Yearly', amount: 17999, currency: 'INR', durationDays: 365 },
                { id: 'plan_trial_1', name: 'Trial Plan', amount: 1, currency: 'INR', durationDays: 1 },
                { id: 'plan_expiry_2', name: 'Testing Expiry', amount: 10, currency: 'INR', durationDays: 2 }
            ];
            for (const plan of initialPlans) {
                await pool.execute(
                    'INSERT INTO subscription_plans (id, name, amount, currency, durationDays, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [plan.id, plan.name, plan.amount, plan.currency, plan.durationDays, 'Active']
                );
            }
            console.log('✓ Subscription plans seeded');
        }
        console.log('✓ Subscription plans table ready');
    } catch (error) {
        console.error('✗ Error creating subscription plans table:', error.message);
    }
};

module.exports = { createProductsTable, createSubscriptionPlansTable };
