const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Test data for home chef creation
const testChefData = {
  first_name: "Rajesh",
  last_name: "Kumar",
  gender: "Male",
  date_of_birth: "1985-05-15",
  age: "39",
  mobile: "9876543210",
  alt_mobile: "9123456789",
  whatsapp_number: "9876543210",
  email: "rajesh.chef@example.com",
  password: "TestPass@123",
  
  // Address
  house_number: "42-A",
  street: "MG Road",
  area: "Whitefield",
  city: "Bangalore",
  district: "Bangalore",
  state: "Karnataka",
  pincode: "560066",
  country: "India",
  google_map_location: "https://maps.google.com/?q=12.9619,77.7499",
  
  // Kitchen
  kitchen_name: "Rajesh's Kitchen",
  kitchen_address: "42-A MG Road",
  kitchen_type: "Home Kitchen",
  veg_nonveg: "Both",
  experience_years: "15",
  cuisine_type: "Indian,Continental",
  daily_order_capacity: "20",
  
  // Availability
  available_days: "Monday,Tuesday,Wednesday,Thursday,Friday",
  available_slots: "9am-2pm,5pm-10pm",
  
  // Business
  fssai_available: "Yes",
  gst_available: "No",
  aadhaar_number: "1234567890123456",
  pan_number: "ABCDE1234F",
  bank_account_number: "1234567890",
  ifsc_code: "ICIC0000001",
  account_holder_name: "Rajesh Kumar",
  bank_branch: "Whitefield",
  upi_id: "rajesh@upi",
  
  // Social media
  instagram_url: "https://instagram.com/rajesh",
  facebook_url: "https://facebook.com/rajesh",
  youtube_url: "https://youtube.com/rajesh",
  website_url: "https://rajesh-kitchen.com",
  
  // Creator profile
  about_me: "Passionate about cooking authentic Indian food",
  cooking_story: "Started cooking from childhood",
  why_choose_me: "Fresh ingredients, authentic recipes",
  languages_known: "Hindi, English, Kannada",
  
  // Delivery
  delivery_radius: "5 KM",
  preorder_available: true,
  cutoff_time: "2pm",
  
  // Status
  verification_status: "Pending",
  approval_status: "Pending",
};

async function testCreateHomeChef() {
  try {
    console.log('🧪 Testing Home Chef Creation API...\n');
    
    // First, get auth token (assuming we have admin login)
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    }).catch(e => {
      console.log('⚠️  Could not auto-login, proceeding without token...');
      return null;
    });

    const token = loginResponse?.data?.token || 'test-token';
    
    // Create FormData
    const formData = new FormData();
    
    // Add all fields
    Object.entries(testChefData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    console.log('📤 Sending request to POST /admin/homechefs');
    console.log('📝 Fields being sent:', Object.keys(testChefData).length);
    
    const response = await axios.post(
      'http://localhost:5000/api/admin/homechefs',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ SUCCESS! Home Chef created');
    console.log('📊 Response:', response.data);
    console.log('🆔 Chef ID:', response.data.id);
    
  } catch (error) {
    console.error('❌ ERROR creating home chef:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.response?.data?.error);
    console.error('Stack:', error.message);
  }
}

// Run test
testCreateHomeChef();
