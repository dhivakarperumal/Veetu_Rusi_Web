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
            chef_name VARCHAR(255),
            chef_phone VARCHAR(20),
            chef_email VARCHAR(255),
            created_by_user_id VARCHAR(255),
            created_by_email VARCHAR(255),
            created_by_name VARCHAR(255),
            created_by_phone VARCHAR(20),
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
        console.log('✓ Products table created or already exists');
    } catch (error) {
        console.error('✗ Error creating products table:', error.message);
    }
};

module.exports = { createProductsTable };
