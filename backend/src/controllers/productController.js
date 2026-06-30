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

const normalizeDateField = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().slice(0, 10);
        }
        // Preserve already normalized date strings if valid
        const strictMatch = /^\d{4}-\d{2}-\d{2}$/;
        return strictMatch.test(value) ? value : null;
    }
    return null;
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
        "SELECT product_code FROM chef_products WHERE product_code LIKE 'P%' AND product_code REGEXP '^P[0-9]+$' ORDER BY CAST(SUBSTRING(product_code, 2) AS UNSIGNED) DESC LIMIT 1"
    );
    if (products.length === 0) return 'P001';

    const lastCode = products[0].product_code || '';
    const numeric = parseInt(lastCode.replace(/^P/i, ''), 10);
    const nextNumber = Number.isInteger(numeric) ? numeric + 1 : 1;
    return `P${String(nextNumber).padStart(3, '0')}`;
};

const resolveProductMetadata = async (req, body) => {
    const { franchise_user_id } = body;
    return {
        finalFranchiseUserId: franchise_user_id || null
    };
};

// Get all products (with filters). If `chef_user_id` or `chef_id` is present, return chef-owned `chef_products`.
// Otherwise fall back to franchise/admin `franchise_products` if desired by callers.
exports.getAllProducts = async (req, res) => {
    try {
        const { category, status, franchise_id, franchise_user_id, chef_user_id, chef_id, source } = req.query;
        const params = [];
        let query = '';
        let table = '';

        // If caller requests chef-scoped results, query `chef_products` table
        if (source === 'chef_products' || chef_user_id || chef_id) {
            table = 'chef_products';
            query = `
                SELECT 
                    t.*, 
                    u.full_name AS chef_name, 
                    hc.delivery_radius, 
                    hc.latitude, 
                    hc.longitude, 
                    hc.area_name, 
                    hc.city, 
                    hc.district, 
                    hc.state, 
                    hc.pincode 
                FROM chef_products t 
                LEFT JOIN users u ON t.created_by = u.user_id 
                LEFT JOIN home_chefs hc ON t.created_by = hc.user_id 
                WHERE 1=1
            `;
            const chefLookup = chef_user_id || chef_id;
            if (chefLookup) {
                query += ' AND t.created_by = ?';
                params.push(chefLookup);
            }
            if (franchise_user_id) {
                query += ' AND t.franchise_user_id = ?';
                params.push(franchise_user_id);
            }
        } else {
            // Default to franchise_products for admin/franchise listings
            table = 'franchise_products';
            query = 'SELECT t.* FROM franchise_products t WHERE 1=1';
            if (franchise_id) {
                query += ' AND t.franchise_id = ?';
                params.push(franchise_id);
            }
            if (franchise_user_id) {
                query += ' AND t.franchise_user_id = ?';
                params.push(franchise_user_id);
            }
        }

        if (category) {
            query += ' AND t.category = ?';
            params.push(category);
        }
        if (status && status !== 'All') {
            const normalizedStatus = String(status || '').trim().toLowerCase();
            if (normalizedStatus === 'active' || normalizedStatus === 'approved') {
                query += " AND (t.status = 'Active' OR t.status = 'Approved')";
            } else if (normalizedStatus === 'not approved') {
                query += " AND (t.status <> 'Active' AND t.status <> 'Approved')";
            } else {
                query += ' AND t.status = ?';
                params.push(status);
            }
        }

        query += ' ORDER BY t.created_at DESC';

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

        // Fallback: try franchise_products table
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

// Get all products created by a specific user (chef/homechef)
exports.getProductsByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { category, status } = req.query;
        
        if (!user_id) {
            return res.status(400).json({ message: 'user_id parameter is required' });
        }

        const params = [user_id];
        let query = `
            SELECT cp.*, u.full_name as created_by_name, u.email as created_by_email
            FROM chef_products cp
            LEFT JOIN users u ON cp.created_by = u.user_id
            WHERE cp.created_by = ?
        `;

        if (category) {
            query += ' AND cp.category = ?';
            params.push(category);
        }

        if (status && status !== 'All') {
            query += ' AND cp.status = ?';
            params.push(status);
        }

        query += ' ORDER BY cp.created_at DESC';

        const [products] = await pool.execute(query, params);

        if (products.length === 0) {
            return res.json({
                message: 'No products found for this user',
                data: []
            });
        }

        const normalizedProducts = products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            product_type: product.product_type,
            subcategory: product.subcategory,
            mrp: parseFloat(product.mrp),
            offer: parseFloat(product.offer),
            offer_price: parseFloat(product.offer_price),
            product_code: product.product_code,
            total_stock: product.total_stock,
            rating: product.rating,
            status: product.status,
            material: product.material,
            nutrition_info: product.nutrition_info,
            storage_instructions: product.storage_instructions,
            presentation_style: product.presentation_style,
            portion_format: product.portion_format,
            service_type: product.service_type,
            packaging_notes: product.packaging_notes,
            dietary_tag: product.dietary_tag,
            heat_profile: product.heat_profile,
            serving_size: product.serving_size,
            prep_time: product.prep_time,
            ingredients: product.ingredients,
            spice_level: product.spice_level,
            shelf_life_days: product.shelf_life_days,
            net_weight: product.net_weight,
            package_count: product.package_count,
            packaging_type: product.packaging_type,
            manufacture_date: product.manufacture_date,
            expiry_date: product.expiry_date,
            instructions: product.instructions,
            variants: parseJsonField(product.variants) || [],
            images: parseJsonField(product.images) || [],
            franchise_user_id: product.franchise_user_id,
            created_by: product.created_by,
            created_by_name: product.created_by_name,
            created_by_email: product.created_by_email,
            created_at: product.created_at,
            updated_by: product.updated_by,
            updated_at: product.updated_at
        }));

        res.json({
            message: `Successfully retrieved ${normalizedProducts.length} product(s) for user ${user_id}`,
            count: normalizedProducts.length,
            data: normalizedProducts
        });
    } catch (error) {
        console.error('Error fetching products by user ID:', error);
        res.status(500).json({ message: 'Failed to fetch products by user ID', error: error.message });
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
            packaging_image,
            dietary_tag,
            heat_profile,
            serving_size,
            prep_time,
            ingredients,
            instructions,
            spice_level,
            shelf_life_days,
            net_weight,
            package_count,
            packaging_type,
            manufacture_date,
            expiry_date,
            variants,
            images,
            franchise_user_id
        } = req.body;

        const normalizedVariants = Array.isArray(variants)
            ? variants.map((variant) => ({
                weight: variant.weight || null,
                price: variant.price ? Number(variant.price) : 0,
                offer: variant.offer ? Number(variant.offer) : 0,
                final_price: variant.final_price ? Number(variant.final_price) : 0,
                stock: variant.stock ? Number(variant.stock) : 0,
                images: Array.isArray(variant.images) ? variant.images : (variant.images ? JSON.parse(variant.images) : [])
            }))
            : [];

        const computedMrp = mrp !== undefined && mrp !== null && String(mrp).trim() !== ''
            ? Number(mrp)
            : (normalizedVariants.length > 0 ? Math.max(...normalizedVariants.map((v) => Number(v.price) || 0)) : null);
        const parsedOffer = offer !== undefined && offer !== null && String(offer).trim() !== '' ? Number(offer) : 0;
        const parsedOfferPrice = offer_price !== undefined && offer_price !== null && String(offer_price).trim() !== '' ? Number(offer_price) : null;
        const computedOfferPrice = parsedOfferPrice !== null && parsedOfferPrice > 0
            ? parsedOfferPrice
            : (normalizedVariants.length > 0 ? Math.min(...normalizedVariants.map((v) => Number(v.final_price) || Number(v.price) || 0)) : null);
        const finalOffer = parsedOffer;

        if (!name || !category || !computedMrp || computedMrp <= 0) {
            return res.status(400).json({
                message: 'Required fields: name, category, mrp'
            });
        }

        // Determine product code
        const finalProductCode = product_code || await generateNextProductCode();

        const { finalFranchiseUserId } = await resolveProductMetadata(req, req.body);
        const createdBy = req.user?.user_id || req.user?.id || req.user?.email || req.user?.name || req.body.created_by || 'Admin';

        const params = [
            name, description || null, category, product_type || 'Cooked Food', subcategory || null,
            computedMrp, finalOffer, (computedOfferPrice !== null && computedOfferPrice > 0 ? computedOfferPrice : (computedMrp > 0 && finalOffer > 0 ? Number((computedMrp - (computedMrp * finalOffer / 100)).toFixed(2)) : computedMrp)), finalProductCode, total_stock || 0,
            rating || 5, status || 'Active', material || null, nutrition_info || null,
            storage_instructions || 'Keep Refrigerated', presentation_style || null,
            portion_format || null, service_type || null, packaging_notes || null,
            dietary_tag || null, heat_profile || null, serving_size || null,
            prep_time || null, ingredients || null, instructions || null, spice_level || 'Medium',
            shelf_life_days || null, net_weight || null, package_count || null,
            packaging_type || 'Pouch', packaging_image || null, normalizeDateField(manufacture_date), normalizeDateField(expiry_date),
            normalizedVariants.length > 0 ? JSON.stringify(normalizedVariants) : null,
            images ? JSON.stringify(images) : null,
            finalFranchiseUserId, createdBy
        ];

        const columns = `name, description, category, product_type, subcategory, mrp, offer, offer_price,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, packaging_image, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, instructions, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, manufacture_date, expiry_date, variants, images,
            franchise_user_id, created_by`;

        const placeholders = params.map(() => '?').join(', ');
        // Sanitize undefined -> null for insert params as well
        const insertParams = params.map(v => v === undefined ? null : v);

        // Insert into base products table
        const [result] = await pool.execute(
            `INSERT INTO chef_products (${columns}) VALUES (${placeholders})`,
            insertParams
        );

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

        // Check if product exists
        const [existingRows] = await pool.execute('SELECT * FROM chef_products WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const existing = existingRows[0];

        const name = req.body.name !== undefined ? req.body.name : existing.name;
        const description = req.body.description !== undefined ? req.body.description : existing.description;
        const category = req.body.category !== undefined ? req.body.category : existing.category;
        const product_type = req.body.product_type !== undefined ? req.body.product_type : existing.product_type;
        const subcategory = req.body.subcategory !== undefined ? req.body.subcategory : existing.subcategory;
        const mrp = req.body.mrp !== undefined ? req.body.mrp : existing.mrp;
        const offer = req.body.offer !== undefined ? req.body.offer : existing.offer;
        const offer_price = req.body.offer_price !== undefined ? req.body.offer_price : existing.offer_price;
        const product_code = req.body.product_code !== undefined ? req.body.product_code : existing.product_code;
        const total_stock = req.body.total_stock !== undefined ? req.body.total_stock : existing.total_stock;
        const rating = req.body.rating !== undefined ? req.body.rating : existing.rating;
        const status = req.body.status !== undefined ? req.body.status : existing.status;
        const material = req.body.material !== undefined ? req.body.material : existing.material;
        const nutrition_info = req.body.nutrition_info !== undefined ? req.body.nutrition_info : existing.nutrition_info;
        const storage_instructions = req.body.storage_instructions !== undefined ? req.body.storage_instructions : existing.storage_instructions;
        const presentation_style = req.body.presentation_style !== undefined ? req.body.presentation_style : existing.presentation_style;
        const portion_format = req.body.portion_format !== undefined ? req.body.portion_format : existing.portion_format;
        const service_type = req.body.service_type !== undefined ? req.body.service_type : existing.service_type;
        const packaging_notes = req.body.packaging_notes !== undefined ? req.body.packaging_notes : existing.packaging_notes;
        const packaging_image = req.body.packaging_image !== undefined ? req.body.packaging_image : existing.packaging_image;
        const dietary_tag = req.body.dietary_tag !== undefined ? req.body.dietary_tag : existing.dietary_tag;
        const heat_profile = req.body.heat_profile !== undefined ? req.body.heat_profile : existing.heat_profile;
        const serving_size = req.body.serving_size !== undefined ? req.body.serving_size : existing.serving_size;
        const prep_time = req.body.prep_time !== undefined ? req.body.prep_time : existing.prep_time;
        const ingredients = req.body.ingredients !== undefined ? req.body.ingredients : existing.ingredients;
        const instructions = req.body.instructions !== undefined ? req.body.instructions : existing.instructions;
        const spice_level = req.body.spice_level !== undefined ? req.body.spice_level : existing.spice_level;
        const shelf_life_days = req.body.shelf_life_days !== undefined ? req.body.shelf_life_days : existing.shelf_life_days;
        const net_weight = req.body.net_weight !== undefined ? req.body.net_weight : existing.net_weight;
        const package_count = req.body.package_count !== undefined ? req.body.package_count : existing.package_count;
        const packaging_type = req.body.packaging_type !== undefined ? req.body.packaging_type : existing.packaging_type;
        const manufacture_date = req.body.manufacture_date !== undefined ? req.body.manufacture_date : existing.manufacture_date;
        const expiry_date = req.body.expiry_date !== undefined ? req.body.expiry_date : existing.expiry_date;
        const variants = req.body.variants !== undefined ? req.body.variants : parseJsonField(existing.variants);
        const images = req.body.images !== undefined ? req.body.images : parseJsonField(existing.images);
        const franchise_user_id = req.body.franchise_user_id !== undefined ? req.body.franchise_user_id : existing.franchise_user_id;

        const normalizedVariants = Array.isArray(variants)
            ? variants.map((variant) => ({
                weight: variant.weight || null,
                price: variant.price ? Number(variant.price) : 0,
                offer: variant.offer ? Number(variant.offer) : 0,
                final_price: variant.final_price ? Number(variant.final_price) : 0,
                stock: variant.stock ? Number(variant.stock) : 0,
                images: Array.isArray(variant.images) ? variant.images : (variant.images ? (typeof variant.images === 'string' ? JSON.parse(variant.images) : variant.images) : [])
            }))
            : [];

        const computedMrp = mrp !== undefined && mrp !== null
            ? Number(mrp)
            : (normalizedVariants.length > 0 ? Math.max(...normalizedVariants.map((v) => Number(v.price) || 0)) : null);
        const computedOfferPrice = offer_price !== undefined && offer_price !== null
            ? Number(offer_price)
            : (normalizedVariants.length > 0 ? Math.min(...normalizedVariants.map((v) => Number(v.final_price) || Number(v.price) || 0)) : null);
        const finalOffer = offer !== undefined && offer !== null ? Number(offer) : 0;

        const { finalFranchiseUserId } = await resolveProductMetadata(req, req.body);
        const finalFranchiseUserIdResolved = finalFranchiseUserId || null;
        const updatedBy = req.user?.user_id || req.user?.id || req.user?.email || req.user?.name || req.body.updated_by || 'Admin';

        // Update product
        const updateQuery = `UPDATE chef_products SET
                name = ?, description = ?, category = ?, product_type = ?, subcategory = ?,
                mrp = ?, offer = ?, offer_price = ?, product_code = ?, total_stock = ?,
                rating = ?, status = ?, material = ?, nutrition_info = ?, storage_instructions = ?,
                presentation_style = ?, portion_format = ?, service_type = ?, packaging_notes = ?,
                dietary_tag = ?, heat_profile = ?, serving_size = ?, prep_time = ?,
                ingredients = ?, instructions = ?, spice_level = ?, shelf_life_days = ?, net_weight = ?,
                package_count = ?, packaging_type = ?, packaging_image = ?, manufacture_date = ?, expiry_date = ?, variants = ?, images = ?,
                franchise_user_id = ?, updated_by = ?, updated_at = NOW()
            WHERE id = ?`;
        const params = [
            name, description, category, product_type, subcategory, computedMrp, finalOffer, computedOfferPrice || computedMrp,
            product_code, total_stock, rating, status, material, nutrition_info, storage_instructions,
            presentation_style, portion_format, service_type, packaging_notes, dietary_tag, heat_profile,
            serving_size, prep_time, ingredients, instructions || null, spice_level, shelf_life_days, net_weight, package_count,
            packaging_type, packaging_image || null, normalizeDateField(manufacture_date), normalizeDateField(expiry_date), serializeJsonField(normalizedVariants),
            images ? JSON.stringify(images) : null,
            finalFranchiseUserIdResolved, updatedBy,
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

        // Check if product exists
        const [existing] = await pool.execute('SELECT id FROM chef_products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

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
            const lastCode = products[0].product_code;
            const num = parseInt(lastCode.replace('P', ''), 10) + 1;
            nextCode = `P${String(num).padStart(3, '0')}`;
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

        // Ignore client-supplied catId for creates; generate franchise-scoped IDs server-side.
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

        if (!result) {
            return res.status(409).json({ message: 'Unable to generate a unique Category ID. Please try again.' });
        }

        res.status(201).json({ message: 'Category created successfully', id: result.insertId, catId: finalCatId });
    } catch (err) {
        console.error('Failed to create category:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Category ID already exists for this franchise user. Please try again.' });
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
