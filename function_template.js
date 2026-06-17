// This will be a temporary fix file - I'll extract just the createHomeChef function
const template = `
exports.createHomeChef = async (req, res) => {
  try {
    const auditUser = await resolveCurrentUserAudit(req);
    const {
      user_id,
      first_name, last_name, gender, date_of_birth, age,
      mobile, alt_mobile, whatsapp_number, email, password, emergency_contact,
      house_number, street, area, city, district, state, pincode, country, google_map_location,
      kitchen_name, kitchen_address, kitchen_type,
      veg_nonveg, experience_years, cuisine_type,
      daily_order_capacity, available_days, available_slots,
      fssai_available, gst_available, aadhaar_number, pan_number,
      bank_account_number, ifsc_code, account_holder_name, bank_branch, upi_id,
      father_husband_name, username, instagram_url, facebook_url, youtube_url, website_url,
      about_me, cooking_story, why_choose_me, languages_known,
      delivery_radius, preorder_available, cutoff_time,
      verification_status, approval_status, franchise_user_id
    } = req.body;

    const hashedPassword = password ? hashPassword(password) : hashPassword(\`\${email}@2024\`);
    const homeChefUserId = user_id || generateRoleId('chef');
    const preorderAvailable = normalizeBoolean(preorder_available) ? 1 : 0;
    const createdBy = auditUser?.name || auditUser?.email || auditUser?.user_id || null;
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];

    // Extract uploaded files - safe extraction
    const files = req.files || {};
    
    const getFileFromArray = (fileArray) => {
      if (Array.isArray(fileArray) && fileArray.length > 0) {
        return fileArray[0]?.filename || null;
      }
      return null;
    };

    const profilePhoto = getFileFromArray(files.profile_photo);
    const coverBanner = getFileFromArray(files.cover_banner);
    const kitchenPhotos = (Array.isArray(files.kitchen_photos) && files.kitchen_photos.length > 0) 
      ? JSON.stringify(files.kitchen_photos.map(f => f.filename)) 
      : null;
    const kitchenVideos = (Array.isArray(files.kitchen_videos) && files.kitchen_videos.length > 0) 
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
    const kitchenPhoto1 = getFileFromArray(files.kitchen_photo1);
    const kitchenPhoto2 = getFileFromArray(files.kitchen_photo2);
    const kitchenPhoto3 = getFileFromArray(files.kitchen_photo3);
    const storagePhoto = getFileFromArray(files.storage_area_photo);

    const homeChefData = {
      user_id: homeChefUserId,
      name: fullName,
      mobile,
      email,
      password: hashedPassword,
      username: username || email,
      father_husband_name,
      gender,
      date_of_birth,
      age,
      profile_photo: profilePhoto,
      cover_banner: coverBanner,
      alt_mobile,
      whatsapp_number,
      emergency_contact,
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
      kitchen_photo1,
      kitchen_photo2,
      kitchen_photo3,
      storage_area_photo: storagePhoto,
      verification_status: verification_status || 'Pending',
      approval_status: approval_status || 'Pending',
      franchise_user_id,
      created_by: createdBy
    };

    // Filter out undefined, null, and invalid columns
    const filteredData = Object.fromEntries(
      Object.entries(homeChefData)
        .filter(([key, value]) => {
          if (value === undefined || value === null || value === '') return false;
          if (!VALID_HOMECHEF_COLUMNS.includes(key)) {
            console.warn(\`⚠️ Skipping invalid column: \${key}\`);
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

    console.log('📝 Insert columns:', insertColumns.length, 'columns');
    console.log('🔍 Sample data keys:', insertColumns.slice(0, 5), '...');
    console.log('📋 All columns:', insertColumns);

    if (insertColumns.length === 0) {
      throw new Error('No valid data to insert. All fields are empty.');
    }

    const query = \`INSERT INTO home_chefs (\${insertColumns.join(', ')}, created_at, updated_at)
      VALUES (\${placeholders}, NOW(), NOW())\`;
    
    console.log('🔍 SQL Query:', query.substring(0, 150) + '...');
    
    const [result] = await pool.execute(query, values);

    console.log('✅ Home Chef created:', result.insertId);
    res.status(201).json({ message: 'Home Chef created successfully.', id: result.insertId });
  } catch (error) {
    console.error('❌ Error creating home chef:', error.message);
    console.error('📍 Stack:', error.stack);
    res.status(500).json({ message: 'Error creating home chef.', error: error.message });
  }
};
`;

console.log(template);
