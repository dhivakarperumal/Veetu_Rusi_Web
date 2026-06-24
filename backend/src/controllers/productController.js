const pool = require('../config/db');

const parseJsonField = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const serializeJsonField = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        try {
            JSON.parse(value);
            return value;
        } catch {
            return JSON.stringify(value);
        }
    }
    return JSON.stringify(value);
};

const generateNextProductCode = async () => {
    const [products] = await pool.execute(
        'SELECT product_code FROM chef_products WHERE product_code LIKE "P%" ORDER BY id DESC LIMIT 1'
    );
    if (products.length === 0) return 'P001';

    const lastCode = products[0].product_code || '';
    const numeric = parseInt(lastCode.replace(/^P/i, ''), 10);
    const nextNumber = Number.isInteger(numeric) ? numeric + 1 : 1;
    return `P${String(nextNumber).padStart(3, '0')}`;
};

const resolveProductMetadata = async (req, body) => {
    const {
        chef_id,
        chef_user_id,
        chef_name,
        chef_phone,
        chef_email,
        franchise_id,
        franchise_user_id,
        franchise_name,
        franchise_email,
        franchise_phone
    } = body;

    const candidateChefId = chef_id || chef_user_id || req.user?.user_id || req.user?.id || null;
    const candidateEmail = chef_email || req.user?.email || null;
    const candidatePhone = chef_phone || req.user?.phone || null;

    let homeChef = null;
    if (candidateChefId || candidateEmail || candidatePhone) {
        const [rows] = await pool.execute(
            `SELECT hc.*, u.id AS user_id, u.user_id AS user_user_id, u.full_name AS user_name, u.mobile_number AS user_phone, u.email AS user_email
             FROM home_chefs hc
             LEFT JOIN users u ON (u.email = hc.email OR u.mobile_number = hc.mobile)
             WHERE hc.user_id = ?
                OR hc.email = ?
                OR hc.mobile = ?
                OR u.user_id = ?
                OR u.id = ?
             LIMIT 1`,
            [candidateChefId, candidateEmail, candidatePhone, candidateChefId, candidateChefId]
        );
        if (rows.length > 0) homeChef = rows[0];
    }

    const finalChefUserId = chef_user_id || req.user?.user_id || req.user?.id || homeChef?.user_user_id || homeChef?.user_id || null;
    const finalChefId = chef_id || homeChef?.chef_id || homeChef?.user_id || homeChef?.user_user_id || null;
    const finalChefName = chef_name || homeChef?.name || req.user?.name || homeChef?.user_name || null;
    const finalChefPhone = chef_phone || homeChef?.mobile || req.user?.phone || homeChef?.user_phone || null;
    const finalChefEmail = chef_email || homeChef?.email || req.user?.email || homeChef?.user_email || null;

    const finalFranchiseUserId = franchise_user_id || homeChef?.created_by || homeChef?.franchise_user_id || homeChef?.created_by_user_id || null;
    const finalFranchiseId = franchise_id || homeChef?.created_by_id || null;
    let finalFranchiseName = franchise_name || homeChef?.created_by_name || null;
    let finalFranchiseEmail = franchise_email || homeChef?.created_by_email || null;
    let finalFranchisePhone = franchise_phone || homeChef?.created_by_phone || null;

    if (finalFranchiseUserId) {
        const [franchiseUsers] = await pool.execute(
            'SELECT id, user_id, full_name AS name, mobile_number AS phone, email FROM users WHERE id = ? OR user_id = ? LIMIT 1',
            [finalFranchiseUserId, finalFranchiseUserId]
        );
        if (franchiseUsers.length > 0) {
            const fu = franchiseUsers[0];
            finalFranchiseName = finalFranchiseName || fu.name || null;
            finalFranchiseEmail = finalFranchiseEmail || fu.email || null;
            finalFranchisePhone = finalFranchisePhone || fu.phone || null;
        }
    }

    return {
        finalChefId,
        finalChefUserId,
        finalChefName,
        finalChefPhone,
        finalChefEmail,
        finalFranchiseId,
        finalFranchiseUserId,
        finalFranchiseName,
        finalFranchiseEmail,
        finalFranchisePhone
    };
};

// Get all products (with filters). If `chef_user_id` or `chef_id` is present, return chef-owned `chef_products`.
// Otherwise fall back to franchise/admin `franchise_products` if desired by callers.
exports.getAllProducts = async (req, res) => {
    try {
        const { category, status, franchise_id, franchise_user_id, chef_user_id, chef_id } = req.query;
        const params = [];
        let query = '';

        if (chef_user_id || chef_id) {
            query = 'SELECT * FROM chef_products WHERE 1=1';
            if (chef_id) { query += ' AND chef_id = ?'; params.push(chef_id); }
            if (chef_user_id) { query += ' AND chef_user_id = ?'; params.push(chef_user_id); }
        } else {
            query = 'SELECT * FROM franchise_products WHERE 1=1';
            if (franchise_id) { query += ' AND franchise_id = ?'; params.push(franchise_id); }
            if (franchise_user_id) { query += ' AND franchise_user_id = ?'; params.push(franchise_user_id); }
        }

        if (category) { query += ' AND category = ?'; params.push(category); }
        if (status && status !== 'All') { query += ' AND status = ?'; params.push(status); }

        query += ' ORDER BY created_at DESC';

        const [products] = await pool.execute(query, params);
        const normalizedProducts = products.map((product) => ({
            ...product,
            variants: parseJsonField(product.variants) || [],
            images: parseJsonField(product.images) || []
        }));

        res.json(normalizedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
};

// Get product by ID - from chef_products table
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [chefProducts] = await pool.execute('SELECT * FROM chef_products WHERE id = ?', [id]);

        if (chefProducts.length > 0) {
            const product = chefProducts[0];
            return res.json({
                ...product,
                variants: parseJsonField(product.variants) || [],
                images: parseJsonField(product.images) || []
            });
        }

        const [franchiseProducts] = await pool.execute('SELECT * FROM franchise_products WHERE id = ?', [id]);
        if (franchiseProducts.length > 0) {
            const product = franchiseProducts[0];
            return res.json({
                ...product,
                variants: parseJsonField(product.variants) || [],
                images: parseJsonField(product.images) || []
            });
        }

        return res.status(404).json({ message: 'Product not found' });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Failed to fetch product', error: error.message });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            product_type,
            subcategory,
            mrp,
            offer,
            offer_price,
            product_code,
            total_stock,
            rating,
            status,
            material,
            nutrition_info,
            storage_instructions,
            presentation_style,
            portion_format,
            service_type,
            packaging_notes,
            dietary_tag,
            heat_profile,
            serving_size,
            prep_time,
            ingredients,
            spice_level,
            shelf_life_days,
            net_weight,
            package_count,
            packaging_type,
            manufacture_date,
            variants,
            images,
            chef_id,
            chef_user_id,
            chef_name,
            chef_phone,
            chef_email,
            franchise_user_id,
            franchise_name,
            franchise_email,
            franchise_phone,
            franchise_id
        } = req.body;

        if (!name || !category || !mrp) return res.status(400).json({ message: 'Required fields: name, category, mrp' });

        const finalProductCode = product_code || await generateNextProductCode();
        const metadata = await resolveProductMetadata(req, req.body);
        const {
            finalChefId,
            finalChefUserId,
            finalChefName,
            finalChefPhone,
            finalChefEmail,
            finalFranchiseId,
            finalFranchiseUserId,
            finalFranchiseName,
            finalFranchiseEmail,
            finalFranchisePhone
        } = metadata;

        const finalFranchiseIdResolved = franchise_id || finalFranchiseId || null;
        const createdBy = req.user?.user_id || req.user?.id || req.user?.email || req.user?.name || req.body.created_by || 'Admin';

        const params = [
            name, description || null, category, product_type || 'Cooked Food', subcategory || null,
            mrp, offer || 0, offer_price || mrp, finalProductCode, total_stock || 0,
            rating || 5, status || 'Active', material || null, nutrition_info || null,
            storage_instructions || 'Keep Refrigerated', presentation_style || null,
            portion_format || null, service_type || null, packaging_notes || null,
            dietary_tag || null, heat_profile || null, serving_size || null,
            prep_time || null, ingredients || null, spice_level || 'Medium',
            shelf_life_days || null, net_weight || null, package_count || null,
            packaging_type || 'Pouch', manufacture_date || null,
            serializeJsonField(variants), images ? JSON.stringify(images) : null,
            finalChefId, finalChefUserId, finalChefName, finalChefPhone, finalChefEmail,
            finalFranchiseUserId, finalFranchiseName, finalFranchiseEmail, finalFranchisePhone,
            finalFranchiseIdResolved, createdBy
        ];

        const columns = `name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, variants, images, chef_id, chef_user_id, chef_name, chef_phone, chef_email,
            franchise_user_id, franchise_name, franchise_email, franchise_phone,
            franchise_id, created_by`;

        const placeholders = params.map(() => '?').join(', ');
        const insertParams = params.map(v => v === undefined ? null : v);

        const [result] = await pool.execute(
            `INSERT INTO chef_products (${columns}) VALUES (${placeholders})`,
            insertParams
        );

        res.status(201).json({ message: 'Franchise product created successfully', id: result.insertId, product_code: finalProductCode });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, variants, images,
            chef_id, chef_user_id, chef_name, chef_phone, chef_email,
            franchise_user_id, franchise_name, franchise_email, franchise_phone,
            franchise_id
        } = req.body;

        const [existing] = await pool.execute('SELECT id FROM chef_products WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

        const metadata = await resolveProductMetadata(req, req.body);
        const {
            finalChefId,
            finalChefUserId,
            finalChefName,
            finalChefPhone,
            finalChefEmail,
            finalFranchiseId,
            finalFranchiseUserId,
            finalFranchiseName,
            finalFranchiseEmail,
            finalFranchisePhone
        } = metadata;

        const finalChefIdResolved = chef_id || finalChefId || null;
        const finalChefUserIdResolved = chef_user_id || finalChefUserId || null;
        const finalChefNameResolved = chef_name || finalChefName || null;
        const finalChefPhoneResolved = chef_phone || finalChefPhone || null;
        const finalChefEmailResolved = chef_email || finalChefEmail || null;

        const finalFranchiseIdResolved = franchise_id || finalFranchiseId || null;
        const finalFranchiseUserIdResolved = franchise_user_id || finalFranchiseUserId || null;
        const finalFranchiseNameResolved = franchise_name || finalFranchiseName || null;
        const finalFranchiseEmailResolved = franchise_email || finalFranchiseEmail || null;
        const finalFranchisePhoneResolved = franchise_phone || finalFranchisePhone || null;

        const updatedBy = req.user?.user_id || req.user?.id || req.user?.email || req.user?.name || req.body.updated_by || 'Admin';

        const updateQuery = `UPDATE chef_products SET
                name = ?, description = ?, category = ?, product_type = ?, subcategory = ?,
                mrp = ?, offer = ?, offer_price = ?, product_code = ?, total_stock = ?,
                rating = ?, status = ?, material = ?, nutrition_info = ?, storage_instructions = ?,
                presentation_style = ?, portion_format = ?, service_type = ?, packaging_notes = ?,
                dietary_tag = ?, heat_profile = ?, serving_size = ?, prep_time = ?,
                ingredients = ?, spice_level = ?, shelf_life_days = ?, net_weight = ?,
                package_count = ?, packaging_type = ?, manufacture_date = ?, variants = ?, images = ?,
                chef_id = ?, chef_user_id = ?, chef_name = ?, chef_phone = ?, chef_email = ?,
                franchise_user_id = ?, franchise_name = ?, franchise_email = ?, franchise_phone = ?,
                franchise_id = ?, updated_by = ?, updated_at = NOW()
            WHERE id = ?`;

        const params = [
            name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, serializeJsonField(variants), images ? JSON.stringify(images) : null,
            finalChefIdResolved, finalChefUserIdResolved, finalChefNameResolved, finalChefPhoneResolved, finalChefEmailResolved,
            finalFranchiseUserIdResolved, finalFranchiseNameResolved, finalFranchiseEmailResolved, finalFranchisePhoneResolved,
            finalFranchiseIdResolved, updatedBy, id
        ];

        const sanitized = params.map(v => v === undefined ? null : v);
        await pool.execute(updateQuery, sanitized);
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute('SELECT id FROM chef_products WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });

        await pool.execute('DELETE FROM chef_products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product', error: error.message });
    }
};

// Get latest product code
exports.getLatestProductCode = async (req, res) => {
    try {
        const [products] = await pool.execute(
            'SELECT product_code FROM chef_products WHERE product_code LIKE "P%" ORDER BY id DESC LIMIT 1'
        );

        let nextCode = 'P001';
        if (products.length > 0) {
            const lastCode = products[0].product_code || '';
            const num = parseInt(lastCode.replace(/^P/i, ''), 10);
            const nextNumber = Number.isInteger(num) ? num + 1 : 1;
            nextCode = `P${String(nextNumber).padStart(3, '0')}`;
        }

        res.json({ latestCode: nextCode });
    } catch (error) {
        console.error('Error getting product code:', error);
        res.status(500).json({ message: 'Failed to get product code', error: error.message });
    }
};

// Get categories - optionally filtered by franchise
exports.getCategories = async (req, res) => {
    try {
        const { franchise_user_id } = req.query;
        let query = 'SELECT id, catId, name, description, subcategory, images, created_by FROM franchise_category WHERE 1=1';
        const params = [];

        if (franchise_user_id) {
            query += ' AND (created_by = ? OR created_by IS NULL)';
            params.push(franchise_user_id);
        }
        query += ' ORDER BY id DESC';

        const [rows] = await pool.execute(query, params);

        const categories = rows.map((row) => ({
            ...row,
            subcategory: parseJsonField(row.subcategory) || [],
            images: parseJsonField(row.images) || []
        }));

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }
};

const generateNextCategoryId = async (franchiseUserId) => {
    const [rows] = await pool.execute(
        'SELECT catId FROM franchise_category WHERE created_by <=> ?',
        [franchiseUserId]
    );

    let maxId = 0;
    rows.forEach((row) => {
        if (!row.catId) return;
        const match = row.catId.match(/\d+/);
        if (match) {
            const numericId = parseInt(match[0], 10);
            if (!Number.isNaN(numericId) && numericId > maxId) {
                maxId = numericId;
            }
        }
    });

    return `CAT${String(maxId + 1).padStart(3, '0')}`;
};

// Create a new category in database
exports.createCategory = async (req, res) => {
    try {
        const { catId, name, description, subcategory = [], images, franchise_user_id, franchise_id, created_by_user_id } = req.body;
        const categoryName = name || req.body.cname;
        const categoryDescription = description || req.body.cdescription || '';
        const categoryImages = images || req.body.cimgs || [];

        if (!categoryName) return res.status(400).json({ message: 'Category name is required' });

        const finalFranchiseUserId = franchise_user_id || req.user?.user_id || req.user?.id || null;
        const finalCreatedByUserId = created_by_user_id || req.user?.user_id || req.user?.id || null;
        const finalFranchiseId = franchise_id || null;

        let finalCatId = await generateNextCategoryId(finalCreatedByUserId);

        const insertSql =
            'INSERT INTO franchise_category (catId, name, description, subcategory, images, created_by) VALUES (?, ?, ?, ?, ?, ?)';

        const insertParams = [
            finalCatId,
            categoryName,
            categoryDescription,
            JSON.stringify(subcategory),
            JSON.stringify(categoryImages),
            finalCreatedByUserId || req.user?.email || req.user?.name || null
        ];

        let result;
        let attempt = 0;
        const maxAttempts = 5;

        while (attempt < maxAttempts) {
            try {
                [result] = await pool.execute(insertSql, insertParams);
                break;
            } catch (insertErr) {
                if (insertErr.code === 'ER_DUP_ENTRY') {
                    attempt += 1;
                    finalCatId = await generateNextCategoryId(finalCreatedByUserId);
                    insertParams[0] = finalCatId;
                    continue;
                }
                throw insertErr;
            }
        }

        if (!result) return res.status(409).json({ message: 'Unable to generate a unique Category ID. Please try again.' });

        res.status(201).json({ message: 'Category created successfully', id: result.insertId, catId: finalCatId });
    } catch (err) {
        console.error('Failed to create category:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Category ID conflict, try again' });
        }
        res.status(500).json({ message: 'Failed to create category', error: err.message });
    }
};


// Update existing category by catId or id
exports.updateCategory = async (req, res) => {
    try {
        const catId = req.params.catId;
        const updates = req.body;
        const fields = [];
        const params = [];

        if (updates.catId) {
            fields.push('catId = ?');
            params.push(updates.catId);
        }
        if (updates.name || updates.cname) {
            fields.push('name = ?');
            params.push(updates.name || updates.cname);
        }
        if (updates.description !== undefined || updates.cdescription !== undefined) {
            fields.push('description = ?');
            params.push(updates.description !== undefined ? updates.description : updates.cdescription);
        }
        if (updates.subcategory !== undefined) {
            fields.push('subcategory = ?');
            params.push(JSON.stringify(updates.subcategory));
        }
        if (updates.images !== undefined || updates.cimgs !== undefined) {
            fields.push('images = ?');
            params.push(JSON.stringify(updates.images !== undefined ? updates.images : updates.cimgs));
        }

        // Always update the updated_by field with the user's ID, not their name
        const updatedByUserId = req.user?.user_id || req.user?.id || req.body?.updated_by || null;
        if (updatedByUserId) {
            fields.push('updated_by = ?');
            params.push(updatedByUserId);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        params.push(catId, catId);
        const [result] = await pool.execute(
            `UPDATE franchise_category SET ${fields.join(', ')} WHERE catId = ? OR id = ?`,
            params
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });

        res.json({ message: 'Updated' });
    } catch (err) {
        console.error('Failed to update category:', err);
        res.status(500).json({ message: 'Failed to update category', error: err.message });
    }
};

// Delete category by catId or id
exports.deleteCategory = async (req, res) => {
    try {
        const catId = req.params.catId;
        const [result] = await pool.execute(
            'DELETE FROM franchise_category WHERE catId = ? OR id = ?',
            [catId, catId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Failed to delete category:', err);
        res.status(500).json({ message: 'Failed to delete category', error: err.message });
    }
};