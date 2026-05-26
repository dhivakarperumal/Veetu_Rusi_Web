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

const generateNextRecipeCode = async () => {
    const [rows] = await pool.execute(
        'SELECT recipe_code FROM recipe_details WHERE recipe_code LIKE "RC%" ORDER BY id DESC LIMIT 1'
    );
    if (rows.length === 0) return 'RC001';

    const lastCode = rows[0].recipe_code || '';
    const numeric = parseInt(lastCode.replace(/^RC/i, ''), 10);
    const nextNumber = Number.isInteger(numeric) ? numeric + 1 : 1;
    return `RC${String(nextNumber).padStart(3, '0')}`;
};

exports.getAllRecipes = async (req, res) => {
    try {
        const { chef_id, chef_user_id, franchise_user_id, franchise_id, category, status } = req.query;
        let query = 'SELECT * FROM recipe_details WHERE 1=1';
        const params = [];

        if (chef_id) {
            query += ' AND chef_id = ?';
            params.push(chef_id);
        }
        if (chef_user_id) {
            query += ' AND chef_user_id = ?';
            params.push(chef_user_id);
        }
        if (franchise_user_id) {
            query += ' AND franchise_user_id = ?';
            params.push(franchise_user_id);
        }
        if (franchise_id) {
            query += ' AND franchise_id = ?';
            params.push(franchise_id);
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

        const [recipes] = await pool.execute(query, params);
        res.json(recipes.map((recipe) => ({
            ...recipe,
            ingredients: parseJsonField(recipe.ingredients),
            instructions: parseJsonField(recipe.instructions)
        })));
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        res.status(500).json({ message: 'Failed to fetch recipe details', error: error.message });
    }
};

exports.getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [recipes] = await pool.execute('SELECT * FROM recipe_details WHERE id = ?', [id]);

        if (recipes.length === 0) {
            return res.status(404).json({ message: 'Recipe details not found' });
        }

        const recipe = recipes[0];
        res.json({
            ...recipe,
            ingredients: parseJsonField(recipe.ingredients),
            instructions: parseJsonField(recipe.instructions)
        });
    } catch (error) {
        console.error('Error fetching recipe detail:', error);
        res.status(500).json({ message: 'Failed to fetch recipe detail', error: error.message });
    }
};

exports.createRecipe = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            status,
            recipe_code,
            ingredients,
            instructions,
            chef_id,
            chef_user_id,
            chef_name,
            chef_phone,
            chef_email,
            franchise_id,
            franchise_user_id,
            franchise_name,
            franchise_email,
            franchise_phone,
            created_by_user_id,
            created_by_email,
            created_by_name,
            created_by_phone
        } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Recipe title is required' });
        }

        const finalRecipeCode = recipe_code || await generateNextRecipeCode();
        let homeChef = null;

        const candidateChefId = chef_id || chef_user_id || req.user?.user_id || req.user?.id || null;
        const candidateEmail = req.user?.email || null;
        const candidatePhone = req.user?.phone || null;

        if (candidateChefId || candidateEmail || candidatePhone) {
            const [homeChefs] = await pool.execute(
                `SELECT hc.*, u.id AS chef_user_id, hc.created_by_id AS franchise_user_id, hc.created_by_user_id AS franchise_created_by_user_id
                FROM home_chefs hc
                LEFT JOIN users u ON (u.email = hc.email OR u.phone = hc.mobile)
                WHERE hc.chef_id = ?
                   OR hc.email = ?
                   OR hc.mobile = ?
                   OR u.user_id = ?
                   OR u.id = ?
                LIMIT 1`,
                [candidateChefId, candidateEmail, candidatePhone, candidateChefId, candidateChefId]
            );

            if (homeChefs.length > 0) {
                homeChef = homeChefs[0];
            }
        }

        const finalChefUserId = chef_user_id || homeChef?.chef_user_id || req.user?.id || null;
        const finalChefName = chef_name || homeChef?.name || null;
        const finalChefPhone = chef_phone || homeChef?.mobile || null;
        const finalChefEmail = chef_email || homeChef?.email || null;
        const finalFranchiseId =
            franchise_id || homeChef?.created_by_id || null;
        
        
        const finalFranchiseUserId = franchise_user_id || homeChef?.created_by_user_id || null;

        // Fetch franchise admin details from users table if franchise_user_id exists
        let franchiseAdminDetails = null;
        if (finalFranchiseUserId) {
            const [franchiseUsers] = await pool.execute(
                'SELECT id, user_id, name, phone, email FROM users WHERE id = ? OR user_id = ? LIMIT 1',
                [finalFranchiseUserId, finalFranchiseUserId]
            );
            if (franchiseUsers.length > 0) {
                franchiseAdminDetails = franchiseUsers[0];
            }
        }

        const finalFranchiseName = franchise_name || franchiseAdminDetails?.name || homeChef?.created_by_name || null;
        const finalFranchiseEmail = franchise_email || franchiseAdminDetails?.email || homeChef?.created_by_email || null;
        const finalFranchisePhone = franchise_phone || franchiseAdminDetails?.phone || homeChef?.created_by_phone || null;

        const finalCreatedByUserId = created_by_user_id || req.user?.user_id || req.user?.id || null;
        const finalCreatedByEmail = created_by_email || req.user?.email || null;
        const finalCreatedByName = created_by_name || req.user?.name || null;
        const finalCreatedByPhone = created_by_phone || req.user?.phone || null;

        const params = [
            title, description || null, category || null, status || 'Active', finalRecipeCode,
            ingredients ? serializeJsonField(ingredients) : null,
            instructions ? serializeJsonField(instructions) : null,
            chef_id || null, finalChefUserId, finalChefName, finalChefPhone, finalChefEmail,
            finalFranchiseId, finalFranchiseUserId, finalFranchiseName, finalFranchiseEmail, finalFranchisePhone,
            finalCreatedByUserId, finalCreatedByEmail, finalCreatedByName, finalCreatedByPhone
        ];

        const columns = `title, description, category, status, recipe_code, ingredients, instructions,
            chef_id, chef_user_id, chef_name, chef_phone, chef_email,
            franchise_id, franchise_user_id, franchise_name, franchise_email, franchise_phone,
            created_by_user_id, created_by_email, created_by_name, created_by_phone`;
        const placeholders = params.map(() => '?').join(', ');
        const insertParams = params.map(v => v === undefined ? null : v);

        const [result] = await pool.execute(
            `INSERT INTO recipe_details (${columns}) VALUES (${placeholders})`,
            insertParams
        );

        res.status(201).json({ message: 'Recipe detail created successfully', id: result.insertId, recipe_code: finalRecipeCode });
    } catch (error) {
        console.error('Error creating recipe detail:', error);
        res.status(500).json({ message: 'Failed to create recipe detail', error: error.message });
    }
};

exports.updateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, category, status, recipe_code, ingredients, instructions,
            chef_id, chef_user_id, chef_name, chef_phone, chef_email,
            franchise_id, franchise_user_id, franchise_name, franchise_email, franchise_phone,
            created_by_user_id, created_by_email, created_by_name, created_by_phone
        } = req.body;

        const [existing] = await pool.execute('SELECT * FROM recipe_details WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Recipe detail not found' });
        }

        const existingRecipe = existing[0];

        // Determine final franchise_user_id
        const finalFranchiseUserId = franchise_user_id ?? existingRecipe.franchise_user_id;

        // Fetch franchise admin details from users table if franchise_user_id exists
        let franchiseAdminDetails = null;
        if (finalFranchiseUserId) {
            const [franchiseUsers] = await pool.execute(
                'SELECT id, user_id, name, phone, email FROM users WHERE id = ? OR user_id = ? LIMIT 1',
                [finalFranchiseUserId, finalFranchiseUserId]
            );
            if (franchiseUsers.length > 0) {
                franchiseAdminDetails = franchiseUsers[0];
            }
        }

        const updatedRecipe = {
            title: title ?? existingRecipe.title,
            description: description ?? existingRecipe.description,
            category: category ?? existingRecipe.category,
            status: status ?? existingRecipe.status,
            recipe_code: recipe_code ?? existingRecipe.recipe_code,
            ingredients: ingredients !== undefined ? serializeJsonField(ingredients) : existingRecipe.ingredients,
            instructions: instructions !== undefined ? serializeJsonField(instructions) : existingRecipe.instructions,
            chef_id: chef_id ?? existingRecipe.chef_id,
            chef_user_id: chef_user_id ?? existingRecipe.chef_user_id,
            chef_name: chef_name ?? existingRecipe.chef_name,
            chef_phone: chef_phone ?? existingRecipe.chef_phone,
            chef_email: chef_email ?? existingRecipe.chef_email,
            franchise_id: franchise_id ?? existingRecipe.franchise_id,
            franchise_user_id: finalFranchiseUserId,
            franchise_name: franchise_name || franchiseAdminDetails?.name || existingRecipe.franchise_name,
            franchise_email: franchise_email || franchiseAdminDetails?.email || existingRecipe.franchise_email,
            franchise_phone: franchise_phone || franchiseAdminDetails?.phone || existingRecipe.franchise_phone,
            created_by_user_id: created_by_user_id ?? existingRecipe.created_by_user_id,
            created_by_email: created_by_email ?? existingRecipe.created_by_email,
            created_by_name: created_by_name ?? existingRecipe.created_by_name,
            created_by_phone: created_by_phone ?? existingRecipe.created_by_phone
        };

        const updateQuery = `UPDATE recipe_details SET
                title = ?, description = ?, category = ?, status = ?, recipe_code = ?,
                ingredients = ?, instructions = ?,
                chef_id = ?, chef_user_id = ?, chef_name = ?, chef_phone = ?, chef_email = ?,
                franchise_id = ?, franchise_user_id = ?, franchise_name = ?, franchise_email = ?, franchise_phone = ?,
                created_by_user_id = ?, created_by_email = ?, created_by_name = ?, created_by_phone = ?,
                updated_at = NOW()
            WHERE id = ?`;
        const params = [
            updatedRecipe.title, updatedRecipe.description, updatedRecipe.category, updatedRecipe.status, updatedRecipe.recipe_code,
            updatedRecipe.ingredients, updatedRecipe.instructions,
            updatedRecipe.chef_id, updatedRecipe.chef_user_id, updatedRecipe.chef_name, updatedRecipe.chef_phone, updatedRecipe.chef_email,
            updatedRecipe.franchise_id, updatedRecipe.franchise_user_id, updatedRecipe.franchise_name, updatedRecipe.franchise_email, updatedRecipe.franchise_phone,
            updatedRecipe.created_by_user_id, updatedRecipe.created_by_email, updatedRecipe.created_by_name, updatedRecipe.created_by_phone,
            id
        ];

        await pool.execute(updateQuery, params);
        res.json({ message: 'Recipe detail updated successfully' });
    } catch (error) {
        console.error('Error updating recipe detail:', error);
        res.status(500).json({ message: 'Failed to update recipe detail', error: error.message });
    }
};

exports.deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await pool.execute('SELECT id FROM recipe_details WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Recipe detail not found' });
        }

        await pool.execute('DELETE FROM recipe_details WHERE id = ?', [id]);
        res.json({ message: 'Recipe detail deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe detail:', error);
        res.status(500).json({ message: 'Failed to delete recipe detail', error: error.message });
    }
};
