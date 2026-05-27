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
        'SELECT product_code FROM franchise_products WHERE product_code LIKE "SP%" ORDER BY id DESC LIMIT 1'
    );
    if (products.length === 0) return 'SP001';

    const lastCode = products[0].product_code || '';
    const numeric = parseInt(lastCode.replace(/^SP/i, ''), 10);
    const nextNumber = Number.isInteger(numeric) ? numeric + 1 : 1;
    return `SP${String(nextNumber).padStart(3, '0')}`;
};

const resolveChefFranchiseInfo = async (req) => {
    if (!req.user || req.user.role !== 'chef') return {};
    const { email, user_id } = req.user;
    const [rows] = await pool.execute(
        'SELECT created_by_user_id, created_by_id FROM home_chefs WHERE email = ? OR user_id = ? LIMIT 1',
        [email, user_id]
    );
    if (rows.length === 0) return {};
    return {
        franchise_user_id: rows[0].created_by_user_id || null,
        franchise_id: rows[0].created_by_id || null,
    };
};

exports.getCategories = async (req, res) => {
    try {
        const { franchise_user_id, franchise_id } = req.query;
        let effectiveFranchiseUserId = franchise_user_id;
        let effectiveFranchiseId = franchise_id;

        if (!effectiveFranchiseUserId && !effectiveFranchiseId && req.user?.role === 'chef') {
            const chefFranchiseInfo = await resolveChefFranchiseInfo(req);
            effectiveFranchiseUserId = chefFranchiseInfo.franchise_user_id || effectiveFranchiseUserId;
            effectiveFranchiseId = chefFranchiseInfo.franchise_id || effectiveFranchiseId;
        }

        let query = 'SELECT id, catId, name, description, subcategory, images, franchise_user_id, franchise_id, created_by_user_id, created_by_email, created_by_name FROM franchise_category WHERE 1=1';
        const params = [];

        if (effectiveFranchiseUserId) {
            query += ' AND (franchise_user_id = ? OR created_by_user_id = ?)';
            params.push(effectiveFranchiseUserId, effectiveFranchiseUserId);
        }
        if (effectiveFranchiseId) {
            query += ' AND franchise_id = ?';
            params.push(effectiveFranchiseId);
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
        console.error('Error fetching franchise categories:', error);
        res.status(500).json({ message: 'Failed to fetch franchise categories', error: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const { category, status, franchise_id, franchise_user_id } = req.query;
        let query = 'SELECT * FROM franchise_products WHERE 1=1';
        const params = [];

        if (franchise_id) {
            query += ' AND franchise_id = ?';
            params.push(franchise_id);
        }
        if (franchise_user_id) {
            query += ' AND franchise_user_id = ?';
            params.push(franchise_user_id);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (status && status !== 'All') {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [products] = await pool.execute(query, params);
        const normalizedProducts = products.map((product) => ({
            ...product,
            variants: parseJsonField(product.variants) || [],
            images: parseJsonField(product.images) || []
        }));

        res.json(normalizedProducts);
    } catch (error) {
        console.error('Error fetching franchise products:', error);
        res.status(500).json({ message: 'Failed to fetch franchise products', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await pool.execute('SELECT * FROM franchise_products WHERE id = ?', [id]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Franchise product not found' });
        }

        const product = products[0];
        res.json({
            ...product,
            variants: parseJsonField(product.variants) || [],
            images: parseJsonField(product.images) || []
        });
    } catch (error) {
        console.error('Error fetching franchise product:', error);
        res.status(500).json({ message: 'Failed to fetch franchise product', error: error.message });
    }
};

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
            created_by_user_id,
            franchise_user_id,
            created_by_email,
            created_by_name,
            created_by_phone,
            franchise_id
        } = req.body;

        if (!name || !category || !mrp) {
            return res.status(400).json({ message: 'Required fields: name, category, mrp' });
        }

        const finalProductCode = product_code || await generateNextProductCode();
        const finalFranchiseUserId = franchise_user_id || req.user?.user_id || req.user?.id || null;
        const finalCreatedByUserId = created_by_user_id || req.user?.user_id || req.user?.id || null;
        const finalCreatedByEmail = created_by_email || req.user?.email || null;
        const finalCreatedByName = created_by_name || req.user?.name || null;
        const finalCreatedByPhone = created_by_phone || req.user?.phone || null;
        const finalFranchiseId = franchise_id || null;

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
            variants ? JSON.stringify(variants) : null,
            images ? JSON.stringify(images) : null,
            finalFranchiseUserId,
            finalCreatedByName, finalCreatedByEmail, finalCreatedByPhone, finalCreatedByUserId,
            finalFranchiseId
        ];

        const columns = `name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, variants, images, franchise_user_id,
            created_by_name, created_by_email, created_by_phone, created_by_user_id,
            franchise_id`;

        const placeholders = params.map(() => '?').join(', ');
        const insertParams = params.map(v => v === undefined ? null : v);

        const [result] = await pool.execute(
            `INSERT INTO franchise_products (${columns}) VALUES (${placeholders})`,
            insertParams
        );

        res.status(201).json({
            message: 'Franchise product created successfully',
            id: result.insertId,
            product_code: finalProductCode
        });
    } catch (error) {
        console.error('Error creating franchise product:', error);
        res.status(500).json({ message: 'Failed to create franchise product', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, variants, images,
            franchise_user_id,
            created_by_user_id, created_by_email, created_by_name, created_by_phone, franchise_id
        } = req.body;

        const [existing] = await pool.execute('SELECT id FROM franchise_products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Franchise product not found' });
        }

        const updateQuery = `UPDATE franchise_products SET
                name = ?, description = ?, category = ?, product_type = ?, subcategory = ?,
                mrp = ?, offer = ?, offer_price = ?, product_code = ?, total_stock = ?,
                rating = ?, status = ?, material = ?, nutrition_info = ?, storage_instructions = ?,
                presentation_style = ?, portion_format = ?, service_type = ?, packaging_notes = ?,
                dietary_tag = ?, heat_profile = ?, serving_size = ?, prep_time = ?,
                ingredients = ?, spice_level = ?, shelf_life_days = ?, net_weight = ?,
                package_count = ?, packaging_type = ?, manufacture_date = ?, variants = ?, images = ?,
                franchise_user_id = ?,
                created_by_user_id = ?, created_by_email = ?, created_by_name = ?, created_by_phone = ?,
                franchise_id = ?, updated_at = NOW()
            WHERE id = ?`;
        const params = [
            name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, serializeJsonField(variants),
            images ? JSON.stringify(images) : null,
            franchise_user_id,
            created_by_user_id, created_by_email, created_by_name, created_by_phone,
            franchise_id,
            id
        ];

        const sanitized = params.map(v => v === undefined ? null : v);

        await pool.execute(updateQuery, sanitized);
        res.json({ message: 'Franchise product updated successfully' });
    } catch (error) {
        console.error('Error updating franchise product:', error);
        res.status(500).json({ message: 'Failed to update franchise product', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool.execute('SELECT id FROM franchise_products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Franchise product not found' });
        }

        await pool.execute('DELETE FROM franchise_products WHERE id = ?', [id]);
        res.json({ message: 'Franchise product deleted successfully' });
    } catch (error) {
        console.error('Error deleting franchise product:', error);
        res.status(500).json({ message: 'Failed to delete franchise product', error: error.message });
    }
};

exports.getLatestProductCode = async (req, res) => {
    try {
        const [products] = await pool.execute(
            'SELECT product_code FROM franchise_products WHERE product_code LIKE "SP%" ORDER BY id DESC LIMIT 1'
        );

        let nextCode = 'SP001';
        if (products.length > 0) {
            const lastCode = products[0].product_code;
            const num = parseInt(lastCode.replace('SP', ''), 10) + 1;
            nextCode = `SP${String(num).padStart(3, '0')}`;
        }

        res.json({ latestCode: nextCode });
    } catch (error) {
        console.error('Error getting franchise product code:', error);
        res.status(500).json({ message: 'Failed to get franchise product code', error: error.message });
    }
};
