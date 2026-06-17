const axios = require('axios');

const baseURL = 'http://localhost:5000';

const testUpdateHomeChef = async () => {
  try {
    // First, login to get token
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      identifier: 'admin@gmail.com',
      password: 'admin@123'
    });

    const token = loginRes.data.token;
    console.log('✓ Login successful, token received');

    // Create API instance with auth header
    const api = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Get list of home chefs
    console.log('\n📋 Fetching home chefs...');
    const chefsRes = await api.get('/api/admin/homechefs');
    const chefs = chefsRes.data;
    console.log(`✓ Found ${chefs.length} home chefs`);

    if (chefs.length === 0) {
      console.log('No home chefs available to test');
      return;
    }

    const chefToUpdate = chefs[0];
    console.log(`\n👨‍🍳 Updating chef: ${chefToUpdate.name} (ID: ${chefToUpdate.id})`);

    // Prepare update data with all fields
    const updateData = {
      first_name: chefToUpdate.name?.split(' ')[0] || 'Test',
      last_name: chefToUpdate.name?.split(' ')[1] || 'Chef',
      email: chefToUpdate.email,
      mobile: chefToUpdate.mobile,
      alt_mobile: '9999999999',
      gender: 'Male',
      date_of_birth: '1990-01-01',
      age: 34,
      house_number: '123',
      street: 'Main Street',
      area: 'Downtown',
      city: chefToUpdate.city || 'Mumbai',
      district: chefToUpdate.district || 'Mumbai',
      state: chefToUpdate.state || 'Maharashtra',
      pincode: '400001',
      country: 'India',
      google_map_location: 'https://maps.google.com',
      kitchen_name: chefToUpdate.kitchen_name || 'Test Kitchen',
      kitchen_address: chefToUpdate.kitchen_address || 'Test Address',
      kitchen_type: chefToUpdate.kitchen_type || 'Commercial',
      veg_nonveg: 'Both',
      experience_years: 10,
      cuisine_type: 'Indian',
      daily_order_capacity: 50,
      available_days: 'Mon,Tue,Wed',
      available_slots: '9AM-12PM,12PM-6PM',
      fssai_available: 1,
      gst_available: 1,
      aadhaar_number: '123456789012',
      pan_number: 'ABCDE1234F',
      bank_account_number: '123456789',
      ifsc_code: 'SBIN0001234',
      account_holder_name: 'Test Chef',
      bank_branch: 'Main Branch',
      upi_id: 'testchef@upi',
      instagram_url: 'https://instagram.com/testchef',
      facebook_url: 'https://facebook.com/testchef',
      youtube_url: 'https://youtube.com/testchef',
      website_url: 'https://testchef.com',
      about_me: 'I am a test chef',
      cooking_story: 'Started cooking 10 years ago',
      why_choose_me: 'Best quality food',
      languages_known: 'English,Hindi',
      delivery_radius: 10,
      preorder_available: 1,
      cutoff_time: '24',
      verification_status: 'Verified',
      approval_status: 'Approved'
    };

    console.log(`\n📤 Sending update with ${Object.keys(updateData).length} fields...`);
    console.log('Fields being sent:', Object.keys(updateData).join(', '));

    const updateRes = await api.put(`/api/admin/homechefs/${chefToUpdate.id}`, updateData);
    console.log('\n✓ Update successful!');
    console.log('Response:', updateRes.data);

    // Verify the update by fetching the chef again
    console.log('\n🔍 Verifying update...');
    const verifyRes = await api.get(`/api/admin/homechefs/${chefToUpdate.id}`);
    const updatedChef = verifyRes.data;

    console.log('\nUpdate verification:');
    console.log('- Mobile:', updatedChef.mobile === updateData.mobile ? '✓' : '✗');
    console.log('- Alt Mobile:', updatedChef.alt_mobile === updateData.alt_mobile ? '✓' : '✗');
    console.log('- Street Name:', updatedChef.street_name === updateData.street ? '✓' : '✗');
    console.log('- Area Name:', updatedChef.area_name === updateData.area ? '✓' : '✗');
    console.log('- Door Number:', updatedChef.door_number === updateData.house_number ? '✓' : '✗');
    console.log('- Kitchen Name:', updatedChef.kitchen_name === updateData.kitchen_name ? '✓' : '✗');
    console.log('- Experience Years:', updatedChef.experience_years == updateData.experience_years ? '✓' : '✗');
    console.log('- UPI ID:', updatedChef.upi_id === updateData.upi_id ? '✓' : '✗');
    console.log('- About Me:', updatedChef.about_me === updateData.about_me ? '✓' : '✗');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testUpdateHomeChef();
