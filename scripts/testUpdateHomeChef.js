(async () => {
  // Simple test harness for updateHomeChef controller
  const path = require('path');
  const dbPath = path.join(__dirname, '../backend/src/config/db');
  const pool = require(dbPath);
  const adminController = require('../backend/src/controllers/adminController');

  // Replace pool.execute with a mock implementation
  let lastQuery = null;
  let lastValues = null;
  pool.execute = async (query, params) => {
    lastQuery = query;
    lastValues = params;
    if (query && query.toLowerCase().includes('select * from home_chefs where id')) {
      // return a fake existing chef row
      return [[{
        id: 123,
        name: 'Existing Chef',
        mobile: '9999999999',
        email: 'chef@example.com',
        instagram_url: 'https://instagram.com/old',
        facebook_url: 'https://facebook.com/old',
        youtube_url: 'https://youtube.com/old',
        website_url: 'https://oldsite.com',
        password: 'oldhashed',
        profile_photo: null,
        kitchen_photos: null
      }]];
    }
    // Simulate update success
    return [{ affectedRows: 1 }];
  };

  // Mock request and response
  const req = {
    params: { id: '123' },
    body: {
      instagram_url: 'https://instagram.com/newuser',
      facebook_url: 'https://facebook.com/newpage',
      youtube_url: 'https://youtube.com/newchannel',
      website_url: 'https://newsite.example',
      password: 'MyNewPass123'
    },
    files: {},
    user: null
  };

  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this._json = obj; console.log('Response:', codeSafe(this.statusCode), obj); return this; }
  };

  function codeSafe(c) { return c || 200 }

  try {
    await adminController.updateHomeChef(req, res);
    console.log('\nCaptured UPDATE SQL:');
    console.log(lastQuery);
    console.log('Captured values:');
    console.log(lastValues);
  } catch (err) {
    console.error('Test script error:', err);
  }
})();
