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
            try { await pool.execute('ALTER TABLE franchise_products ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255)'); } catch {}
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
            cover_photo VARCHAR(255),
            gender VARCHAR(50),
            date_of_birth DATE,
            age INT,
            blood_group VARCHAR(10),
            alt_mobile VARCHAR(50),
            whatsapp_number VARCHAR(50),

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
            license_back_image VARCHAR(255),

            rc_book_number VARCHAR(100),
            rc_book_image VARCHAR(255),

            insurance_number VARCHAR(100),
            insurance_expiry_date DATE,
            insurance_document_image VARCHAR(255),

            aadhaar_number VARCHAR(20),
            aadhaar_front_url VARCHAR(255),
            aadhaar_back_url VARCHAR(255),
            pan_number VARCHAR(100),
            pan_card_url VARCHAR(255),

            selfie_verification_url VARCHAR(255),
            selfie_with_vehicle VARCHAR(255),
            selfie_with_aadhaar VARCHAR(255),
            vehicle_front_photo VARCHAR(255),
            vehicle_back_photo VARCHAR(255),
            police_verification_certificate VARCHAR(255),

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
            father_husband_name VARCHAR(255),

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
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN cover_photo VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN delivery_partner_user_id VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN created_by VARCHAR(255)'); } catch {}
        try { await pool.execute('ALTER TABLE delivery_partners ADD COLUMN updated_by VARCHAR(255)'); } catch {}

        console.log('✓ delivery_partners table created or already exists');
    } catch (error) {
        console.error('✗ Error creating delivery_partners table:', error.message);
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

                franchise_user_id VARCHAR(255),
                franchise_id VARCHAR(255),
                
                created_by_user_id VARCHAR(255),
                created_by_email VARCHAR(255),
                created_by_name VARCHAR(255),

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                KEY idx_catId (catId),
                KEY idx_franchise_user_id (franchise_user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `;

            await pool.execute(sql);
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
        // Add ordered_by_user_id if it doesn't exist
        try { await pool.execute('ALTER TABLE user_food_order_table ADD COLUMN ordered_by_user_id VARCHAR(255)'); } catch (e) {}
        console.log('✓ user_food_order_table created or already exists');
    } catch (err) {
        console.error('✗ Error creating user_food_order_table:', err.message || err);
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
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_rc_book_number (rc_book_number)`); console.log('  Added: UNIQUE rc_book_number'); } catch (e) {}
        try { await pool.execute(`ALTER TABLE \`delivery_partners\` ADD UNIQUE INDEX idx_delivery_partners_bank_account_number (bank_account_number)`); console.log('  Added: UNIQUE bank_account_number'); } catch (e) {}

        console.log('✓ Added unique constraints to delivery_partners table: user_id, email, vehicle_number, license_number, aadhaar_number, pan_number, rc_book_number, bank_account_number');
    } catch (err) {
        console.error('✗ Error adding unique constraints to delivery_partners:', err.message || err);
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
        createDealersTable,
        createChefFoodCategoryTable,
        createChefCategoryTable,
        createFranchiseCategoryTable,
        cleanupHomeChefs,
        addHomeChefUniqueConstraints,
        addDeliveryPartnerUniqueConstraints,
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