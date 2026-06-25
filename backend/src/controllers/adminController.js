const pool = require('../config/db');
const crypto = require('crypto');
const { generateRoleId } = require('../utils/idGenerator');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 1 || value === 'on';
}

async function getTableColumns(tableName) {
  const [rows] = await pool.execute(`SHOW COLUMNS FROM \`${tableName}\``);
  return rows.map((col) => col.Field);
}

async function resolveCurrentUserAudit(req) {
  try {
    if (!req.user) return null;

    const candidateId = req.user.id || null;
    const candidateUserId = req.user.user_id || null;
    if (!candidateId && !candidateUserId) return null;

    // Try to query with both possible column names for full name
    let rows = [];
    try {
      const [result] = await pool.execute(
        'SELECT id, user_id, full_name AS name, email FROM users WHERE (id = ? OR user_id = ?) LIMIT 1',
        [candidateId, candidateUserId]
      );
      rows = result;
    } catch (e) {
      // Fallback: try with 'name' column instead of 'full_name'
      try {
        const [result] = await pool.execute(
          'SELECT id, user_id, name, email FROM users WHERE (id = ? OR user_id = ?) LIMIT 1',
          [candidateId, candidateUserId]
        );
        rows = result;
      } catch (e2) {
        console.warn('Could not query users table for audit data:', e2.message);
        rows = [];
      }
    }

    if (rows.length > 0) {
      const user = rows[0];
      return {
        id: user.id || null,
        user_id: user.user_id || null,
        name: user.name || null,
        email: user.email || null,
      };
    }

    // Fallback: use req.user data if available
    return {
      id: candidateId,
      user_id: candidateUserId,
      name: req.user.name || req.user.full_name || req.user.username || null,
      email: req.user.email || null,
    };
  } catch (error) {
    console.error('Error in resolveCurrentUserAudit:', error);
    // Return fallback with token values on error
    return {
      id: req.user?.id || null,
      user_id: req.user?.user_id || null,
      name: req.user?.name || req.user?.full_name || null,
      email: req.user?.email || null,
    };
  }
}

// ==================== HOME CHEF MANAGEMENT ====================
exports.getHomeChefs = async (req, res) => {
  try {
    const currentUserId = req.user?.user_id || req.user?.id || null;
    let query = "SELECT * FROM home_chefs";
    const params = [];

    if (currentUserId) {
      query += " WHERE created_by = ?";
      params.push(currentUserId);
    }

    query += " ORDER BY created_at DESC";
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving home chefs.', error: error.message });
  }
};

exports.getHomeChefById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM home_chefs WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Home Chef not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving home chef.', error: error.message });
  }
};

// Valid columns in home_chefs table
const VALID_HOMECHEF_COLUMNS = [
  'id', 'user_id', 'name', 'mobile', 'email', 'aadhaar_url', 'pan_url',
  'status', 'created_at', 'updated_at', 'profile_photo', 'alt_mobile',
  'door_number', 'street_name', 'area_name', 'landmark', 'city', 'district', 'state', 'pincode',
  'map_link', 'kitchen_name', 'kitchen_address', 'kitchen_type', 'kitchen_photos',
  'cuisine_type', 'veg_nonveg', 'experience_years', 'pre_order', 'aadhaar_number',
  'pan_number', 'gst_number', 'bank_account_number', 'ifsc_code', 'account_holder_name', 'upi_id',
  'aadhaar_front_url', 'aadhaar_back_url', 'pan_card_url', 'fssai_certificate_url', 'gst_certificate_url',
  'signature_url', 'selfie_verification_url', 'instagram_url',
  'facebook_url', 'youtube_url', 'website_url', 'preorder_available', 'cutoff_time', 'opening_time', 'closing_time', 'about_me',
  'cooking_story', 'languages_known', 'cooking_area_photo', 'storage_area_photo', 'created_by', 'updated_by', 'password', 'username',
  'gender', 'date_of_birth', 'age', 'country', 'kitchen_videos',
  'daily_order_capacity', 'available_days', 'available_slots', 'fssai_available', 'gst_available',
  'bank_branch', 'passbook_image', 'introduction_video', 'why_choose_me', 'delivery_radius',
  'verification_status', 'approval_status', 'approval_date', 'rejection_reason', 'block_reason'
];

exports.createHomeChef = async (req, res) => {
  try {
    // Debug: log received files for troubleshooting kitchen video uploads
    try {
      const fileSummary = Object.keys(req.files || {}).reduce((acc, k) => {
        acc[k] = (req.files[k] || []).map(f => ({ filename: f.filename, originalname: f.originalname, size: f.size }));
        return acc;
      }, {});
      console.debug('📁 createHomeChef files received:', JSON.stringify(fileSummary));
      if (req.body) console.debug('✉️ createHomeChef body keys:', Object.keys(req.body));
    } catch (err) {
      console.debug('Could not summarise incoming files for createHomeChef:', err.message);
    }
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      user_id,
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, email, password,
      house_number, door_number, street, street_name, area, area_name, city, district, state, pincode, country, google_map_location, map_link,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,      opening_time, closing_time,      daily_order_capacity, available_days, available_slots,
      fssai_available, gst_available, aadhaar_number, pan_number,
      bank_account_number, ifsc_code, account_holder_name, bank_branch, upi_id,
      username, instagram_url, facebook_url, youtube_url, website_url,
      about_me, cooking_story, why_choose_me, languages_known,
      delivery_radius, preorder_available, cutoff_time,
      verification_status, approval_status
    } = req.body;

    const hashedPassword = password ? hashPassword(password) : hashPassword(`${email}@2024`);
    const homeChefUserId = user_id || generateRoleId('chef');
    const preorderAvailable = normalizeBoolean(preorder_available) ? 1 : 0;
    const createdBy = auditUser?.user_id || auditUser?.id || null;
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];

    const files = req.files || {};

    const getFileFromArray = (fileArray) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || null;
      }
      return null;
    };

    const profilePhoto = getFileFromArray(files.profile_photo);
    const kitchenPhotos = Array.isArray(files.kitchen_photos) && files.kitchen_photos.length > 0
      ? JSON.stringify(files.kitchen_photos.map(f => f.filename))
      : null;
    const kitchenVideos = Array.isArray(files.kitchen_videos) && files.kitchen_videos.length > 0
      ? JSON.stringify(files.kitchen_videos.map(f => f.filename))
      : null;
    const cookingAreaPhoto = getFileFromArray(files.cooking_area_photo);
    const aadhaarFront = getFileFromArray(files.aadhaar_front_url);
    const aadhaarBack = getFileFromArray(files.aadhaar_back_url);
    const panCard = getFileFromArray(files.pan_card_url);
    const passbookImg = getFileFromArray(files.passbook_image);
    const selfieVerif = getFileFromArray(files.selfie_verification_url);
    const introVideo = getFileFromArray(files.introduction_video);
    const fssaiCertUrl = getFileFromArray(files.fssai_certificate_url);
    const gstCertUrl = getFileFromArray(files.gst_certificate_url);
    const sigUrl = getFileFromArray(files.signature_url);
    // legacy kitchen photos removed
    const storagePhoto = getFileFromArray(files.storage_area_photo);

    const homeChefData = {
      user_id: homeChefUserId,
      name: fullName,
      email,
      mobile,
      profile_photo: profilePhoto,
      alt_mobile,
      door_number: house_number,
      street_name: street,
      area_name: area,
      city,
      district,
      state,
      pincode,
      country,
      map_link: google_map_location,
      kitchen_name,
      kitchen_address,
      kitchen_type,
      kitchen_photos: kitchenPhotos,
      kitchen_videos: kitchenVideos,
      cooking_area_photo: cookingAreaPhoto,
      veg_nonveg,
      experience_years,
      cuisine_type,
      daily_order_capacity,
      available_days,
      available_slots,
      fssai_available,
      gst_available,
      aadhaar_number,
      pan_number,
      bank_account_number,
      ifsc_code,
      account_holder_name,
      bank_branch,
      upi_id,
      passbook_image: passbookImg,
      aadhaar_front_url: aadhaarFront,
      aadhaar_back_url: aadhaarBack,
      pan_card_url: panCard,
      selfie_verification_url: selfieVerif,
      introduction_video: introVideo,
      instagram_url,
      facebook_url,
      youtube_url,
      website_url,
      about_me,
      cooking_story,
      why_choose_me,
      languages_known,
      delivery_radius,
      preorder_available: preorderAvailable,
      cutoff_time,
      opening_time,
      closing_time,
      fssai_certificate_url: fssaiCertUrl,
      gst_certificate_url: gstCertUrl,
      signature_url: sigUrl,
      storage_area_photo: storagePhoto,
      verification_status: verification_status || 'Pending',
      approval_status: approval_status || 'Pending',
      created_by: createdBy,
      password: hashedPassword,
      username,
      // father_husband_name removed
      gender,
      date_of_birth,
      age,
      country
    };

    // Filter out undefined, null, and invalid columns
    const validColumns = await getTableColumns('home_chefs');
    const filteredData = Object.fromEntries(
      Object.entries(homeChefData)
        .filter(([key, value]) => {
          if (value === undefined || value === null || value === '') return false;
          if (!VALID_HOMECHEF_COLUMNS.includes(key) || !validColumns.includes(key)) {
            console.warn(`⚠️ Skipping invalid or missing column: ${key}`);
            return false;
          }
          return true;
        })
    );

    // Validate required fields
    if (!filteredData.email) {
      throw new Error('Email is required');
    }
    if (!filteredData.mobile) {
      throw new Error('Mobile number is required');
    }
    if (!filteredData.user_id) {
      throw new Error('User ID is required');
    }

    const insertColumns = Object.keys(filteredData);
    const placeholders = insertColumns.map(() => '?').join(', ');
    const values = Object.values(filteredData);

    if (insertColumns.length === 0) {
      throw new Error('No valid data to insert. All fields are empty.');
    }

    const query = `INSERT INTO home_chefs (${insertColumns.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())`;
    
    const [result] = await pool.execute(query, values);

    res.status(201).json({ message: 'Home Chef created successfully.', id: result.insertId });
  } catch (error) {
    console.error('❌ Error creating home chef:', error.message);
    res.status(500).json({ message: 'Error creating home chef.', error: error.message });
  }
};

exports.updateHomeChef = async (req, res) => {
  try {
    const { id } = req.params;
    // Debug: log received files for troubleshooting kitchen video uploads
    try {
      const fileSummary = Object.keys(req.files || {}).reduce((acc, k) => {
        acc[k] = (req.files[k] || []).map(f => ({ filename: f.filename, originalname: f.originalname, size: f.size }));
        return acc;
      }, {});
      console.debug('📁 updateHomeChef files received:', JSON.stringify(fileSummary));
      if (req.body) console.debug('✉️ updateHomeChef body keys:', Object.keys(req.body));
    } catch (err) {
      console.debug('Could not summarise incoming files for updateHomeChef:', err.message);
    }
    const auditUser = await resolveCurrentUserAudit(req);
    // Destructure both original field names and database column names (frontend sends mapped names)
    const {
      name,
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, email,
      password,
      house_number, door_number, street, street_name, area, area_name, city, district, state, pincode, country, google_map_location, map_link,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,
      opening_time, closing_time,
      daily_order_capacity, available_days, available_slots,
      fssai_available, gst_available, aadhaar_number, pan_number,
      bank_account_number, ifsc_code, account_holder_name, bank_branch, upi_id,
      username, instagram_url, facebook_url, youtube_url, website_url,
      about_me, cooking_story, why_choose_me, languages_known,
      delivery_radius, preorder_available, cutoff_time,
      verification_status, approval_status
    } = req.body;

    // Get existing chef data
    let existing, chef;
    try {
      [existing] = await pool.execute('SELECT * FROM home_chefs WHERE id = ?', [id]);
      if (!existing || existing.length === 0) {
        console.warn(`⚠️ Home Chef with id=${id} not found in database`);
        return res.status(404).json({ message: 'Home Chef not found.' });
      }
      chef = existing[0];
      console.log(`✓ Found home chef id=${id}, updating...`);
    } catch (dbErr) {
      console.error('🔴 Database error fetching home chef:', dbErr.message);
      throw dbErr;
    }

    const files = req.files || {};

    // Hash password if one was sent
    let hashedPassword = undefined;
    if (password !== undefined && password !== null && password !== '') {
      hashedPassword = hashPassword(password);
    }

    const getFileFromArray = (fileArray, fallback) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || fallback;
      }
      return fallback;
    };

    const profilePhoto = getFileFromArray(files.profile_photo, chef.profile_photo);
    const kitchenPhotos = (Array.isArray(files.kitchen_photos) && files.kitchen_photos.length > 0)
      ? JSON.stringify(files.kitchen_photos.map(f => f.filename))
      : chef.kitchen_photos;
    const kitchenVideos = (Array.isArray(files.kitchen_videos) && files.kitchen_videos.length > 0)
      ? JSON.stringify(files.kitchen_videos.map(f => f.filename))
      : chef.kitchen_videos;
    const cookingAreaPhoto = getFileFromArray(files.cooking_area_photo, chef.cooking_area_photo);
    const aadhaarFront = getFileFromArray(files.aadhaar_front_url, chef.aadhaar_front_url);
    const aadhaarBack = getFileFromArray(files.aadhaar_back_url, chef.aadhaar_back_url);
    const panCard = getFileFromArray(files.pan_card_url, chef.pan_card_url);
    const passbookImg = getFileFromArray(files.passbook_image, chef.passbook_image);
    const selfieVerif = getFileFromArray(files.selfie_verification_url, chef.selfie_verification_url);
    const introVideo = getFileFromArray(files.introduction_video, chef.introduction_video);
    const fssaiCertUrl = getFileFromArray(files.fssai_certificate_url, chef.fssai_certificate_url);
    const gstCertUrl = getFileFromArray(files.gst_certificate_url, chef.gst_certificate_url);
    const sigUrl = getFileFromArray(files.signature_url, chef.signature_url);
    const storagePhoto = getFileFromArray(files.storage_area_photo, chef.storage_area_photo);

    const fullName = [first_name, last_name].filter(Boolean).join(' ') || chef.name;
    const preorderAvailable = preorder_available !== undefined ? (normalizeBoolean(preorder_available) ? 1 : 0) : chef.preorder_available;
    const updatedBy = auditUser?.user_id || auditUser?.id || null;

    const normalizeValue = (val, fallback) => (val !== undefined && val !== null && val !== '') ? val : fallback;

    const updateData = {
      name: fullName,
      mobile: normalizeValue(mobile, chef.mobile),
      email: normalizeValue(email, chef.email),
      gender: normalizeValue(gender, chef.gender),
      date_of_birth: normalizeValue(date_of_birth, chef.date_of_birth),
      age: normalizeValue(age, chef.age),
      profile_photo: profilePhoto,
      alt_mobile: normalizeValue(alt_mobile, chef.alt_mobile),
      // Use either form name (house_number) or database column name (door_number), whichever was sent
      door_number: normalizeValue(door_number !== undefined ? door_number : house_number, chef.door_number),
      street_name: normalizeValue(street_name !== undefined ? street_name : street, chef.street_name),
      area_name: normalizeValue(area_name !== undefined ? area_name : area, chef.area_name),
      city: normalizeValue(city, chef.city),
      district: normalizeValue(district, chef.district),
      state: normalizeValue(state, chef.state),
      pincode: normalizeValue(pincode, chef.pincode),
      country: normalizeValue(country, chef.country),
      map_link: normalizeValue(map_link !== undefined ? map_link : google_map_location, chef.map_link),
      kitchen_name: normalizeValue(kitchen_name, chef.kitchen_name),
      kitchen_address: normalizeValue(kitchen_address, chef.kitchen_address),
      kitchen_type: normalizeValue(kitchen_type, chef.kitchen_type),
      kitchen_photos: kitchenPhotos,
      kitchen_videos: kitchenVideos,
      cooking_area_photo: cookingAreaPhoto,
      veg_nonveg: normalizeValue(veg_nonveg, chef.veg_nonveg),
      experience_years: normalizeValue(experience_years, chef.experience_years),
      cuisine_type: normalizeValue(cuisine_type, chef.cuisine_type),
      daily_order_capacity: normalizeValue(daily_order_capacity, chef.daily_order_capacity),
      available_days: normalizeValue(available_days, chef.available_days),
      available_slots: normalizeValue(available_slots, chef.available_slots),
      fssai_available: normalizeValue(fssai_available, chef.fssai_available),
      gst_available: normalizeValue(gst_available, chef.gst_available),
      aadhaar_number: normalizeValue(aadhaar_number, chef.aadhaar_number),
      pan_number: normalizeValue(pan_number, chef.pan_number),
      bank_account_number: normalizeValue(bank_account_number, chef.bank_account_number),
      ifsc_code: normalizeValue(ifsc_code, chef.ifsc_code),
      account_holder_name: normalizeValue(account_holder_name, chef.account_holder_name),
      bank_branch: normalizeValue(bank_branch, chef.bank_branch),
      upi_id: normalizeValue(upi_id, chef.upi_id),
      passbook_image: passbookImg,
      aadhaar_front_url: aadhaarFront,
      aadhaar_back_url: aadhaarBack,
      pan_card_url: panCard,
      selfie_verification_url: selfieVerif,
      introduction_video: introVideo,
      instagram_url: normalizeValue(instagram_url, chef.instagram_url),
      facebook_url: normalizeValue(facebook_url, chef.facebook_url),
      youtube_url: normalizeValue(youtube_url, chef.youtube_url),
      website_url: normalizeValue(website_url, chef.website_url),
      // Only set password in updateData when provided; fallback keeps existing chef.password
      password: hashedPassword !== undefined ? hashedPassword : chef.password,
      about_me: normalizeValue(about_me, chef.about_me),
      cooking_story: normalizeValue(cooking_story, chef.cooking_story),
      why_choose_me: normalizeValue(why_choose_me, chef.why_choose_me),
      languages_known: normalizeValue(languages_known, chef.languages_known),
      delivery_radius: normalizeValue(delivery_radius, chef.delivery_radius),
      preorder_available: preorderAvailable,
      cutoff_time: normalizeValue(cutoff_time, chef.cutoff_time),
      opening_time: normalizeValue(opening_time, chef.opening_time),
      closing_time: normalizeValue(closing_time, chef.closing_time),
      fssai_certificate_url: fssaiCertUrl,
      gst_certificate_url: gstCertUrl,
      signature_url: sigUrl,
      storage_area_photo: storagePhoto,
      verification_status: normalizeValue(verification_status, chef.verification_status),
      approval_status: normalizeValue(approval_status, chef.approval_status),
      updated_by: updatedBy
    };

    // Only include fields that have actually been sent in the request (not just defaults from chef data)
    // Include both original field names and mapped database column names since frontend sends either
    const fieldsFromRequest = {
      name,
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, email,
      password,
      house_number, door_number, street, street_name, area, area_name, city, district, state, pincode, country, google_map_location, map_link,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,
      daily_order_capacity, available_days, available_slots,
      fssai_available, gst_available, aadhaar_number, pan_number,
      bank_account_number, ifsc_code, account_holder_name, bank_branch, upi_id,
      username, instagram_url, facebook_url, youtube_url, website_url,
      about_me, cooking_story, why_choose_me, languages_known,      opening_time, closing_time,      delivery_radius, preorder_available, cutoff_time,
      verification_status, approval_status
    };

    // Helper to check if a file was uploaded for a given column/key
    const hasFileForKey = (key) => {
      return files && Object.prototype.hasOwnProperty.call(files, key) && Array.isArray(files[key]) && files[key].length > 0;
    };

    const validColumns = await getTableColumns('home_chefs');
    const filteredUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => {
        if (!VALID_HOMECHEF_COLUMNS.includes(key) || !validColumns.includes(key)) {
          console.debug(`  ⊘ Skipping invalid or missing column: ${key}`);
          return false;
        }

        // Map database column names to the possible request field names
        // Frontend can send either the original form names OR the mapped database column names
        const possibleRequestNames = key === 'door_number' ? ['house_number', 'door_number']
                              : key === 'street_name' ? ['street', 'street_name']
                              : key === 'area_name' ? ['area', 'area_name']
                              : key === 'map_link' ? ['google_map_location', 'map_link']
                              : key === 'name' ? ['name', 'first_name', 'last_name']
                              : [key];

        // name can be set if name or either first_name or last_name was sent
        if (key === 'name') {
          const isIncluded = fieldsFromRequest.name !== undefined || fieldsFromRequest.first_name !== undefined || fieldsFromRequest.last_name !== undefined;
          if (isIncluded) console.debug(`  ✓ Including: ${key} (name or first_name/last_name present)`);
          return isIncluded;
        }

        // If this is an audit field, include it always
        if (key === 'updated_by') {
          console.debug(`  ✓ Including: ${key} (audit field)`);
          return true;
        }

        // Check if any of the possible request names were sent or a file was uploaded for this key
        const isIncluded = possibleRequestNames.some(f => fieldsFromRequest[f] !== undefined) || hasFileForKey(key);
        if (isIncluded) console.debug(`  ✓ Including: ${key} (one of ${possibleRequestNames.join('/')} present or file uploaded)`);
        return isIncluded;
      })
    );

    console.log(`📊 Filter result: ${Object.keys(filteredUpdate).length} of ${Object.keys(updateData).length} fields will be updated`);

    if (Object.keys(filteredUpdate).length === 0) {
      console.warn(`⚠️ No fields to update for chef id=${id}. fieldsFromRequest keys: ${Object.keys(fieldsFromRequest).filter(k => fieldsFromRequest[k] !== undefined).join(', ')}`);
      return res.json({ message: 'No changes to update.' });
    }

    console.log(`✓ Updating ${Object.keys(filteredUpdate).length} fields for chef id=${id}: ${Object.keys(filteredUpdate).join(', ')}`);

    const setClauses = Object.keys(filteredUpdate).map(k => `${k} = ?`).join(', ');
    const values = Object.values(filteredUpdate);
    values.push(id);

    try {
      const result = await pool.execute(
        `UPDATE home_chefs SET ${setClauses}, updated_at = NOW() WHERE id = ?`,
        values
      );
      console.log(`✓ Update query executed for chef id=${id}`);
    } catch (updateErr) {
      console.error(`🔴 SQL Update error for chef id=${id}:`, updateErr.message);
      throw updateErr;
    }

    if (filteredUpdate.status === 'Approved' || filteredUpdate.approval_status === 'Approved') {
      const [chefRows] = await pool.execute('SELECT * FROM home_chefs WHERE id = ?', [id]);
      if (chefRows.length > 0) {
        const chef = chefRows[0];
        if (chef.email) {
          const [userRows] = await pool.execute('SELECT id FROM users WHERE email = ?', [chef.email]);
          if (userRows.length === 0) {
            const homeChefUserId = chef.user_id || 'CHEF-' + Date.now();
            const chefName = chef.name || chef.first_name || 'Home Chef';
            await pool.execute(
              'INSERT INTO users (user_id, full_name, email, mobile_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [homeChefUserId, chefName, chef.email, chef.mobile || null, chef.password, 'homechef', 'Active']
            );
          } else {
            await pool.execute(
              'UPDATE users SET status = ?, role = ? WHERE email = ?',
              ['Active', 'homechef', chef.email]
            );
          }
        }
      }
    }

    res.json({ message: 'Home Chef updated successfully.' });
  } catch (error) {
    console.error('❌ Error updating home chef:', error.message);
    res.status(500).json({ message: 'Error updating home chef.', error: error.message });
  }
};

exports.deleteHomeChef = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM home_chefs WHERE id = ?", [id]);
    res.json({ message: 'Home Chef deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting home chef.', error: error.message });
  }
};

exports.updateHomeChefStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verification_status, approval_status, rejection_reason, block_reason } = req.body;
    const auditUser = await resolveCurrentUserAudit(req);

    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (verification_status) {
      updates.push('verification_status = ?');
      values.push(verification_status);
    }
    if (approval_status) {
      updates.push('approval_status = ?');
      values.push(approval_status);
      if (approval_status === 'Approved') {
        updates.push('approval_date = NOW()');
      }
    }
    if (rejection_reason !== undefined) {
      updates.push('rejection_reason = ?');
      values.push(rejection_reason);
    }
    if (block_reason !== undefined) {
      updates.push('block_reason = ?');
      values.push(block_reason);
    }

    const updatedBy = auditUser?.user_id || auditUser?.id || null;
    updates.push('updated_by = ?');
    values.push(updatedBy);
    updates.push('updated_at = NOW()');

    values.push(id);

    await pool.execute(
      `UPDATE home_chefs SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (status === 'Approved' || approval_status === 'Approved') {
      const [chefRows] = await pool.execute('SELECT * FROM home_chefs WHERE id = ?', [id]);
      if (chefRows.length > 0) {
        const chef = chefRows[0];
        if (chef.email) {
          const [userRows] = await pool.execute('SELECT id FROM users WHERE email = ?', [chef.email]);
          if (userRows.length === 0) {
            const homeChefUserId = chef.user_id || 'CHEF-' + Date.now();
            const chefName = chef.name || chef.first_name || 'Home Chef';
            await pool.execute(
              'INSERT INTO users (user_id, full_name, email, mobile_number, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [homeChefUserId, chefName, chef.email, chef.mobile || null, chef.password, 'homechef', 'Active']
            );
          } else {
            await pool.execute(
              'UPDATE users SET status = ?, role = ? WHERE email = ?',
              ['Active', 'homechef', chef.email]
            );
          }
        }
      }
    }

    res.json({ message: 'Home Chef status updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating home chef status.', error: error.message });
  }
};

const superadminController = require('./superadminController');

// ==================== DELIVERY PARTNER MANAGEMENT ====================
exports.getDeliveryPartners = async (req, res) => {
  try {
    const currentUserId = req.user?.user_id || req.user?.id || null;
    let query = "SELECT * FROM delivery_partners";
    const params = [];

    if (currentUserId) {
      query += " WHERE created_by = ?";
      params.push(currentUserId);
    }

    query += " ORDER BY created_at DESC";
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery partners.', error: error.message });
  }
};
exports.getDeliveryPartnerById = superadminController.getDeliveryPartnerById;
exports.createDeliveryPartner = superadminController.createDeliveryPartner;
exports.updateDeliveryPartner = superadminController.updateDeliveryPartner;
exports.deleteDeliveryPartner = superadminController.deleteDeliveryPartner;
exports.updateDeliveryPartnerStatus = superadminController.updateDeliveryPartnerStatus;

// ==================== USER MANAGEMENT ====================
exports.getUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.user_id || req.user?.id || null;
    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const adminUserIdStr = req.user?.user_id || 'UNKNOWN';
    const adminIdInt = req.user?.id || -1;

    const query = `
      SELECT DISTINCT u.id, u.user_id, u.full_name AS name, u.email, u.mobile_number AS phone, u.role, u.status AS active, u.created_at
      FROM users u
      LEFT JOIN home_chefs hc ON (u.user_id = hc.user_id OR (u.email = hc.email AND u.email IS NOT NULL AND u.email != ''))
      LEFT JOIN delivery_partners dp ON (u.user_id = dp.user_id OR u.user_id = dp.delivery_partner_user_id OR (u.email = dp.email AND u.email IS NOT NULL AND u.email != ''))
      LEFT JOIN user_food_order_table o ON u.user_id = o.user_id
      LEFT JOIN home_chefs hc2 ON (o.chef_id = hc2.id OR o.chef_user_id = hc2.user_id)
      WHERE hc.created_by IN (?, ?)
         OR dp.created_by IN (?, ?)
         OR hc2.created_by IN (?, ?)
      ORDER BY u.created_at DESC
    `;
    const [rows] = await pool.execute(query, [
      adminUserIdStr, adminIdInt,
      adminUserIdStr, adminIdInt,
      adminUserIdStr, adminIdInt
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users.', error: error.message });
  }
};

