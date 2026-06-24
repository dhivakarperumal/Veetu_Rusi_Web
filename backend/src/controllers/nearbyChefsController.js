const pool = require('../config/db');

exports.getNearbyChefs = async (req, res) => {
  try {
    const { user_lat, user_lon, radius, area, district, pincode } = req.query;
    
    // Fallback to logged in user's location if available
    const lat = parseFloat(user_lat || req.user?.latitude);
    const lon = parseFloat(user_lon || req.user?.longitude);
    const searchRadius = parseFloat(radius) || 10; // Default 10 KM

    let query = 'SELECT hc.id, hc.user_id, hc.name, hc.mobile, hc.profile_photo, hc.area_name, hc.district, hc.pincode, hc.latitude, hc.longitude, hc.delivery_radius';
    
    if (!isNaN(lat) && !isNaN(lon)) {
      query += `, ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( hc.latitude ) ) * cos( radians( hc.longitude ) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians( hc.latitude ) ) ) ) AS distance`;
    } else {
      query += `, NULL as distance`;
    }

    query += ' FROM home_chefs hc WHERE hc.status = "Approved"';
    const params = [];

    if (area) {
      query += ' AND hc.area_name = ?';
      params.push(area);
    }
    if (district) {
      query += ' AND hc.district = ?';
      params.push(district);
    }
    if (pincode) {
      query += ' AND hc.pincode = ?';
      params.push(pincode);
    }

    if (!isNaN(lat) && !isNaN(lon)) {
      query += ` HAVING distance <= ${searchRadius}`;
      query += ' ORDER BY distance ASC';
    } else {
      query += ' ORDER BY hc.created_at DESC';
    }

    const [rows] = await pool.execute(query, params);
    
    const chefs = rows.map((row) => ({
      ...row,
      distance: row.distance !== null && row.distance !== undefined ? `${parseFloat(row.distance).toFixed(2)} KM` : null
    }));

    res.json(chefs);
  } catch (error) {
    console.error('Error fetching nearby chefs:', error);
    res.status(500).json({ message: 'Failed to fetch nearby chefs', error: error.message });
  }
};
