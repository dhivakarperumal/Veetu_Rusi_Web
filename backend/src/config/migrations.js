const pool = require('./db');

const ensureColumnExists = async (tableName, columnName, columnDefinition) => {
    try {
        const [rows] = await pool.execute(
            'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [tableName, columnName]
        );
        if (!rows || rows.length === 0) {
            await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnName} ${columnDefinition}`);
        }
    } catch (err) {
        // Ignore failures caused by unsupported syntax or existing columns
    }
};

const dropColumnIfExists = async (tableName, columnName) => {
    try {
        const [rows] = await pool.execute(
            'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [tableName, columnName]
        );
        if (rows && rows.length > 0) {
            await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\``);
        }
    } catch (err) {
        // Ignore failures caused by unsupported syntax or missing columns
    }
};

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
            instructions LONGTEXT,
            spice_level VARCHAR(50),
            shelf_life_days INT,
            net_weight VARCHAR(100),
            package_count INT,
            packaging_type VARCHAR(100),
            packaging_image VARCHAR(255),
            manufacture_date DATE,
            expiry_date DATE,

            variants LONGTEXT,
            images LONGTEXT,

           

            

            franchise_user_id VARCHAR(255),
           

            created_by VARCHAR(255) DEFAULT NULL,
            updated_by VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            KEY idx_category (category),
            KEY idx_status (status),
            KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);
        await dropColumnIfExists('chef_products', 'chef_id');
        await dropColumnIfExists('chef_products', 'chef_user_id');
        await dropColumnIfExists('chef_products', 'chef_name');
        await dropColumnIfExists('chef_products', 'chef_phone');
        await dropColumnIfExists('chef_products', 'chef_email');
        await dropColumnIfExists('chef_products', 'created_by_user_id');
        await dropColumnIfExists('chef_products', 'created_by_email');
        await dropColumnIfExists('chef_products', 'created_by_name');
        await dropColumnIfExists('chef_products', 'created_by_phone');
        await dropColumnIfExists('chef_products', 'franchise_name');
        await dropColumnIfExists('chef_products', 'franchise_email');
        await dropColumnIfExists('chef_products', 'franchise_phone');
        await dropColumnIfExists('chef_products', 'franchise_id');
        try { await pool.execute('ALTER TABLE chef_products MODIFY mrp DECIMAL(10,2) NULL'); } catch {}
        try { await pool.execute('ALTER TABLE chef_products MODIFY offer_price DECIMAL(10,2) NULL'); } catch {}
        await ensureColumnExists('chef_products', 'franchise_user_id', 'VARCHAR(255)');
        await ensureColumnExists('chef_products', 'instructions', 'LONGTEXT');
        await ensureColumnExists('chef_products', 'packaging_image', 'VARCHAR(255)');
        await ensureColumnExists('chef_products', 'expiry_date', 'DATE');
        await ensureColumnExists('chef_products', 'images', 'LONGTEXT');
        await ensureColumnExists('chef_products', 'created_by', 'VARCHAR(255)');
        await ensureColumnExists('chef_products', 'updated_by', 'VARCHAR(255)');

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

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                KEY idx_category (category),
                KEY idx_status (status),
                KEY idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(createTableSQL);
            // Ensure audit and franchise ownership columns exist for franchise_products
            const addColumnCommands = [
                `ALTER TABLE franchise_products ADD COLUMN IF NOT EXISTS created_by VARCHAR(255)`,
                `ALTER TABLE franchise_products ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255)`,
                `ALTER TABLE franchise_products ADD INDEX IF NOT EXISTS idx_created_by (created_by)`
            ];
            for (const cmd of addColumnCommands) {
                try { await pool.execute(cmd); } catch {}
            }
            // Drop removed columns from existing tables (safe — errors ignored if column doesn't exist)
            const dropColumns = [
                'chef_id', 'chef_user_id', 'chef_name', 'chef_phone', 'chef_email',
                'created_by_user_id', 'created_by_email', 'created_by_name', 'created_by_phone',
                'franchise_user_id', 'franchise_name', 'franchise_email', 'franchise_phone', 'franchise_id'
            ];
            for (const col of dropColumns) {
                try { await pool.execute(`ALTER TABLE franchise_products DROP COLUMN ${col}`); } catch {}
            }
            // Drop old indexes if they exist
            try { await pool.execute('ALTER TABLE franchise_products DROP INDEX idx_chef_id'); } catch {}
            try { await pool.execute('ALTER TABLE franchise_products DROP INDEX idx_franchise_user_id'); } catch {}
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
            preparation_url VARCHAR(512),
            shelf_life_days INT,
            manufacture_date DATE,
            expiry_date DATE,
            mrp DECIMAL(10,2) NOT NULL,
            offer INT DEFAULT 0,
            final_price DECIMAL(10,2),
            dietary_tag VARCHAR(50),
            net_weight VARCHAR(100),
            packaging_type VARCHAR(100),
            packaging_image LONGTEXT,
            ingredients LONGTEXT,
            instructions LONGTEXT,
            images LONGTEXT,
            total_stock INT DEFAULT 0,
            variants LONGTEXT,
            status VARCHAR(50) DEFAULT 'Active',
            franchise_user_id VARCHAR(255),
            created_by VARCHAR(255) DEFAULT NULL,
            updated_by VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_category (category),
            KEY idx_franchise_user_id (franchise_user_id),
            KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN chef_id'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN chef_user_id'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN chef_name'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN chef_phone'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN chef_email'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN franchise_id'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN franchise_name'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN franchise_email'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN franchise_phone'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table DROP COLUMN created_by_phone'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table ADD COLUMN preparation_url VARCHAR(512)'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table ADD COLUMN packaging_image LONGTEXT'); } catch (err) {}
        try { await pool.execute('ALTER TABLE chef_food_table ADD COLUMN images LONGTEXT'); } catch (err) {}
        console.log('✓ Chef food table created or already exists');
    } catch (error) {
        console.error('✗ Error creating chef_food_table:', error.message);
    }
};

const createSubscriptionPlansTable = async () => {
    try {
        console.log('✓ createSubscriptionPlansTable is a no-op placeholder');
    } catch (error) {
        console.error('✗ Error in createSubscriptionPlansTable placeholder:', error.message);
    }
};

const createDeliveryPartnersTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS delivery_partners (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(255),
            delivery_partner_user_id VARCHAR(255),
            name VARCHAR(255),
            email VARCHAR(255),
            mobile VARCHAR(50),
            status VARCHAR(50) DEFAULT 'Pending',

            profile_photo VARCHAR(255),
            gender VARCHAR(50),
            date_of_birth DATE,
            age INT,
            blood_group VARCHAR(10),
            alt_mobile VARCHAR(50),

            emergency_contact_name VARCHAR(255),
            emergency_contact_relationship VARCHAR(100),
            emergency_contact_mobile VARCHAR(50),

            current_address LONGTEXT,
            permanent_address LONGTEXT,
            city VARCHAR(255),
            state VARCHAR(255),
            pincode VARCHAR(50),
            live_location VARCHAR(255),

            vehicle_type VARCHAR(100),
            vehicle_brand VARCHAR(255),
            vehicle_model VARCHAR(255),
            vehicle_number VARCHAR(100),
            vehicle_color VARCHAR(100),

            license_number VARCHAR(100),
            license_holder_name VARCHAR(255),
            license_issue_date DATE,
            license_expiry_date DATE,
            license_front_image VARCHAR(255),

            aadhaar_number VARCHAR(20),
            aadhaar_front_url VARCHAR(255),
            aadhaar_back_url VARCHAR(255),
            pan_number VARCHAR(100),
            pan_card_url VARCHAR(255),

            selfie_verification_url VARCHAR(255),
            selfie_with_vehicle VARCHAR(255),

            account_holder_name VARCHAR(255),
            bank_name VARCHAR(255),
            bank_account_number VARCHAR(255),
            ifsc_code VARCHAR(50),
            branch_name VARCHAR(255),
            upi_id VARCHAR(255),

            available_areas LONGTEXT,
            available_time_morning TINYINT(1) DEFAULT 0,
            available_time_afternoon TINYINT(1) DEFAULT 0,
            available_time_evening TINYINT(1) DEFAULT 0,
            available_time_night TINYINT(1) DEFAULT 0,
            preferred_distance VARCHAR(50),
            delivery_radius VARCHAR(50),
            driving_experience VARCHAR(255),

            password VARCHAR(255),
            license_back_image VARCHAR(255),
            selfie_with_aadhaar VARCHAR(255),
            vehicle_front_photo VARCHAR(255),

            created_by VARCHAR(255) DEFAULT NULL,
            updated_by VARCHAR(255) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            KEY idx_user_id (user_id),
            KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);

        // ensure optional columns exist
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN profile_photo VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN delivery_partner_user_id VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN created_by VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN updated_by VARCHAR(255)'); } catch {}

        console.log('✓ delivery_partners table created or already exists');

        // Seed a sample delivery partner row if table is empty
        try {
            const [countRows] = await pool.execute("SELECT COUNT(*) AS cnt FROM delivery_partners");
            const cnt = (countRows && countRows[0] && (countRows[0].cnt || countRows[0]['COUNT(*)'] || countRows[0].count)) || 0;
            if (cnt === 0) {
                const now = new Date().toISOString().slice(0,19).replace('T',' ');
                try {
                    await pool.execute(`INSERT INTO delivery_partners (
                        user_id, delivery_partner_user_id, name, email, mobile, status,
                        gender, date_of_birth, age, blood_group, current_address, city, state, pincode,
                        vehicle_type, vehicle_brand, vehicle_model, vehicle_number,
                        license_number, aadhaar_number, pan_number,
                        account_holder_name, bank_name, bank_account_number, ifsc_code, upi_id,
                        available_areas, available_time_morning, preferred_distance, delivery_radius, driving_experience,
                        password, created_by, updated_by, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        'dp_sample_001','dp_sample_001','Sample Delivery Partner','dp_sample@example.com','9999999999','Pending',
                        'Male','1990-01-01',30,'O+','123 Sample Street','Sample City','Sample State','123456',
                        'Bike','Honda','CBR500','MH12AB1234','LIC123456','111122223333','ABCDE1234F',
                        'Sample Account','Sample Bank','123456789012','IFSC000','sample@upi',
                        'Area1,Area2', 1, '5 KM', '10 KM', '5 years',
                        null, 'system', 'system', now, now
                    ]);
                    console.log('✓ Seeded sample delivery_partner row');
                } catch (seedErr) {
                    console.warn('Could not insert sample delivery_partner:', seedErr.message || seedErr);
                }
            }
        } catch (e) {
            console.warn('Could not check delivery_partners count for seeding:', e.message || e);
        }
    } catch (error) {
        console.error('✗ Error creating delivery_partners table:', error.message);
    }
};

const createReviewsTable = async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS deliverypartner_review (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id VARCHAR(255) NOT NULL,
                user_name VARCHAR(255),
                user_email VARCHAR(255),
                rating DECIMAL(2,1) NOT NULL,
                comment LONGTEXT,
                image VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Pending',
                delivery_partner_id VARCHAR(255) NOT NULL,
                delivery_partner_name VARCHAR(255),
                delivery_partner_phone VARCHAR(50),
                delivery_partner_email VARCHAR(255),
                admin_reply LONGTEXT,
                franchise_admin_id VARCHAR(255),
                franchise_admin_name VARCHAR(255),
                created_by VARCHAR(255),
                updated_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY idx_delivery_partner_id (delivery_partner_id),
                KEY idx_user_id (user_id),
                KEY idx_status (status),
                KEY idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✓ Delivery partner review table created or already exists');
    } catch (error) {
        console.error('✗ Error creating deliverypartner_review table:', error.message);
    }
};

const createWishlistTable = async () => {
    try {
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS wishlist (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(255) NOT NULL,
            product_id INT NOT NULL,
            variant_color VARCHAR(255),
            variant_size VARCHAR(255),
            image LONGTEXT,
            email VARCHAR(255),
            price DECIMAL(10, 2) DEFAULT 0,
            total_price DECIMAL(10, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_user_id (user_id),
            KEY idx_product_id (product_id),
            UNIQUE KEY unique_user_product (user_id, product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(createTableSQL);
        console.log('✓ Wishlist table created or already exists');
    } catch (error) {
        console.error('✗ Error creating wishlist table:', error.message);
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
                image VARCHAR(255),
                price DECIMAL(10,2) DEFAULT 0,
                quantity INT DEFAULT 1,
                total_price DECIMAL(10,2) DEFAULT 0,
                created_by_user_id VARCHAR(255),
                created_by_name VARCHAR(255),
                created_by_email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(sql);
            console.log('✓ user_food_cart table created or already exists');
        } catch (err) {
            console.error('✗ Error creating user_food_cart table:', err.message || err);
        }
    };

    const createChefFoodCategoryTable = async () => {
        try {
            const sql = `
            CREATE TABLE IF NOT EXISTS cheffoodcategorytable (
                id INT PRIMARY KEY AUTO_INCREMENT,
                catId VARCHAR(50) UNIQUE,
                name VARCHAR(255) NOT NULL,
                description LONGTEXT,
                category_image LONGTEXT,
                images LONGTEXT,
                subcategory LONGTEXT,

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

                KEY idx_catId (catId),
                KEY idx_chef_user_id (chef_user_id),
                KEY idx_franchise_user_id (franchise_user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(sql);
            console.log('✓ cheffoodcategorytable created or already exists');
            try { await pool.execute('ALTER TABLE cheffoodcategorytable ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255)'); } catch (e) {}
            try { await pool.execute('ALTER TABLE cheffoodcategorytable ADD COLUMN IF NOT EXISTS created_by_email VARCHAR(255)'); } catch (e) {}
            try { await pool.execute('ALTER TABLE cheffoodcategorytable ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255)'); } catch (e) {}
            try { await pool.execute('ALTER TABLE cheffoodcategorytable ADD COLUMN IF NOT EXISTS created_by_phone VARCHAR(20)'); } catch (e) {}
        } catch (err) {
            console.error('✗ Error creating cheffoodcategorytable:', err.message || err);
        }
    };

    const createChefCategoryTable = async () => {
        try {
            const sql = `
            CREATE TABLE IF NOT EXISTS chef_category (
                id INT PRIMARY KEY AUTO_INCREMENT,
                catId VARCHAR(50) UNIQUE,
                name VARCHAR(255) NOT NULL,
                description LONGTEXT,
                category_image LONGTEXT,
                images LONGTEXT,
                subcategory LONGTEXT,

                chef_id VARCHAR(255),
                chef_user_id VARCHAR(255),
                chef_name VARCHAR(255),
                chef_phone VARCHAR(20),
                chef_email VARCHAR(255),

                created_by_user_id VARCHAR(255),
                created_by_email VARCHAR(255),
                created_by_name VARCHAR(255),
                created_by_phone VARCHAR(20),

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                KEY idx_catId (catId),
                KEY idx_chef_user_id (chef_user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(sql);
            console.log('✓ chef_category table created or already exists');
        } catch (err) {
            console.error('✗ Error creating chef_category table:', err.message || err);
        }
    };

    const createFranchiseCategoryTable = async () => {
        try {
            const sql = `
            CREATE TABLE IF NOT EXISTS franchise_category (
                id INT PRIMARY KEY AUTO_INCREMENT,
                catId VARCHAR(50) UNIQUE,
                name VARCHAR(255) NOT NULL,
                description LONGTEXT,
                images LONGTEXT,
                subcategory LONGTEXT,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                KEY idx_catId (catId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(sql);
            
            // Drop columns if they exist
            try { await pool.execute('ALTER TABLE franchise_category DROP COLUMN franchise_user_id'); } catch {}
            try { await pool.execute('ALTER TABLE franchise_category DROP COLUMN franchise_id'); } catch {}
            try { await pool.execute('ALTER TABLE franchise_category DROP COLUMN created_by_user_id'); } catch {}
            try { await pool.execute('ALTER TABLE franchise_category DROP COLUMN created_by_email'); } catch {}
            try { await pool.execute('ALTER TABLE franchise_category DROP COLUMN created_by_name'); } catch {}

            console.log('✓ franchise_category table created or already exists');
        } catch (err) {
            console.error('✗ Error creating franchise_category table:', err.message || err);
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
            delivery_partner_user_id VARCHAR(255),
            delivery_partner_name VARCHAR(255),
            delivery_partner_phone VARCHAR(50),
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
            KEY idx_chef_user_id (chef_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await pool.execute(sql);
        // Add ordered_by_user_id if it doesn't exist
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN ordered_by_user_id VARCHAR(255)'); } catch (e) {}
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN delivery_partner_user_id VARCHAR(255)'); } catch (e) {}
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN delivery_partner_name VARCHAR(255)'); } catch (e) {}
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN delivery_partner_phone VARCHAR(50)'); } catch (e) {}
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN coupon_id INT DEFAULT NULL'); } catch (e) {}
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL'); } catch (e) {}
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0'); } catch (e) {}
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN final_total DECIMAL(10,2) DEFAULT 0'); } catch (e) {}
        console.log('✓ user_food_order_table created or already exists');
    } catch (err) {
        console.error('✗ Error creating user_food_order_table:', err.message || err);
    }
};

const createDeliveryLiveTrackingTable = async () => {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS delivery_live_tracking (
            id INT PRIMARY KEY AUTO_INCREMENT,
            order_id VARCHAR(100) NOT NULL,
            delivery_partner_user_id VARCHAR(255),
            delivery_partner_name VARCHAR(255),
            delivery_partner_phone VARCHAR(50),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            pincode VARCHAR(50),
            area VARCHAR(255),
            district VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Active',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_order_tracking (order_id)
        )`;
        await pool.execute(sql);
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN user_id VARCHAR(255)'); } catch (e) {}
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN user_name VARCHAR(255)'); } catch (e) {}
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN user_mail_id VARCHAR(255)'); } catch (e) {}
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN ordered_product_details JSON'); } catch (e) {}
        // Real distance tracking columns
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN pickup_latitude DECIMAL(10, 8) DEFAULT NULL'); } catch (e) {}
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN pickup_longitude DECIMAL(11, 8) DEFAULT NULL'); } catch (e) {}
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN dropoff_latitude DECIMAL(10, 8) DEFAULT NULL'); } catch (e) {}
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN dropoff_longitude DECIMAL(11, 8) DEFAULT NULL'); } catch (e) {}
        try { await pool.execute('ALTER TABLE delivery_live_tracking ADD COLUMN total_distance_km DECIMAL(8, 3) DEFAULT NULL'); } catch (e) {}
        console.log('✓ delivery_live_tracking table created or already exists');
    } catch (err) {
        console.error('✗ Error creating delivery_live_tracking table:', err.message || err);
    }
};

const cleanupHomeChefs = async () => {
    try {
        // Drop the entire home_chefs table as requested (destructive)
        try {
            await pool.execute(`DROP TABLE IF EXISTS \`home_chefs\``);
            console.log('✓ Dropped table: home_chefs');
        } catch (e) {
            console.error('Could not drop home_chefs table:', e.message || e);
        }

        // Also remove any lingering unique/index cleanup that targeted home_chefs
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_user_id`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_mobile`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_email`); } catch (e) {}

        console.log('✓ cleanupHomeChefs completed (home_chefs removed)');
    } catch (err) {
        console.error('✗ Error dropping home_chefs table:', err.message || err);
    }
};

const addHomeChefUniqueConstraints = async () => {
    try {
        // Drop existing unique constraints if they exist (to re-create them)
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_user_id`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_mobile`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_email`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_aadhaar_number`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` DROP INDEX IF EXISTS idx_pan_number`); } catch (e) {}

        // Add unique constraints
        try { await pool.execute(`ALTER TABLE \`home_chefs\` ADD UNIQUE INDEX idx_user_id (user_id)`); console.log('  Added: UNIQUE user_id'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` ADD UNIQUE INDEX idx_mobile (mobile)`); console.log('  Added: UNIQUE mobile'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` ADD UNIQUE INDEX idx_email (email)`); console.log('  Added: UNIQUE email'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` ADD UNIQUE INDEX idx_aadhaar_number (aadhaar_number)`); console.log('  Added: UNIQUE aadhaar_number'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`home_chefs\` ADD UNIQUE INDEX idx_pan_number (pan_number)`); console.log('  Added: UNIQUE pan_number'); } catch (e) {}

        console.log('✓ Added unique constraints to home_chefs table: user_id, mobile, email, aadhaar_number, pan_number');
    } catch (err) {
        console.error('✗ Error adding unique constraints to home_chefs:', err.message || err);
    }
};

const addDeliveryPartnerUniqueConstraints = async () => {
    try {
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_user_id`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_email`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_vehicle_number`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_license_number`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_aadhaar_number`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_pan_number`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_rc_book_number`); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` DROP INDEX IF EXISTS idx_delivery_partners_bank_account_number`); } catch (e) {}

        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_user_id (user_id)`); console.log('  Added: UNIQUE user_id'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_email (email)`); console.log('  Added: UNIQUE email'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_vehicle_number (vehicle_number)`); console.log('  Added: UNIQUE vehicle_number'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_license_number (license_number)`); console.log('  Added: UNIQUE license_number'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_aadhaar_number (aadhaar_number)`); console.log('  Added: UNIQUE aadhaar_number'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_pan_number (pan_number)`); console.log('  Added: UNIQUE pan_number'); } catch (e) {}
        // rc_book_number and related columns removed per schema change
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_bank_account_number (bank_account_number)`); console.log('  Added: UNIQUE bank_account_number'); } catch (e) {}

        console.log('✓ Added unique constraints to delivery_partners table: user_id, email, vehicle_number, license_number, aadhaar_number, pan_number, rc_book_number, bank_account_number');
    } catch (err) {
        console.error('✗ Error adding unique constraints to delivery_partners:', err.message || err);
    }
};

const createDpEarningsTables = async () => {
    try {
        const settingsSQL = `
        CREATE TABLE IF NOT EXISTS dp_earnings_settings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            base_pickup_charge DECIMAL(10,2) DEFAULT 20.00,
            base_delivery_charge DECIMAL(10,2) DEFAULT 15.00,
            per_km_charge DECIMAL(10,2) DEFAULT 5.00,
            minimum_charge DECIMAL(10,2) DEFAULT 30.00,
            waiting_time_charge_per_min DECIMAL(10,2) DEFAULT 2.00,
            free_waiting_time_mins INT DEFAULT 5,
            return_delivery_charge DECIMAL(10,2) DEFAULT 10.00,
            toll_charges DECIMAL(10,2) DEFAULT 0.00,
            platform_commission_percent DECIMAL(5,2) DEFAULT 10.00,
            gst_tax_percent DECIMAL(5,2) DEFAULT 18.00,
            
            cod_bonus DECIMAL(10,2) DEFAULT 5.00,
            night_delivery_bonus DECIMAL(10,2) DEFAULT 15.00,
            peak_hour_bonus DECIMAL(10,2) DEFAULT 10.00,
            rain_weather_bonus DECIMAL(10,2) DEFAULT 20.00,
            festival_bonus DECIMAL(10,2) DEFAULT 25.00,
            heavy_parcel_charge DECIMAL(10,2) DEFAULT 10.00,
            multi_order_bonus DECIMAL(10,2) DEFAULT 5.00,
            ev_vehicle_bonus DECIMAL(10,2) DEFAULT 10.00,
            
            daily_incentive_target_orders INT DEFAULT 15,
            daily_incentive_reward DECIMAL(10,2) DEFAULT 100.00,
            
            order_cancellation_penalty DECIMAL(10,2) DEFAULT 20.00,
            late_delivery_penalty DECIMAL(10,2) DEFAULT 15.00,
            customer_complaint_penalty DECIMAL(10,2) DEFAULT 50.00,
            
            updated_by VARCHAR(255) DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        const historySQL = `
        CREATE TABLE IF NOT EXISTS dp_earnings_history (
            id INT PRIMARY KEY AUTO_INCREMENT,
            delivery_partner_user_id VARCHAR(255) NOT NULL,
            order_id VARCHAR(100),
            
            base_pay DECIMAL(10,2) DEFAULT 0.00,
            distance_pay DECIMAL(10,2) DEFAULT 0.00,
            waiting_pay DECIMAL(10,2) DEFAULT 0.00,
            
            bonuses_total DECIMAL(10,2) DEFAULT 0.00,
            penalties_total DECIMAL(10,2) DEFAULT 0.00,
            
            platform_commission DECIMAL(10,2) DEFAULT 0.00,
            tax_amount DECIMAL(10,2) DEFAULT 0.00,
            net_earnings DECIMAL(10,2) DEFAULT 0.00,
            
            status VARCHAR(50) DEFAULT 'Credited',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            KEY idx_dp_user_id (delivery_partner_user_id),
            KEY idx_order_id (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        const payoutsSQL = `
        CREATE TABLE IF NOT EXISTS dp_payouts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            delivery_partner_user_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            transaction_id VARCHAR(100),
            payment_method VARCHAR(50),
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL,
            processed_by VARCHAR(255),
            
            KEY idx_dp_payout_user_id (delivery_partner_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.execute(settingsSQL);
        await pool.execute(historySQL);
        await pool.execute(payoutsSQL);

        // Seed settings if empty
        const [settingsCount] = await pool.execute('SELECT COUNT(*) as count FROM dp_earnings_settings');
        if (settingsCount[0].count === 0) {
            await pool.execute('INSERT INTO dp_earnings_settings () VALUES ()');
        }

        console.log('✓ Delivery Partner Earnings tables created');
    } catch (err) {
        console.error('✗ Error creating DP Earnings tables:', err.message || err);
    }
};

const createCouponsTable = async () => {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS coupons (
            id INT PRIMARY KEY AUTO_INCREMENT,
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            discount_type ENUM('percentage', 'fixed') NOT NULL,
            discount_value DECIMAL(10,2) NOT NULL,
            max_discount_amount DECIMAL(10,2) DEFAULT NULL,
            min_order_value DECIMAL(10,2) DEFAULT 0,
            start_date DATETIME NOT NULL,
            expiry_date DATETIME NOT NULL,
            usage_limit_global INT DEFAULT NULL,
            usage_limit_per_customer INT DEFAULT 1,
            applicable_for_all TINYINT(1) DEFAULT 1,
            specific_home_chefs JSON DEFAULT NULL,
            specific_categories JSON DEFAULT NULL,
            specific_products JSON DEFAULT NULL,
            first_order_only TINYINT(1) DEFAULT 0,
            new_customers_only TINYINT(1) DEFAULT 0,
            excluded_products JSON DEFAULT NULL,
            excluded_categories JSON DEFAULT NULL,
            excluded_home_chefs JSON DEFAULT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            usage_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await pool.execute(sql);
        console.log('✓ coupons table created or already exists');
    } catch (err) {
        console.error('✗ Error creating coupons table:', err.message || err);
    }
};

const createCouponUsageTable = async () => {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS coupon_usage (
            id INT PRIMARY KEY AUTO_INCREMENT,
            order_id VARCHAR(100) NOT NULL,
            customer_id VARCHAR(255) NOT NULL,
            coupon_id INT NOT NULL,
            coupon_code VARCHAR(50) NOT NULL,
            discount_amount DECIMAL(10,2) NOT NULL,
            order_total DECIMAL(10,2) NOT NULL,
            final_total DECIMAL(10,2) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_customer_id (customer_id),
            KEY idx_coupon_id (coupon_id),
            KEY idx_order_id (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await pool.execute(sql);
        console.log('✓ coupon_usage table created or already exists');
    } catch (err) {
        console.error('✗ Error creating coupon_usage table:', err.message || err);
    }
};

    module.exports = {
        createProductsTable,
        createRecipeDetailsTable,
        createFranchiseProductsTable,
        createChefFoodTable,
        createDeliveryPartnersTable,
        createSubscriptionPlansTable,
        createReviewsTable,
        createUserFoodCartTable,
        createUserFoodOrderTable,
        createDeliveryLiveTrackingTable,
        createDealersTable,
        createChefFoodCategoryTable,
        createChefCategoryTable,
        createFranchiseCategoryTable,
        createWishlistTable,
        cleanupHomeChefs,
        addHomeChefUniqueConstraints,
        addDeliveryPartnerUniqueConstraints,
        createDpEarningsTables,
        createCouponsTable,
        createCouponUsageTable,
        // Ensure audit columns exist on all tables
        ensureAuditColumns: async () => {
            try {
                const [tables] = await pool.execute("SHOW TABLES");
                const tableKey = Object.keys(tables[0] || {}).length ? Object.keys(tables[0])[0] : null;
                if (!tableKey) return;

                for (const row of tables) {
                    const tableName = row[tableKey];
                    // Skip internal/mysql tables and home_chefs (handled by cleanupHomeChefs)
                    if (!tableName || tableName.startsWith('mysql') || tableName.startsWith('sys') || tableName.startsWith('performance_schema') || tableName.startsWith('information_schema') || tableName === 'home_chefs') continue;

                    // Remove previously added verbose audit columns (ignore errors)
                    if (tableName !== 'franchise_products') {
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN created_by_id`); } catch (e) {}
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN created_by_user_id`); } catch (e) {}
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN created_by_name`); } catch (e) {}
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN created_by_email`); } catch (e) {}
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN updated_by_id`); } catch (e) {}
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN updated_by_user_id`); } catch (e) {}
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN updated_by_name`); } catch (e) {}
                        try { await pool.execute(`ALTER TABLE \`${tableName}\` DROP COLUMN updated_by_email`); } catch (e) {}
                    }

                    // Add only the desired compact audit columns
                    try { await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT NULL`); } catch (e) {}
                    try { await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) DEFAULT NULL`); } catch (e) {}
                    try { await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP`); } catch (e) {}
                    try { await pool.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (e) {}
                }

                console.log('✓ Ensured compact audit columns (created_by, updated_by, created_at, updated_at) on all tables (except home_chefs)');
            } catch (err) {
                console.error('✗ Error ensuring compact audit columns:', err.message || err);
            }
        }
    };