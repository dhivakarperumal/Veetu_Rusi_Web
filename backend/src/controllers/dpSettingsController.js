const pool = require('../config/db');

exports.getSettings = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM dp_earnings_settings ORDER BY id DESC LIMIT 1');
        if (rows.length === 0) {
            return res.json({ success: true, data: {} });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching DP settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const data = req.body;
        const [existing] = await pool.query('SELECT id FROM dp_earnings_settings ORDER BY id DESC LIMIT 1');

        const validKeys = [
            'base_pickup_charge', 'base_delivery_charge', 'per_km_charge', 'minimum_charge',
            'waiting_time_charge_per_min', 'free_waiting_time_mins', 'return_delivery_charge',
            'toll_charges', 'platform_commission_percent', 'gst_tax_percent', 'cod_bonus',
            'night_delivery_bonus', 'peak_hour_bonus', 'rain_weather_bonus', 'festival_bonus',
            'heavy_parcel_charge', 'multi_order_bonus', 'ev_vehicle_bonus', 'daily_incentive_target_orders',
            'daily_incentive_reward', 'order_cancellation_penalty', 'late_delivery_penalty',
            'customer_complaint_penalty',
            // Receipt settings
            'receipt_enabled', 'receipt_header', 'receipt_footer', 'receipt_logo', 'receipt_show_item_sku', 'receipt_printer_name',
            // Payment settings
            'upi_enabled', 'upi_id'
        ];

        const updates = {};
        for (const key of validKeys) {
            if (data[key] !== undefined) {
                updates[key] = data[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided' });
        }

        let query = '';
        let params = [];

        if (existing.length === 0) {
            // INSERT
            const columns = Object.keys(updates).join(', ');
            const placeholders = Object.keys(updates).map(() => '?').join(', ');
            query = `INSERT INTO dp_earnings_settings (${columns}) VALUES (${placeholders})`;
            params = Object.values(updates);
        } else {
            // UPDATE
            const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            query = `UPDATE dp_earnings_settings SET ${setClause} WHERE id = ?`;
            params = [...Object.values(updates), existing[0].id];
        }

        await pool.query(query, params);
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating DP settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
