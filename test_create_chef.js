const axios = require('axios');

async function testCreateChef() {
  try {
    const testData = {
      user_id: 'CHEF123456',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      mobile: '9876543210',
      username: 'johndoe',
      kitchen_name: 'Test Kitchen',
      veg_nonveg: 'both',
      experience_years: '5',
      cuisine_type: 'Indian',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      verification_status: 'Pending',
      approval_status: 'Pending'
    };

    console.log('Sending data:', testData);
    
    const response = await axios.post('http://localhost:5000/api/admin/homechefs', testData);
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testCreateChef();
