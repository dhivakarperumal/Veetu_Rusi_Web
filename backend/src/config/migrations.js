const pool = require('./db');

const createProductsTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS chef_products (
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
            rating DECIMAL(2,1) DEFAULT 5,
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
            images LONGTEXT,

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

        try { await pool.execute('ALTER TABLE chef_products ADD COLUMN chef_user_id VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE chef_products ADD COLUMN franchise_user_id VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE chef_products ADD COLUMN franchise_name VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE chef_products ADD COLUMN franchise_email VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE chef_products ADD COLUMN franchise_phone VARCHAR(20)'); } catch {}
        try { await pool.execute('ALTER TABLE chef_products ADD COLUMN images LONGTEXT'); } catch {}

        console.log('✓ Chef products table created or already exists');
    } catch (error) {
        console.error('✗ Error creating chef_products table:', error.message);
    }
};

const createRecipeDetailsTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS recipe_details (
            id INT PRIMARY KEY AUTO_INCREMENT,

            title VARCHAR(255) NOT NULL,
            description LONGTEXT,
            category VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Active',
            recipe_code VARCHAR(50) UNIQUE,

            ingredients LONGTEXT,
            instructions LONGTEXT,

            chef_id VARCHAR(255),
            chef_user_id VARCHAR(255),
            chef_name VARCHAR(255),
            chef_phone VARCHAR(20),
            chef_email VARCHAR(255),

            franchise_id VARCHAR(255),
            franchise_user_id VARCHAR(255),
            franchise_name VARCHAR(255),
            franchise_email VARCHAR(255),
            franchise_phone VARCHAR(20),

            created_by_user_id VARCHAR(255),
            created_by_email VARCHAR(255),
            created_by_name VARCHAR(255),
            created_by_phone VARCHAR(20),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            KEY idx_chef_id (chef_id),
            KEY idx_franchise_user_id (franchise_user_id),
            KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);

        console.log('✓ Recipe details table created or already exists');
    } catch (error) {
        console.error('✗ Error creating recipe_details table:', error.message);
    }
};

const createDealersTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS dealers (
            id INT PRIMARY KEY AUTO_INCREMENT,
            dealer_id VARCHAR(255) UNIQUE,
            name VARCHAR(255) NOT NULL,
            contact VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            location VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Pending',
            rating DECIMAL(3,1) DEFAULT 0,
            orders INT DEFAULT 0,
            image LONGTEXT,
            details LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_status (status),
            KEY idx_location (location)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN dealer_id VARCHAR(255) UNIQUE'); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN contact VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN email VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN phone VARCHAR(50)'); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN location VARCHAR(255)'); } catch {}
        try { await pool.execute("ALTER TABLE dealers ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'"); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN rating DECIMAL(3,1) DEFAULT 0'); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN orders INT DEFAULT 0'); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN image LONGTEXT'); } catch {}
        try { await pool.execute('ALTER TABLE dealers ADD COLUMN details LONGTEXT'); } catch {}

        console.log('✓ Dealers table created or already exists');
    } catch (error) {
        console.error('✗ Error creating dealers table:', error.message);
    }
};

    const createFranchiseProductsTable = async () => {
        try {
            const createTableSQL = `
            CREATE TABLE IF NOT EXISTS franchise_products (
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
                rating DECIMAL(2,1) DEFAULT 5,
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
                images LONGTEXT,

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
            // ensure optional columns exist
            try { await pool.execute('ALTER TABLE franchise_products ADD COLUMN images LONGTEXT'); } catch {}
            try { await pool.execute('ALTER TABLE franchise_products ADD COLUMN franchise_user_id VARCHAR(255)'); } catch {}
            console.log('✓ Franchise products table created or already exists');
        } catch (error) {
            console.error('✗ Error creating franchise_products table:', error.message);
        }
    };

const createChefFoodTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS chef_food_table (
            id INT PRIMARY KEY AUTO_INCREMENT,
            category VARCHAR(100) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description LONGTEXT,
            cuisine VARCHAR(100),
            prep_time VARCHAR(100),
            shelf_life_days INT,
            mrp DECIMAL(10,2) NOT NULL,
            offer INT DEFAULT 0,
            final_price DECIMAL(10,2),
            dietary_tag VARCHAR(50),
            net_weight VARCHAR(100),
            packaging_type VARCHAR(100),
            ingredients LONGTEXT,
            instructions LONGTEXT,
            images LONGTEXT,
            status VARCHAR(50) DEFAULT 'Active',
            chef_id VARCHAR(255),
            chef_user_id VARCHAR(255),
            chef_name VARCHAR(255),
            chef_phone VARCHAR(20),
            chef_email VARCHAR(255),
            franchise_id VARCHAR(255),
            franchise_user_id VARCHAR(255),
            franchise_name VARCHAR(255),
            franchise_email VARCHAR(255),
            franchise_phone VARCHAR(20),
            created_by_user_id VARCHAR(255),
            created_by_name VARCHAR(255),
            created_by_email VARCHAR(255),
            created_by_phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_category (category),
            KEY idx_chef_id (chef_id),
            KEY idx_chef_user_id (chef_user_id),
            KEY idx_franchise_id (franchise_id),
            KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);
        try { await pool.execute('ALTER TABLE chef_food_table ADD COLUMN images LONGTEXT'); } catch (err) {}
        console.log('✓ Chef food table created or already exists');
    } catch (error) {
        console.error('✗ Error creating chef_food_table:', error.message);
    }
};

const createSubscriptionPlansTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            durationDays INT DEFAULT 30,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);
        console.log('✓ Subscription plans table created or already exists');
    } catch (error) {
        console.error('✗ Error creating subscription_plans table:', error.message);
    }
};

    const createReviewsTable = async () => {
        try {
            const createTableSQL = `
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                user_id VARCHAR(255),
                user_name VARCHAR(255),
                user_email VARCHAR(255),
                rating INT NOT NULL,
                comment LONGTEXT,
                review_image LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY idx_product_id (product_id),
                KEY idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(createTableSQL);
            console.log('✓ Reviews table created or already exists');
        } catch (error) {
            console.error('✗ Error creating reviews table:', error.message);
        }
    };

    const createUserFoodCartTable = async () => {
        try {
            const sql = `
            CREATE TABLE IF NOT EXISTS user_food_cart (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id VARCHAR(255),
                product_id INT,
                name VARCHAR(255),
                image LONGTEXT,
                price DECIMAL(10,2),
                total_price DECIMAL(10,2),
                quantity INT DEFAULT 1,

                created_by_user_id VARCHAR(255),
                created_by_name VARCHAR(255),
                created_by_email VARCHAR(255),
                created_by_phone VARCHAR(20),

                chef_user_id VARCHAR(255),
                chef_id VARCHAR(255),
                chef_name VARCHAR(255),
                chef_phone VARCHAR(20),
                chef_email VARCHAR(255),

                franchise_id VARCHAR(255),
                franchise_user_id VARCHAR(255),
                franchise_email VARCHAR(255),
                franchise_name VARCHAR(255),
                franchise_phone VARCHAR(20),

                ordered_by_name VARCHAR(255),
                ordered_by_user_id VARCHAR(255),
                ordered_by_email VARCHAR(255),
                ordered_by_phone VARCHAR(20),

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                KEY idx_user_id (user_id),
                KEY idx_product_id (product_id),
                KEY idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(sql);
            console.log('✓ user_food_cart table created or already exists');
        } catch (err) {
            console.error('✗ Error creating user_food_cart table:', err.message || err);
        }
    };

const createUserFoodOrderTable = async () => {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS user_food_order_table (
            id INT PRIMARY KEY AUTO_INCREMENT,
            order_id VARCHAR(100) NOT NULL UNIQUE,
            user_id VARCHAR(255),
            customer_name VARCHAR(255),
            customer_email VARCHAR(255),
            customer_phone VARCHAR(50),
            street_address TEXT,
            city VARCHAR(100),
            district VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            zip_code VARCHAR(50),
            delivery_date DATE,
            delivery_time VARCHAR(50),
            payment_method VARCHAR(50),
            payment_status VARCHAR(50) DEFAULT 'Pending',
            total_amount DECIMAL(10,2) DEFAULT 0,
            items JSON,
            delivery_partner VARCHAR(255),
            created_by_user_id VARCHAR(255),
            created_by_name VARCHAR(255),
            created_by_email VARCHAR(255),
            created_by_phone VARCHAR(20),
            chef_user_id VARCHAR(255),
            chef_id VARCHAR(255),
            chef_name VARCHAR(255),
            chef_email VARCHAR(255),
            chef_phone VARCHAR(20),
            franchise_user_id VARCHAR(255),
            franchise_id VARCHAR(255),
            franchise_name VARCHAR(255),
            franchise_email VARCHAR(255),
            franchise_phone VARCHAR(20),
            ordered_by_name VARCHAR(255),
            ordered_by_email VARCHAR(255),
            ordered_by_phone VARCHAR(20),
            status VARCHAR(50) DEFAULT 'Pending',
            ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_user_id (user_id),
            KEY idx_chef_user_id (chef_user_id),
            KEY idx_franchise_user_id (franchise_user_id),
            KEY idx_status (status),
            KEY idx_ordered_at (ordered_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(sql);
        console.log('✓ user_food_order_table created or already exists');
    } catch (err) {
        console.error('✗ Error creating user_food_order_table:', err.message || err);
    }
};

    module.exports = {
        createProductsTable,
        createRecipeDetailsTable,
        createFranchiseProductsTable,
        createChefFoodTable,
        createSubscriptionPlansTable,
        createReviewsTable,
        createUserFoodCartTable,
        createUserFoodOrderTable
    };