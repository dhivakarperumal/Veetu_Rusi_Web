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
        'SELECT product_code FROM products WHERE product_code LIKE "SP%" ORDER BY id DESC LIMIT 1'
    );
    if (products.length === 0) return 'SP001';

    const lastCode = products[0].product_code || '';
    const numeric = parseInt(lastCode.replace(/^SP/i, ''), 10);
    const nextNumber = Number.isInteger(numeric) ? numeric + 1 : 1;
    return `SP${String(nextNumber).padStart(3, '0')}`;
};

// Get all products (with filters)
exports.getAllProducts = async (req, res) => {
    try {
        const { chef_id, category, status } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (chef_id) {
            query += ' AND chef_id = ?';
            params.push(chef_id);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [products] = await pool.execute(query, params);
        const normalizedProducts = products.map((product) => ({
            ...product,
            variants: parseJsonField(product.variants)
        }));

        res.json(normalizedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = products[0];
        res.json({
            ...product,
            variants: parseJsonField(product.variants)
        });
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
            chef_id,
            chef_name,
            chef_phone,
            chef_email,
            created_by_user_id,
            created_by_email,
            created_by_name,
            created_by_phone,
            franchise_id
        } = req.body;

        // Validation
        if (!name || !category || !mrp || !chef_id) {
            return res.status(400).json({
                message: 'Required fields: name, category, mrp, chef_id'
            });
        }

        // Determine product code and insert product
        const finalProductCode = product_code || await generateNextProductCode();

        const params = [
            name, description, category, product_type || 'Cooked Food', subcategory || null,
            mrp, offer || 0, offer_price || mrp, finalProductCode, total_stock || 0,
            rating || 5, status || 'Active', material || null, nutrition_info || null,
            storage_instructions || 'Keep Refrigerated', presentation_style || null,
            portion_format || null, service_type || null, packaging_notes || null,
            dietary_tag || null, heat_profile || null, serving_size || null,
            prep_time || null, ingredients || null, spice_level || 'Medium',
            shelf_life_days || null, net_weight || null, package_count || null,
            packaging_type || 'Pouch', manufacture_date || null,
            variants ? JSON.stringify(variants) : null, chef_id, chef_name || null,
            chef_phone || null, chef_email || null, created_by_user_id || null,
            created_by_email || null, created_by_name || null, created_by_phone || null,
            franchise_id || null
        ];

        const columns = `name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, variants, chef_id, chef_name, chef_phone, chef_email,
            created_by_user_id, created_by_email, created_by_name, created_by_phone, franchise_id`;

        const placeholders = params.map(() => '?').join(', ');

        const [result] = await pool.execute(
            `INSERT INTO products (${columns}) VALUES (${placeholders})`,
            params
        );

        res.status(201).json({
            message: 'Product created successfully',
            id: result.insertId,
            product_code: finalProductCode
        });
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
            packaging_type, manufacture_date, variants
        } = req.body;

        // Check if product exists
        const [existing] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update product
        await pool.execute(
            `UPDATE products SET
                name = ?, description = ?, category = ?, product_type = ?, subcategory = ?,
                mrp = ?, offer = ?, offer_price = ?, product_code = ?, total_stock = ?,
                rating = ?, status = ?, material = ?, nutrition_info = ?, storage_instructions = ?,
                presentation_style = ?, portion_format = ?, service_type = ?, packaging_notes = ?,
                dietary_tag = ?, heat_profile = ?, serving_size = ?, prep_time = ?,
                ingredients = ?, spice_level = ?, shelf_life_days = ?, net_weight = ?,
                package_count = ?, packaging_type = ?, manufacture_date = ?, variants = ?,
                updated_at = NOW()
            WHERE id = ?`,
            [
                name, description, category, product_type, subcategory, mrp, offer, offer_price,
                product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
                presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
                serving_size, prep_time, ingredients, spice_level, shelf_life_days, net_weight, package_count,
                packaging_type, manufacture_date, serializeJsonField(variants), id
            ]
        );

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

        // Check if product exists
        const [existing] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await pool.execute('DELETE FROM products WHERE id = ?', [id]);
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
            'SELECT product_code FROM products WHERE product_code LIKE "SP%" ORDER BY id DESC LIMIT 1'
        );

        let nextCode = 'SP001';
        if (products.length > 0) {
            const lastCode = products[0].product_code;
            const num = parseInt(lastCode.replace('SP', '')) + 1;
            nextCode = `SP${String(num).padStart(3, '0')}`;
        }

        res.json({ latestCode: nextCode });
    } catch (error) {
        console.error('Error getting product code:', error);
        res.status(500).json({ message: 'Failed to get product code', error: error.message });
    }
};

// Get categories (can be enhanced based on database structure)
exports.getCategories = async (req, res) => {
    try {
        const categories = [
            { id: 1, name: 'Cooked Food', subcategory: ['Biryani', 'Curry', 'Bread', 'Rice'] },
            { id: 2, name: 'Masala / Pre-cooked', subcategory: ['Spice Mix', 'Pasta Mix', 'Sauce'] },
            { id: 3, name: 'Snacks', subcategory: ['Samosa', 'Pakora', 'Chips'] },
            { id: 4, name: 'Beverages', subcategory: ['Juice', 'Coffee', 'Tea'] }
        ];
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
    }
};
