const axios = require('axios');
const FormData = require('form-data');

async function testCreateChef() {
  try {
    // First, let's test without auth header to see the exact error
    const testData = new FormData();
    testData.append('first_name', 'Test');
    testData.append('last_name', 'Chef');
    testData.append('email', 'testchef@example.com');
    testData.append('mobile', '9999999999');
    testData.append('username', 'testchef');
    testData.append('kitchen_name', 'Test Kitchen');
    testData.append('veg_nonveg', 'both');
    testData.append('experience_years', '5');
    testData.append('cuisine_type', 'Indian');
    testData.append('city', 'Bangalore');
    testData.append('state', 'Karnataka');
    testData.append('country', 'India');

    console.log('📝 Sending test data...');
    
    const response = await axios.post('http://localhost:5000/api/admin/homechefs', testData, {
      headers: {
        ...testData.getHeaders(),
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIn0.fake'
      }
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreateChef();
