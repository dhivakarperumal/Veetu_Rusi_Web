const pool = require('../config/db');

const parseJsonSafe = (val) => {
    try {
        return typeof val === 'string' ? JSON.parse(val) : val;
    } catch {
        return null;
    }
};

const couponController = {
    // Admin: Create Coupon
    createCoupon: async (req, res) => {
        try {
            const {
                code, name, description, discount_type, discount_value,
                max_discount_amount, min_order_value, start_date, expiry_date,
                usage_limit_global, usage_limit_per_customer, applicable_for_all,
                specific_home_chefs, specific_categories, specific_products,
                first_order_only, new_customers_only, excluded_products,
                excluded_categories, excluded_home_chefs, status
            } = req.body;

            if (!code || !name || !discount_type || !discount_value || !start_date || !expiry_date) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const sql = `
                INSERT INTO coupons (
                    code, name, description, discount_type, discount_value,
                    max_discount_amount, min_order_value, start_date, expiry_date,
                    usage_limit_global, usage_limit_per_customer, applicable_for_all,
                    specific_home_chefs, specific_categories, specific_products,
                    first_order_only, new_customers_only, excluded_products,
                    excluded_categories, excluded_home_chefs, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                code, name, description || null, discount_type, discount_value,
                max_discount_amount || null, min_order_value || 0, start_date, expiry_date,
                usage_limit_global || null, usage_limit_per_customer || 1, applicable_for_all === undefined ? 1 : applicable_for_all,
                specific_home_chefs ? JSON.stringify(specific_home_chefs) : null,
                specific_categories ? JSON.stringify(specific_categories) : null,
                specific_products ? JSON.stringify(specific_products) : null,
                first_order_only ? 1 : 0, new_customers_only ? 1 : 0,
                excluded_products ? JSON.stringify(excluded_products) : null,
                excluded_categories ? JSON.stringify(excluded_categories) : null,
                excluded_home_chefs ? JSON.stringify(excluded_home_chefs) : null,
                status || 'active'
            ];

            const [result] = await pool.execute(sql, values);
            res.status(201).json({ success: true, message: 'Coupon created successfully', couponId: result.insertId });
        } catch (error) {
            console.error('Error creating coupon:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Coupon code already exists' });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Admin: Get All Coupons
    getAllCoupons: async (req, res) => {
        try {
            const [rows] = await pool.execute('SELECT * FROM coupons ORDER BY created_at DESC');
            const coupons = rows.map(row => ({
                ...row,
                specific_home_chefs: parseJsonSafe(row.specific_home_chefs),
                specific_categories: parseJsonSafe(row.specific_categories),
                specific_products: parseJsonSafe(row.specific_products),
                excluded_products: parseJsonSafe(row.excluded_products),
                excluded_categories: parseJsonSafe(row.excluded_categories),
                excluded_home_chefs: parseJsonSafe(row.excluded_home_chefs)
            }));
            res.json({ success: true, coupons });
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Admin: Update Coupon
    updateCoupon: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                code, name, description, discount_type, discount_value,
                max_discount_amount, min_order_value, start_date, expiry_date,
                usage_limit_global, usage_limit_per_customer, applicable_for_all,
                specific_home_chefs, specific_categories, specific_products,
                first_order_only, new_customers_only, excluded_products,
                excluded_categories, excluded_home_chefs, status
            } = req.body;

            const sql = `
                UPDATE coupons SET
                    code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?,
                    max_discount_amount = ?, min_order_value = ?, start_date = ?, expiry_date = ?,
                    usage_limit_global = ?, usage_limit_per_customer = ?, applicable_for_all = ?,
                    specific_home_chefs = ?, specific_categories = ?, specific_products = ?,
                    first_order_only = ?, new_customers_only = ?, excluded_products = ?,
                    excluded_categories = ?, excluded_home_chefs = ?, status = ?
                WHERE id = ?
            `;

            const values = [
                code, name, description || null, discount_type, discount_value,
                max_discount_amount || null, min_order_value || 0, start_date, expiry_date,
                usage_limit_global || null, usage_limit_per_customer || 1, applicable_for_all === undefined ? 1 : applicable_for_all,
                specific_home_chefs ? JSON.stringify(specific_home_chefs) : null,
                specific_categories ? JSON.stringify(specific_categories) : null,
                specific_products ? JSON.stringify(specific_products) : null,
                first_order_only ? 1 : 0, new_customers_only ? 1 : 0,
                excluded_products ? JSON.stringify(excluded_products) : null,
                excluded_categories ? JSON.stringify(excluded_categories) : null,
                excluded_home_chefs ? JSON.stringify(excluded_home_chefs) : null,
                status || 'active',
                id
            ];

            const [result] = await pool.execute(sql, values);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Coupon not found' });
            }
            res.json({ success: true, message: 'Coupon updated successfully' });
        } catch (error) {
            console.error('Error updating coupon:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Coupon code already exists' });
            }
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Admin: Delete Coupon
    deleteCoupon: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.execute('DELETE FROM coupons WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Coupon not found' });
            }
            res.json({ success: true, message: 'Coupon deleted successfully' });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Customer: Get Available Coupons
    getAvailableCoupons: async (req, res) => {
        try {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const sql = `
                SELECT * FROM coupons 
                WHERE status = 'active' 
                AND start_date <= ? 
                AND expiry_date >= ?
                AND (usage_limit_global IS NULL OR usage_count < usage_limit_global)
            `;
            const [rows] = await pool.execute(sql, [now, now]);
            const coupons = rows.map(row => ({
                ...row,
                specific_home_chefs: parseJsonSafe(row.specific_home_chefs),
                specific_categories: parseJsonSafe(row.specific_categories),
                specific_products: parseJsonSafe(row.specific_products),
                excluded_products: parseJsonSafe(row.excluded_products),
                excluded_categories: parseJsonSafe(row.excluded_categories),
                excluded_home_chefs: parseJsonSafe(row.excluded_home_chefs)
            }));
            res.json({ success: true, coupons });
        } catch (error) {
            console.error('Error fetching available coupons:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Customer: Validate Coupon
    validateCoupon: async (req, res) => {
        try {
            const { code, cartTotal, customerId, cartItems } = req.body;
            
            if (!code) {
                return res.status(400).json({ success: false, message: 'Coupon code is required' });
            }

            const [coupons] = await pool.execute(`
                SELECT *,
                       (start_date <= NOW()) as is_started,
                       (expiry_date >= NOW()) as is_not_expired
                FROM coupons WHERE code = ?
            `, [code]);
            
            if (coupons.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid coupon code' });
            }

            const coupon = coupons[0];

            if (coupon.status !== 'active') {
                return res.status(400).json({ success: false, message: 'Coupon is inactive' });
            }

            if (!coupon.is_started) {
                return res.status(400).json({ success: false, message: 'Coupon is not yet active' });
            }

            if (!coupon.is_not_expired) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }

            if (coupon.usage_limit_global !== null && coupon.usage_count >= coupon.usage_limit_global) {
                return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });
            }

            if (cartTotal < Number(coupon.min_order_value)) {
                return res.status(400).json({ success: false, message: `Minimum order value of ₹${coupon.min_order_value} required` });
            }

            if (customerId) {
                const [usage] = await pool.execute(
                    'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND customer_id = ?',
                    [coupon.id, customerId]
                );
                if (usage[0].count >= coupon.usage_limit_per_customer) {
                    return res.status(400).json({ success: false, message: 'You have reached the maximum usage limit for this coupon' });
                }
                
                if (coupon.first_order_only) {
                    const [orders] = await pool.execute(
                        'SELECT COUNT(*) as count FROM user_food_order_table WHERE user_id = ?',
                        [customerId]
                    );
                    if (orders[0].count > 0) {
                        return res.status(400).json({ success: false, message: 'This coupon is valid for first-time orders only' });
                    }
                }
            }

            // Product/Category/Chef Applicability Logic (Simplified for now, assumes all applicable if applicable_for_all is true)
            // If applicable_for_all is false, we would need to check if ANY cart item matches the specific criteria.
            // For now, we calculate discount on the whole cart if it passes.
            // A more robust implementation would calculate discount ONLY on applicable items.

            let discountAmount = 0;
            if (coupon.discount_type === 'percentage') {
                discountAmount = (cartTotal * Number(coupon.discount_value)) / 100;
                if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
                    discountAmount = Number(coupon.max_discount_amount);
                }
            } else {
                discountAmount = Number(coupon.discount_value);
            }

            // Ensure discount doesn't exceed cart total
            discountAmount = Math.min(discountAmount, cartTotal);

            res.json({
                success: true,
                message: 'Coupon applied successfully',
                discountAmount: discountAmount,
                finalTotal: cartTotal - discountAmount,
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    name: coupon.name,
                    discount_type: coupon.discount_type,
                    discount_value: coupon.discount_value
                }
            });

        } catch (error) {
            console.error('Error validating coupon:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
};

module.exports = couponController;
