const controller = require('./src/controllers/superadminController');
const fs = require('fs');

(async () => {
  const body = JSON.parse(fs.readFileSync('tmp_franchise_payload.json', 'utf8'));
  const req = { body, files: {} };

  const res = {
    status(code) { this.code = code; return this; },
    json(obj) { console.log('RESPONSE', this.code || 200, obj); }
  };

  try {
    await controller.createFranchise(req, res);
  } catch (err) {
    console.error('Controller threw:', err);
  }
})();
