const pool = require('../config/db');
const crypto = require('crypto');
const { generateRoleId } = require('../utils/idGenerator');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 1 || value === 'on';
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
    const [rows] = await pool.execute(
      "SELECT * FROM home_chefs ORDER BY created_at DESC"
    );
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
  'facebook_url', 'youtube_url', 'website_url', 'preorder_available', 'cutoff_time', 'about_me',
  'cooking_story', 'languages_known', 'cooking_area_photo', 'storage_area_photo', 'created_by', 'updated_by', 'password', 'username',
  'gender', 'date_of_birth', 'age', 'country', 'kitchen_videos',
  'daily_order_capacity', 'available_days', 'available_slots', 'fssai_available', 'gst_available',
  'bank_branch', 'passbook_image', 'introduction_video', 'why_choose_me', 'delivery_radius',
  'verification_status', 'approval_status', 'approval_date', 'rejection_reason', 'block_reason'
];

exports.createHomeChef = async (req, res) => {
  try {
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      user_id,
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, email, password,
      house_number, street, area, city, district, state, pincode, country, google_map_location,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,
      daily_order_capacity, available_days, available_slots,
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
    const createdBy = auditUser?.user_id || auditUser?.id || auditUser?.email || auditUser?.name || null;
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
    const filteredData = Object.fromEntries(
      Object.entries(homeChefData)
        .filter(([key, value]) => {
          if (value === undefined || value === null || value === '') return false;
          if (!VALID_HOMECHEF_COLUMNS.includes(key)) {
            console.warn(`⚠️ Skipping invalid column: ${key}`);
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
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, email,
      house_number, street, area, city, district, state, pincode, country, google_map_location,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,
      daily_order_capacity, available_days, available_slots,
      fssai_available, gst_available, aadhaar_number, pan_number,
      bank_account_number, ifsc_code, account_holder_name, bank_branch, upi_id,
      username, instagram_url, facebook_url, youtube_url, website_url,
      about_me, cooking_story, why_choose_me, languages_known,
      delivery_radius, preorder_available, cutoff_time,
      verification_status, approval_status
    } = req.body;

    // Get existing chef data
    const [existing] = await pool.execute('SELECT * FROM home_chefs WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Home Chef not found.' });
    }
    const chef = existing[0];

    const files = req.files || {};

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
    const updatedBy = auditUser?.user_id || auditUser?.id || auditUser?.email || auditUser?.name || null;

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
      door_number: normalizeValue(house_number, chef.door_number),
      street_name: normalizeValue(street, chef.street_name),
      area_name: normalizeValue(area, chef.area_name),
      city: normalizeValue(city, chef.city),
      district: normalizeValue(district, chef.district),
      state: normalizeValue(state, chef.state),
      pincode: normalizeValue(pincode, chef.pincode),
      country: normalizeValue(country, chef.country),
      map_link: normalizeValue(google_map_location, chef.map_link),
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
      about_me: normalizeValue(about_me, chef.about_me),
      cooking_story: normalizeValue(cooking_story, chef.cooking_story),
      why_choose_me: normalizeValue(why_choose_me, chef.why_choose_me),
      languages_known: normalizeValue(languages_known, chef.languages_known),
      delivery_radius: normalizeValue(delivery_radius, chef.delivery_radius),
      preorder_available: preorderAvailable,
      cutoff_time: normalizeValue(cutoff_time, chef.cutoff_time),
      fssai_certificate_url: fssaiCertUrl,
      gst_certificate_url: gstCertUrl,
      signature_url: sigUrl,
      storage_area_photo: storagePhoto,
      verification_status: normalizeValue(verification_status, chef.verification_status),
      approval_status: normalizeValue(approval_status, chef.approval_status),
      updated_by: updatedBy
    };

    const filteredUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (!VALID_HOMECHEF_COLUMNS.includes(key)) return false;
        return true;
      })
    );

    if (Object.keys(filteredUpdate).length === 0) {
      return res.json({ message: 'No changes to update.' });
    }

    const setClauses = Object.keys(filteredUpdate).map(k => `${k} = ?`).join(', ');
    const values = Object.values(filteredUpdate);
    values.push(id);

    await pool.execute(
      `UPDATE home_chefs SET ${setClauses}, updated_at = NOW() WHERE id = ?`,
      values
    );

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

    const updatedBy = auditUser?.name || auditUser?.email || auditUser?.user_id || null;
    updates.push('updated_by = ?');
    values.push(updatedBy);
    updates.push('updated_at = NOW()');

    values.push(id);

    await pool.execute(
      `UPDATE home_chefs SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Home Chef status updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating home chef status.', error: error.message });
  }
};

// ==================== DELIVERY PARTNER MANAGEMENT ====================
exports.getDeliveryPartners = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM delivery_partners ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery partners.', error: error.message });
  }
};

exports.getDeliveryPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM delivery_partners WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Delivery Partner not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery partner.', error: error.message });
  }
};

const VALID_DELIVERY_PARTNER_COLUMNS = [
  'id', 'user_id', 'delivery_partner_user_id', 'name', 'mobile', 'email', 'status', 'created_at', 'updated_at',
  'profile_photo', 'cover_photo', 'gender', 'date_of_birth', 'age', 'blood_group', 'alt_mobile', 'whatsapp_number',
  'emergency_contact', 'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_mobile',
  'current_address', 'permanent_address', 'city', 'state', 'pincode', 'latitude', 'longitude', 'live_location',
  'vehicle_type', 'vehicle_brand', 'vehicle_model', 'vehicle_number', 'vehicle_color',
  'license_number', 'license_holder_name', 'license_issue_date', 'license_expiry_date',
  'license_front_image', 'license_back_image', 'rc_book_number', 'rc_book_image',
  'insurance_number', 'insurance_expiry_date', 'insurance_document_image',
  'aadhaar_number', 'aadhaar_front_url', 'aadhaar_back_url', 'pan_number', 'pan_card_url',
  'selfie_verification_url', 'selfie_with_vehicle', 'selfie_with_aadhaar',
  'vehicle_front_photo', 'vehicle_back_photo', 'police_verification_certificate',
  'account_holder_name', 'bank_name', 'bank_account_number', 'ifsc_code', 'branch_name', 'upi_id',
  'available_areas', 'available_time_morning', 'available_time_afternoon', 'available_time_evening', 'available_time_night',
  'preferred_distance', 'delivery_radius', 'assigned_delivery_area', 'preferred_delivery_zone',
  'otp_verified', 'face_verified', 'location_verified', 'email_verified',
  'login_status', 'account_status', 'online_status', 'availability_schedule', 'working_days', 'shift_timing',
  'password', 'username', 'father_husband_name', 'driving_experience',
  'background_verification_status', 'kyc_verification_status',
  'wallet_balance', 'pending_earnings', 'total_earnings', 'daily_earnings', 'weekly_earnings', 'monthly_earnings',
  'incentive_amount', 'bonus_amount'
];

exports.createDeliveryPartner = async (req, res) => {
  try {
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      user_id, first_name, last_name, gender, date_of_birth, age, blood_group,
      mobile, alt_mobile, whatsapp_number, email, password,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_mobile,
      current_address, permanent_address, city, state, pincode, live_location,
      vehicle_type, vehicle_brand, vehicle_model, vehicle_number, vehicle_color,
      license_number, license_holder_name, license_issue_date, license_expiry_date,
      rc_book_number, insurance_number, insurance_expiry_date,
      aadhaar_number, pan_number,
      account_holder_name, bank_name, bank_account_number, ifsc_code, branch_name, upi_id,
      available_areas, available_time_morning, available_time_afternoon, available_time_evening, available_time_night,
      preferred_distance, delivery_radius, driving_experience,
      status
    } = req.body;

    const hashedPassword = password ? hashPassword(password) : hashPassword(`${email}@2024`);
    const deliveryPartnerUserId = user_id || generateRoleId('delivery_partner');
    const createdBy = auditUser?.name || auditUser?.email || auditUser?.user_id || null;
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];

    const files = req.files || {};

    const getFileFromArray = (fileArray) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || null;
      }
      return null;
    };

    const partnerData = {
      user_id: deliveryPartnerUserId,
      delivery_partner_user_id: deliveryPartnerUserId,
      name: fullName,
      email,
      mobile,
      profile_photo: getFileFromArray(files.profile_photo),
      cover_photo: getFileFromArray(files.cover_photo),
      gender,
      date_of_birth,
      age,
      blood_group,
      alt_mobile,
      whatsapp_number,
      emergency_contact_name,
      emergency_contact_relationship,
      emergency_contact_mobile,
      current_address,
      permanent_address,
      city,
      state,
      pincode,
      live_location,
      vehicle_type,
      vehicle_brand,
      vehicle_model,
      vehicle_number,
      vehicle_color,
      license_number,
      license_holder_name,
      license_issue_date,
      license_expiry_date,
      license_front_image: getFileFromArray(files.license_front_image),
      license_back_image: getFileFromArray(files.license_back_image),
      rc_book_number,
      rc_book_image: getFileFromArray(files.rc_book_image),
      insurance_number,
      insurance_expiry_date,
      insurance_document_image: getFileFromArray(files.insurance_document_image),
      aadhaar_number,
      aadhaar_front_url: getFileFromArray(files.aadhaar_front_url),
      aadhaar_back_url: getFileFromArray(files.aadhaar_back_url),
      pan_number,
      pan_card_url: getFileFromArray(files.pan_card_url),
      selfie_verification_url: getFileFromArray(files.selfie_verification_url),
      selfie_with_vehicle: getFileFromArray(files.selfie_with_vehicle),
      selfie_with_aadhaar: getFileFromArray(files.selfie_with_aadhaar),
      vehicle_front_photo: getFileFromArray(files.vehicle_front_photo),
      vehicle_back_photo: getFileFromArray(files.vehicle_back_photo),
      police_verification_certificate: getFileFromArray(files.police_verification_certificate),
      account_holder_name,
      bank_name,
      bank_account_number,
      ifsc_code,
      branch_name,
      upi_id,
      available_areas,
      available_time_morning: normalizeBoolean(available_time_morning) ? 1 : 0,
      available_time_afternoon: normalizeBoolean(available_time_afternoon) ? 1 : 0,
      available_time_evening: normalizeBoolean(available_time_evening) ? 1 : 0,
      available_time_night: normalizeBoolean(available_time_night) ? 1 : 0,
      preferred_distance,
      delivery_radius,
      driving_experience,
      status: status || 'Pending',
      password: hashedPassword,
      father_husband_name: req.body.father_husband_name || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const filteredData = Object.fromEntries(
      Object.entries(partnerData)
        .filter(([key, value]) => {
          if (value === undefined || value === null || value === '') return false;
          if (!VALID_DELIVERY_PARTNER_COLUMNS.includes(key)) {
            console.warn(`⚠️ Skipping invalid column: ${key}`);
            return false;
          }
          return true;
        })
    );

    if (!filteredData.email) throw new Error('Email is required');
    if (!filteredData.mobile) throw new Error('Mobile number is required');
    if (!filteredData.user_id) throw new Error('User ID is required');

    const insertColumns = Object.keys(filteredData);
    const placeholders = insertColumns.map(() => '?').join(', ');
    const values = Object.values(filteredData);

    if (insertColumns.length === 0) {
      throw new Error('No valid data to insert. All fields are empty.');
    }

    const query = `INSERT INTO delivery_partners (${insertColumns.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())`;
    
    const [result] = await pool.execute(query, values);

    res.status(201).json({ message: 'Delivery Partner created successfully.', id: result.insertId });
  } catch (error) {
    console.error('❌ Error creating delivery partner:', error.message);
    res.status(500).json({ message: 'Error creating delivery partner.', error: error.message });
  }
};

exports.updateDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      first_name, last_name, gender, date_of_birth, age, blood_group,
      mobile, alt_mobile, whatsapp_number, email,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_mobile,
      current_address, permanent_address, city, state, pincode, live_location,
      vehicle_type, vehicle_brand, vehicle_model, vehicle_number, vehicle_color,
      license_number, license_holder_name, license_issue_date, license_expiry_date,
      rc_book_number, insurance_number, insurance_expiry_date,
      aadhaar_number, pan_number,
      account_holder_name, bank_name, bank_account_number, ifsc_code, branch_name, upi_id,
      available_areas, available_time_morning, available_time_afternoon, available_time_evening, available_time_night,
      preferred_distance, delivery_radius, driving_experience,
      status
    } = req.body;

    const [existing] = await pool.execute('SELECT * FROM delivery_partners WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Delivery Partner not found.' });
    }
    const partner = existing[0];

    const files = req.files || {};

    const getFileFromArray = (fileArray, fallback) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || fallback;
      }
      return fallback;
    };

    const normalizeValue = (val, fallback) => (val !== undefined && val !== null && val !== '') ? val : fallback;

    const [result] = await pool.execute(
      `UPDATE delivery_partners SET
        name = ?, mobile = ?, email = ?,
        gender = ?, date_of_birth = ?, age = ?, blood_group = ?,
        profile_photo = ?, cover_photo = ?,
        alt_mobile = ?, whatsapp_number = ?,
        emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_mobile = ?,
        current_address = ?, permanent_address = ?, city = ?, state = ?, pincode = ?, live_location = ?,
        vehicle_type = ?, vehicle_brand = ?, vehicle_model = ?, vehicle_number = ?, vehicle_color = ?,
        license_number = ?, license_holder_name = ?, license_issue_date = ?, license_expiry_date = ?,
        license_front_image = ?, license_back_image = ?,
        rc_book_number = ?, rc_book_image = ?,
        insurance_number = ?, insurance_expiry_date = ?, insurance_document_image = ?,
        aadhaar_number = ?, aadhaar_front_url = ?, aadhaar_back_url = ?,
        pan_number = ?, pan_card_url = ?,
        selfie_verification_url = ?, selfie_with_vehicle = ?, selfie_with_aadhaar = ?,
        vehicle_front_photo = ?, vehicle_back_photo = ?, police_verification_certificate = ?,
        account_holder_name = ?, bank_name = ?, bank_account_number = ?, ifsc_code = ?, branch_name = ?, upi_id = ?,
        available_areas = ?, available_time_morning = ?, available_time_afternoon = ?, available_time_evening = ?, available_time_night = ?,
        preferred_distance = ?, delivery_radius = ?, driving_experience = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        normalizeValue(first_name, '') && normalizeValue(last_name, '') ? `${normalizeValue(first_name, '')} ${normalizeValue(last_name, '')}`.trim() : partner.name,
        normalizeValue(mobile, partner.mobile),
        normalizeValue(email, partner.email),
        normalizeValue(gender, partner.gender),
        normalizeValue(date_of_birth, partner.date_of_birth),
        normalizeValue(age, partner.age),
        normalizeValue(blood_group, partner.blood_group),
        getFileFromArray(files.profile_photo, partner.profile_photo),
        getFileFromArray(files.cover_photo, partner.cover_photo),
        normalizeValue(alt_mobile, partner.alt_mobile),
        normalizeValue(whatsapp_number, partner.whatsapp_number),
        normalizeValue(emergency_contact_name, partner.emergency_contact_name),
        normalizeValue(emergency_contact_relationship, partner.emergency_contact_relationship),
        normalizeValue(emergency_contact_mobile, partner.emergency_contact_mobile),
        normalizeValue(current_address, partner.current_address),
        normalizeValue(permanent_address, partner.permanent_address),
        normalizeValue(city, partner.city),
        normalizeValue(state, partner.state),
        normalizeValue(pincode, partner.pincode),
        normalizeValue(live_location, partner.live_location),
        normalizeValue(vehicle_type, partner.vehicle_type),
        normalizeValue(vehicle_brand, partner.vehicle_brand),
        normalizeValue(vehicle_model, partner.vehicle_model),
        normalizeValue(vehicle_number, partner.vehicle_number),
        normalizeValue(vehicle_color, partner.vehicle_color),
        normalizeValue(license_number, partner.license_number),
        normalizeValue(license_holder_name, partner.license_holder_name),
        normalizeValue(license_issue_date, partner.license_issue_date),
        normalizeValue(license_expiry_date, partner.license_expiry_date),
        getFileFromArray(files.license_front_image, partner.license_front_image),
        getFileFromArray(files.license_back_image, partner.license_back_image),
        normalizeValue(rc_book_number, partner.rc_book_number),
        getFileFromArray(files.rc_book_image, partner.rc_book_image),
        normalizeValue(insurance_number, partner.insurance_number),
        normalizeValue(insurance_expiry_date, partner.insurance_expiry_date),
        getFileFromArray(files.insurance_document_image, partner.insurance_document_image),
        normalizeValue(aadhaar_number, partner.aadhaar_number),
        getFileFromArray(files.aadhaar_front_url, partner.aadhaar_front_url),
        getFileFromArray(files.aadhaar_back_url, partner.aadhaar_back_url),
        normalizeValue(pan_number, partner.pan_number),
        getFileFromArray(files.pan_card_url, partner.pan_card_url),
        getFileFromArray(files.selfie_verification_url, partner.selfie_verification_url),
        getFileFromArray(files.selfie_with_vehicle, partner.selfie_with_vehicle),
        getFileFromArray(files.selfie_with_aadhaar, partner.selfie_with_aadhaar),
        getFileFromArray(files.vehicle_front_photo, partner.vehicle_front_photo),
        getFileFromArray(files.vehicle_back_photo, partner.vehicle_back_photo),
        getFileFromArray(files.police_verification_certificate, partner.police_verification_certificate),
        normalizeValue(account_holder_name, partner.account_holder_name),
        normalizeValue(bank_name, partner.bank_name),
        normalizeValue(bank_account_number, partner.bank_account_number),
        normalizeValue(ifsc_code, partner.ifsc_code),
        normalizeValue(branch_name, partner.branch_name),
        normalizeValue(upi_id, partner.upi_id),
        normalizeValue(available_areas, partner.available_areas),
        normalizeBoolean(available_time_morning) ? 1 : 0,
        normalizeBoolean(available_time_afternoon) ? 1 : 0,
        normalizeBoolean(available_time_evening) ? 1 : 0,
        normalizeBoolean(available_time_night) ? 1 : 0,
        normalizeValue(preferred_distance, partner.preferred_distance),
        normalizeValue(delivery_radius, partner.delivery_radius),
        normalizeValue(driving_experience, partner.driving_experience),
        normalizeValue(status, partner.status),
        id
      ]
    );

    res.json({ message: 'Delivery Partner updated successfully.' });
  } catch (error) {
    console.error('❌ Error updating delivery partner:', error.message);
    res.status(500).json({ message: 'Error updating delivery partner.', error: error.message });
  }
};

exports.deleteDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM delivery_partners WHERE id = ?", [id]);
    res.json({ message: 'Delivery Partner deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting delivery partner.', error: error.message });
  }
};

exports.updateDeliveryPartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const auditUser = await resolveCurrentUserAudit(req);

    const updates = ['status = ?'];
    const values = [status];

    updates.push('updated_at = NOW()');

    values.push(id);

    await pool.execute(
      `UPDATE delivery_partners SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Delivery Partner status updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery partner status.', error: error.message });
  }
};
