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

exports.getAllProducts = async (req, res) => {
    try {
        const { category, status, franchise_user_id, search } = req.query;
        let query = 'SELECT * FROM franchise_products WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        const requestedCreatedBy = await (async () => {
            if (franchise_user_id) return franchise_user_id;

            if (!req.user) return null;
            const role = String(req.user.role || '').toLowerCase();
            const currentUserId = req.user.user_id || req.user.id || null;

            if (role === 'admin' || role === 'franchise') {
                return currentUserId;
            }

            if (role === 'chef' || role === 'homechef') {
                if (!currentUserId) return null;
                try {
                    const [chefRows] = await pool.execute(
                        'SELECT created_by FROM home_chefs WHERE user_id = ? OR email = ? LIMIT 1',
                        [currentUserId, req.user.email || '']
                    );
                    const chefRow = chefRows[0];
                    return chefRow ? chefRow.created_by : null;
                } catch (err) {
                    console.error('Error querying home_chefs for chef role filter:', err.message);
                    return null;
                }
            }

            return null;
        })();

        if (requestedCreatedBy) {
            query += ' AND created_by = ?';
            params.push(requestedCreatedBy);
        }

        // Only apply status filter if explicitly requested; default to showing Active products
        if (status && status !== 'All') {
            query += ' AND status = ?';
            params.push(status);
        } else if (!status) {
            // For public shop, show only Active products by default
            query += ' AND status = \'Active\'';
        }

        if (search) {
            query += ' AND (name LIKE ? OR product_code LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
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
        // Debug log to help trace calls coming from different branches/clients
        try {
            console.log('createProduct called - user:', req.user, 'body keys:', Object.keys(req.body || {}));
        } catch(e) {}
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
            images
        } = req.body;

        if (!name || !category || !mrp) {
            return res.status(400).json({ message: 'Required fields: name, category, mrp' });
        }

        const finalProductCode = product_code || await generateNextProductCode();
        const createdBy = req.user?.user_id || req.user?.id || req.body?.created_by || req.user?.email || 'Admin';

        const params = [
            name, description || null, category, product_type || 'Cooked Food', subcategory || null,
            mrp, offer || 0, offer_price || mrp, finalProductCode, total_stock || 0,
            rating || 5, status || 'Inactive', material || null, nutrition_info || null,
            storage_instructions || 'Keep Refrigerated', presentation_style || null,
            portion_format || null, service_type || null, packaging_notes || null,
            dietary_tag || null, heat_profile || null, serving_size || null,
            prep_time || null, ingredients || null, spice_level || 'Medium',
            shelf_life_days || null, net_weight || null, package_count || null,
            packaging_type || 'Pouch', manufacture_date || null,
            variants ? JSON.stringify(variants) : null,
            images ? JSON.stringify(images) : null,
            createdBy
        ];

        const columns = `name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, variants, images, created_by`;

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
            packaging_type, manufacture_date, variants, images
        } = req.body;

        const [existing] = await pool.execute('SELECT id FROM franchise_products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Franchise product not found' });
        }

        const updatedBy = req.user?.user_id || req.user?.id || req.body?.updated_by || req.user?.email || 'Admin';

        const updateQuery = `UPDATE franchise_products SET
                name = ?, description = ?, category = ?, product_type = ?, subcategory = ?,
                mrp = ?, offer = ?, offer_price = ?, product_code = ?, total_stock = ?,
                rating = ?, status = ?, material = ?, nutrition_info = ?, storage_instructions = ?,
                presentation_style = ?, portion_format = ?, service_type = ?, packaging_notes = ?,
                dietary_tag = ?, heat_profile = ?, serving_size = ?, prep_time = ?,
                ingredients = ?, spice_level = ?, shelf_life_days = ?, net_weight = ?,
                package_count = ?, packaging_type = ?, manufacture_date = ?, variants = ?, images = ?,
                updated_by = ?,
                updated_at = NOW()
            WHERE id = ?`;
        const params = [
            name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, serializeJsonField(variants),
            images ? JSON.stringify(images) : null,
            updatedBy,
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
