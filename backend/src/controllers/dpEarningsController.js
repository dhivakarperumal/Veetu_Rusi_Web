const pool = require('../config/db');

// --- ADMIN SETTINGS ---
exports.getEarningsSettings = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM dp_earnings_settings LIMIT 1');
        if (rows.length === 0) {
            return res.json({});
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching DP settings:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateEarningsSettings = async (req, res) => {
    try {
        const settings = req.body;
        // Construct UPDATE query dynamically based on keys
        let query = 'UPDATE dp_earnings_settings SET ';
        const values = [];
        const keys = Object.keys(settings);
        
        if (keys.length === 0) return res.status(400).json({ error: 'No data provided' });

        keys.forEach((key, index) => {
            query += `${key} = ?`;
            values.push(settings[key]);
            if (index < keys.length - 1) query += ', ';
        });
        
        // Assume there is only 1 row
        await pool.execute(query, values);
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Error updating DP settings:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- CORE CALCULATION ENGINE ---
exports.calculateAndCreditEarnings = async (orderId, deliveryPartnerUserId, distanceInKm, waitingTimeMins = 0, isCod = false, isNight = false, isPeak = false, isRain = false, isFestival = false, isHeavy = false, isEv = false) => {
    try {
        // 1. Get Settings
        const [settingsRows] = await pool.execute('SELECT * FROM dp_earnings_settings LIMIT 1');
        if (settingsRows.length === 0) return { error: 'Settings not configured' };
        const settings = settingsRows[0];

        // 2. Base & Distance Pay
        let basePay = parseFloat(settings.base_pickup_charge) + parseFloat(settings.base_delivery_charge);
        let distancePay = parseFloat(distanceInKm) * parseFloat(settings.per_km_charge);
        
        if ((basePay + distancePay) < parseFloat(settings.minimum_charge)) {
            basePay = parseFloat(settings.minimum_charge);
            distancePay = 0; // minimum charge covers distance
        }

        // 3. Waiting Pay
        let waitingPay = 0;
        if (waitingTimeMins > parseInt(settings.free_waiting_time_mins)) {
            const chargeableMins = waitingTimeMins - parseInt(settings.free_waiting_time_mins);
            waitingPay = chargeableMins * parseFloat(settings.waiting_time_charge_per_min);
        }

        // 4. Bonuses
        let bonuses = 0;
        if (isCod) bonuses += parseFloat(settings.cod_bonus);
        if (isNight) bonuses += parseFloat(settings.night_delivery_bonus);
        if (isPeak) bonuses += parseFloat(settings.peak_hour_bonus);
        if (isRain) bonuses += parseFloat(settings.rain_weather_bonus);
        if (isFestival) bonuses += parseFloat(settings.festival_bonus);
        if (isHeavy) bonuses += parseFloat(settings.heavy_parcel_charge);
        if (isEv) bonuses += parseFloat(settings.ev_vehicle_bonus);
        
        // 5. Penalties (handled separately if triggered, assuming 0 for normal flow)
        let penalties = 0;

        // 6. Net Calculation
        let grossEarnings = basePay + distancePay + waitingPay + bonuses - penalties;
        
        let platformCommission = grossEarnings * (parseFloat(settings.platform_commission_percent) / 100);
        let netBeforeTax = grossEarnings - platformCommission;
        let tax = netBeforeTax * (parseFloat(settings.gst_tax_percent) / 100);
        let netEarnings = netBeforeTax - tax;

        // 7. Insert to Earnings History
        await pool.execute(
            `INSERT INTO dp_earnings_history 
            (delivery_partner_user_id, order_id, base_pay, distance_pay, waiting_pay, bonuses_total, penalties_total, platform_commission, tax_amount, net_earnings, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Credited')`,
            [deliveryPartnerUserId, orderId, basePay, distancePay, waitingPay, bonuses, penalties, platformCommission, tax, netEarnings]
        );

        // 8. Update Wallet / Deliver Partner Balance (Assuming a wallet_balance column exists on delivery_partners or a separate wallet table, modifying delivery_partners for now or checking)
        // Check if delivery_partners has wallet_balance
        const [colCheck] = await pool.execute("SHOW COLUMNS FROM delivery_partners LIKE 'wallet_balance'");
        if (colCheck.length === 0) {
            await pool.execute("ALTER TABLE delivery_partners ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00");
        }
        await pool.execute("UPDATE delivery_partners SET wallet_balance = wallet_balance + ? WHERE user_id = ?", [netEarnings, deliveryPartnerUserId]);

        return { success: true, netEarnings };
    } catch (err) {
        console.error('Error in calculateAndCreditEarnings:', err);
        return { error: 'Calculation failed', details: err.message };
    }
};

// --- DASHBOARD / HISTORY ---
exports.getEarningsHistory = async (req, res) => {
    try {
        const dpId = req.query.delivery_partner_user_id;
        let query = 'SELECT * FROM dp_earnings_history';
        let params = [];
        if (dpId) {
            query += ' WHERE delivery_partner_user_id = ?';
            params.push(dpId);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching DP history:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
