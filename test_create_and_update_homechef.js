const axios = require('axios');

const baseURL = 'http://localhost:5000';

const testCreateAndUpdateHomeChef = async () => {
  try {
    // First, login to get token
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      identifier: 'admin@gmail.com',
      password: 'admin@123'
    });

    const token = loginRes.data.token;
    console.log('✓ Login successful');
    const admin = loginRes.data.user;
    console.log(`Admin ID: ${admin.user_id}`);

    // Create API instance with auth header
    const api = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Create a new home chef
    console.log('\n👨‍🍳 Creating a new home chef...');
    const createData = new FormData();
    const timestamp = Date.now().toString().slice(-6);
    createData.append('first_name', 'Test');
    createData.append('last_name', 'Chef');
    createData.append('email', `testchef${timestamp}@example.com`);
    createData.append('mobile', `98765${timestamp}`);
    createData.append('password', 'Test@123');
    createData.append('house_number', '456');
    createData.append('street', 'Test Street');
    createData.append('area', 'Test Area');
    createData.append('city', 'Mumbai');
    createData.append('state', 'Maharashtra');
    createData.append('pincode', '400001');
    createData.append('country', 'India');
    createData.append('kitchen_name', 'Test Kitchen');
    createData.append('kitchen_address', 'Test Kitchen Address');
    createData.append('kitchen_type', 'Commercial');
    createData.append('veg_nonveg', 'Both');
    createData.append('experience_years', 5);
    createData.append('cuisine_type', 'Indian');

    const createRes = await api.post('/api/admin/homechefs', createData);
    console.log('✓ Home chef created successfully');
    const newChef = createRes.data;
    console.log(`Chef ID: ${newChef.id}`);

    // Now test the update
    console.log('\n📤 Updating the home chef with all fields...');
    const updateData = {
      first_name: 'Updated',
      last_name: 'Chef',
      email: newChef.email,
      mobile: '9999999999',
      alt_mobile: '8888888888',
      gender: 'Male',
      date_of_birth: '1990-01-01',
      age: 34,
      house_number: '789',
      street: 'Updated Street',
      area: 'Updated Area',
      city: 'Delhi',
      district: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India',
      google_map_location: 'https://maps.google.com/updated',
      kitchen_name: 'Updated Kitchen',
      kitchen_address: 'Updated Kitchen Address',
      kitchen_type: 'Home',
      veg_nonveg: 'Vegetarian',
      experience_years: 10,
      cuisine_type: 'Italian',
      daily_order_capacity: 100,
      available_days: 'Mon,Tue,Wed,Thu',
      available_slots: '9AM-12PM,12PM-6PM,6PM-9PM',
      fssai_available: 1,
      gst_available: 0,
      aadhaar_number: '999999999999',
      pan_number: `PAN${timestamp}`,
      bank_account_number: '123456789',
      ifsc_code: 'SBIN0001234',
      account_holder_name: 'Updated Chef',
      bank_branch: 'Main Branch',
      upi_id: `updated${timestamp}@upi`,
      instagram_url: 'https://instagram.com/updatedchef',
      facebook_url: 'https://facebook.com/updatedchef',
      youtube_url: 'https://youtube.com/updatedchef',
      website_url: 'https://updatedchef.com',
      about_me: 'Updated about me text',
      cooking_story: 'Updated cooking story',
      why_choose_me: 'Updated why choose me',
      languages_known: 'English,Hindi,Marathi',
      delivery_radius: 20,
      preorder_available: 0,
      cutoff_time: '12',
      verification_status: 'Verified',
      approval_status: 'Approved'
    };

    console.log(`Sending ${Object.keys(updateData).length} fields for update...`);
    const updateRes = await api.put(`/api/admin/homechefs/${newChef.id}`, updateData);
    console.log('✓ Update successful');
    console.log('Response:', updateRes.data);

    // Verify the update by fetching the chef again
    console.log('\n🔍 Verifying update by fetching updated chef...');
    const verifyRes = await api.get(`/api/admin/homechefs/${newChef.id}`);
    const updatedChef = verifyRes.data;

    console.log('\n✅ Update verification:');
    const checks = [
      { field: 'first_name', actual: updatedChef.name?.split(' ')[0], expected: updateData.first_name },
      { field: 'mobile', actual: updatedChef.mobile, expected: updateData.mobile },
      { field: 'alt_mobile', actual: updatedChef.alt_mobile, expected: updateData.alt_mobile },
      { field: 'door_number', actual: updatedChef.door_number, expected: updateData.house_number },
      { field: 'street_name', actual: updatedChef.street_name, expected: updateData.street },
      { field: 'area_name', actual: updatedChef.area_name, expected: updateData.area },
      { field: 'city', actual: updatedChef.city, expected: updateData.city },
      { field: 'kitchen_name', actual: updatedChef.kitchen_name, expected: updateData.kitchen_name },
      { field: 'kitchen_type', actual: updatedChef.kitchen_type, expected: updateData.kitchen_type },
      { field: 'experience_years', actual: updatedChef.experience_years, expected: updateData.experience_years },
      { field: 'upi_id', actual: updatedChef.upi_id, expected: updateData.upi_id },
      { field: 'instagram_url', actual: updatedChef.instagram_url, expected: updateData.instagram_url },
      { field: 'about_me', actual: updatedChef.about_me, expected: updateData.about_me },
      { field: 'verification_status', actual: updatedChef.verification_status, expected: updateData.verification_status },
    ];

    let passCount = 0;
    checks.forEach(check => {
      const passed = check.actual == check.expected;
      const status = passed ? '✓' : '✗';
      console.log(`  ${status} ${check.field}: ${check.actual} ${passed ? '' : `(expected: ${check.expected})`}`);
      if (passed) passCount++;
    });

    console.log(`\n📊 Results: ${passCount}/${checks.length} fields updated correctly`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

testCreateAndUpdateHomeChef();
