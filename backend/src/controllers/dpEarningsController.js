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

// ─── Haversine distance helper (km) ─────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(3));
}

// ─── Auto-detect delivery context ────────────────────────────────────────────
function detectContext(order) {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 22 || hour < 6;
    const isPeak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
    const isCod = (order?.payment_method || '').toLowerCase() === 'cod';
    return { isNight, isPeak, isCod };
}

// --- CORE CALCULATION ENGINE ---
exports.calculateAndCreditEarnings = async (orderId, deliveryPartnerUserId) => {
    try {
        // 1. Get Settings
        const [settingsRows] = await pool.execute('SELECT * FROM dp_earnings_settings LIMIT 1');
        if (settingsRows.length === 0) return { error: 'Settings not configured' };
        const settings = settingsRows[0];

        // 2. Fetch order & tracking data to get REAL distance
        const [orderRows] = await pool.execute(
            'SELECT * FROM user_food_order_table WHERE order_id = ? LIMIT 1',
            [orderId]
        );
        const order = orderRows[0] || {};

        // 3. Get real distance from delivery_live_tracking
        const [trackingRows] = await pool.execute(
            `SELECT total_distance_km,
                    pickup_latitude, pickup_longitude,
                    dropoff_latitude, dropoff_longitude
             FROM delivery_live_tracking WHERE order_id = ? LIMIT 1`,
            [orderId]
        );
        const tracking = trackingRows[0] || {};

        let distanceKm = 0;
        if (tracking.total_distance_km && parseFloat(tracking.total_distance_km) > 0) {
            // Use the pre-calculated stored distance (set at order assignment)
            distanceKm = parseFloat(tracking.total_distance_km);
        } else if (
            tracking.pickup_latitude && tracking.pickup_longitude &&
            tracking.dropoff_latitude && tracking.dropoff_longitude
        ) {
            // Compute on-the-fly using Haversine
            distanceKm = haversineKm(
                parseFloat(tracking.pickup_latitude),
                parseFloat(tracking.pickup_longitude),
                parseFloat(tracking.dropoff_latitude),
                parseFloat(tracking.dropoff_longitude)
            );
        } else {
            // Fallback: compute from users table via order if tracking coords missing
            const [coordRows] = await pool.execute(
                `SELECT COALESCE(hc.latitude, cu.latitude) AS pickup_lat,
                        COALESCE(hc.longitude, cu.longitude) AS pickup_lng,
                        cust.latitude AS dropoff_lat,
                        cust.longitude AS dropoff_lng
                 FROM user_food_order_table o
                 LEFT JOIN users cu ON cu.user_id = o.chef_user_id
                 LEFT JOIN home_chefs hc ON (hc.user_id = o.chef_user_id OR hc.id = o.chef_id)
                 LEFT JOIN users cust ON cust.user_id = o.user_id
                 WHERE o.order_id = ? LIMIT 1`,
                [orderId]
            );
            const coords = coordRows[0] || {};
            if (coords.pickup_lat && coords.pickup_lng && coords.dropoff_lat && coords.dropoff_lng) {
                distanceKm = haversineKm(
                    parseFloat(coords.pickup_lat), parseFloat(coords.pickup_lng),
                    parseFloat(coords.dropoff_lat), parseFloat(coords.dropoff_lng)
                );
                // Save it back to tracking for future reference
                await pool.execute(
                    'UPDATE delivery_live_tracking SET total_distance_km = ?, pickup_latitude = ?, pickup_longitude = ?, dropoff_latitude = ?, dropoff_longitude = ? WHERE order_id = ?',
                    [distanceKm, coords.pickup_lat, coords.pickup_lng, coords.dropoff_lat, coords.dropoff_lng, orderId]
                ).catch(() => {});
            }
        }

        console.log(`[DP Earnings] Order ${orderId} | Distance: ${distanceKm} km | Partner: ${deliveryPartnerUserId}`);

        // 4. Auto-detect context (night, peak, COD)
        const { isNight, isPeak, isCod } = detectContext(order);

        // 5. Base & Distance Pay
        let basePay = parseFloat(settings.base_pickup_charge || 0) + parseFloat(settings.base_delivery_charge || 0);
        let distancePay = distanceKm * parseFloat(settings.per_km_charge || 0);

        const totalBase = basePay + distancePay;
        const minCharge = parseFloat(settings.minimum_charge || 0);
        if (totalBase < minCharge) {
            basePay = minCharge;
            distancePay = 0;
        }

        // 6. Waiting Pay (default 0 — can be passed in future)
        const waitingTimeMins = 0;
        let waitingPay = 0;
        if (waitingTimeMins > parseInt(settings.free_waiting_time_mins || 5)) {
            const chargeableMins = waitingTimeMins - parseInt(settings.free_waiting_time_mins || 5);
            waitingPay = chargeableMins * parseFloat(settings.waiting_time_charge_per_min || 0);
        }

        // 7. Bonuses
        let bonuses = 0;
        if (isCod) bonuses += parseFloat(settings.cod_bonus || 0);
        if (isNight) bonuses += parseFloat(settings.night_delivery_bonus || 0);
        if (isPeak) bonuses += parseFloat(settings.peak_hour_bonus || 0);

        // 8. Penalties (none in default flow)
        let penalties = 0;

        // 9. Net Calculation
        const grossEarnings = basePay + distancePay + waitingPay + bonuses - penalties;
        const platformCommission = grossEarnings * (parseFloat(settings.platform_commission_percent || 0) / 100);
        const netBeforeTax = grossEarnings - platformCommission;
        const tax = netBeforeTax * (parseFloat(settings.gst_tax_percent || 0) / 100);
        const netEarnings = parseFloat((netBeforeTax - tax).toFixed(2));

        // 10. Insert to Earnings History
        await pool.execute(
            `INSERT INTO dp_earnings_history 
            (delivery_partner_user_id, order_id, base_pay, distance_pay, waiting_pay, bonuses_total, penalties_total, platform_commission, tax_amount, net_earnings, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Credited')`,
            [deliveryPartnerUserId, orderId,
             parseFloat(basePay.toFixed(2)), parseFloat(distancePay.toFixed(2)),
             parseFloat(waitingPay.toFixed(2)), parseFloat(bonuses.toFixed(2)),
             parseFloat(penalties.toFixed(2)), parseFloat(platformCommission.toFixed(2)),
             parseFloat(tax.toFixed(2)), netEarnings]
        );

        // 11. Update wallet_balance on delivery_partners
        const [colCheck] = await pool.execute("SHOW COLUMNS FROM delivery_partners LIKE 'wallet_balance'");
        if (colCheck.length === 0) {
            await pool.execute("ALTER TABLE delivery_partners ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00");
        }
        await pool.execute(
            "UPDATE delivery_partners SET wallet_balance = wallet_balance + ? WHERE user_id = ?",
            [netEarnings, deliveryPartnerUserId]
        );

        console.log(`✅ [DP Earnings] Order ${orderId}: dist=${distanceKm}km base=${basePay} dist_pay=${distancePay} bonuses=${bonuses} net=₹${netEarnings}`);
        return { success: true, distanceKm, basePay, distancePay, bonuses, netEarnings };
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
