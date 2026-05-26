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

const generateNextProductCode = async (table = 'franchise_products') => {
    // choose prefix based on target table
    const prefix = table === 'franchise_products' ? 'SP' : 'PR';
    const likePattern = `${prefix}%`;
    const [rows] = await pool.execute(
        `SELECT product_code FROM ${table} WHERE product_code LIKE ? ORDER BY id DESC LIMIT 1`,
        [likePattern]
    );
    if (rows.length === 0) return `${prefix}001`;

    const lastCode = rows[0].product_code || '';
    const numeric = parseInt(lastCode.replace(new RegExp(`^${prefix}`, 'i'), ''), 10);
    const nextNumber = Number.isInteger(numeric) ? numeric + 1 : 1;
    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

// Get all products (with filters).
// If `chef_user_id` or `chef_id` is present we query `products` (chef-owned listings),
// otherwise we default to `franchise_products` for admin/franchise listings.
exports.getAllProducts = async (req, res) => {
    try {
        const { category, status, franchise_id, franchise_user_id, chef_user_id, chef_id } = req.query;
        const params = [];
        let table = 'franchise_products';
        let query = '';

        if (chef_user_id || chef_id) {
            table = 'products';
            query = 'SELECT * FROM products WHERE 1=1';
            if (chef_id) {
                query += ' AND chef_id = ?'; params.push(chef_id);
            }
            if (chef_user_id) {
                query += ' AND chef_user_id = ?'; params.push(chef_user_id);
            }
        } else {
            table = 'franchise_products';
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

// Get product by ID — try `products` table first (chef-owned), then fallback to `franchise_products`.
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [prodRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
        let product = null;
        if (prodRows.length > 0) product = prodRows[0];
        else {
            const [fpRows] = await pool.execute('SELECT * FROM franchise_products WHERE id = ?', [id]);
            if (fpRows.length > 0) product = fpRows[0];
        }

        if (!product) return res.status(404).json({ message: 'Product not found' });

        res.json({
            ...product,
            variants: parseJsonField(product.variants) || [],
            images: parseJsonField(product.images) || []
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
            images,
            created_by_user_id,
            franchise_user_id,
            created_by_email,
            created_by_name,
            created_by_phone,
            franchise_id
        } = req.body;

        // Validation
        if (!name || !category || !mrp) {
            return res.status(400).json({
                message: 'Required fields: name, category, mrp'
            });
        }

        // Determine target table: chefs' requests create into `products`, otherwise franchise/admin use `franchise_products`.
        const targetTable = (req.user && req.user.role === 'chef') ? 'products' : 'franchise_products';

        // Determine product code
        const finalProductCode = product_code || await generateNextProductCode(targetTable);

        // Set franchise info from authenticated user
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
        // Sanitize undefined -> null for insert params as well
        const insertParams = params.map(v => v === undefined ? null : v);

        // Insert into appropriate table
        const insertSql = `INSERT INTO ${targetTable} (${columns}) VALUES (${placeholders})`;
        const [result] = await pool.execute(insertSql, insertParams);

        res.status(201).json({
            message: 'Franchise product created successfully',
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
            packaging_type, manufacture_date, variants, images,
            franchise_user_id,
            created_by_user_id, created_by_email, created_by_name, created_by_phone, franchise_id
        } = req.body;

        // Determine which table contains this product (products preferred for chef-owned)
        const [existsInProducts] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
        const [existsInFranchise] = await pool.execute('SELECT id FROM franchise_products WHERE id = ?', [id]);
        if (existsInProducts.length === 0 && existsInFranchise.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const targetTable = existsInProducts.length > 0 ? 'products' : 'franchise_products';

        // Update product
        const updateQuery = `UPDATE ${targetTable} SET
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

        // Sanitize undefined -> null to satisfy mysql2 parameter binding
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
        // Check both tables and delete from whichever contains the product
        const [inProducts] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
        const [inFranchise] = await pool.execute('SELECT id FROM franchise_products WHERE id = ?', [id]);
        if (inProducts.length === 0 && inFranchise.length === 0) return res.status(404).json({ message: 'Product not found' });

        if (inProducts.length > 0) await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        else await pool.execute('DELETE FROM franchise_products WHERE id = ?', [id]);
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
            'SELECT product_code FROM franchise_products WHERE product_code LIKE "SP%" ORDER BY id DESC LIMIT 1'
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

// Get categories from database
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, catId, name, description, subcategory, images FROM categories ORDER BY id DESC'
        );

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

// Create a new category in database
exports.createCategory = async (req, res) => {
    try {
        const { catId, name, description, subcategory = [], images } = req.body;
        const categoryName = name || req.body.cname;
        const categoryDescription = description || req.body.cdescription || '';
        const categoryImages = images || req.body.cimgs || [];

        if (!catId || !categoryName) return res.status(400).json({ message: 'catId and name are required' });

        await pool.execute(
            'INSERT INTO categories (catId, name, description, subcategory, images) VALUES (?, ?, ?, ?, ?)',
            [catId, categoryName, categoryDescription, JSON.stringify(subcategory), JSON.stringify(categoryImages)]
        );

        res.status(201).json({ message: 'Category created successfully' });
    } catch (err) {
        console.error('Failed to create category:', err);
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

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        params.push(catId, catId);
        const [result] = await pool.execute(
            `UPDATE categories SET ${fields.join(', ')} WHERE catId = ? OR id = ?`,
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
            'DELETE FROM categories WHERE catId = ? OR id = ?',
            [catId, catId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Failed to delete category:', err);
        res.status(500).json({ message: 'Failed to delete category', error: err.message });
    }
};
