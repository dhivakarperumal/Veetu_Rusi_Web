const fs = require('fs');
const path = require('path');
const payloadPath = path.join(__dirname, 'tmp_franchise_payload.json');
const data = fs.readFileSync(payloadPath, 'utf8');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoic3VwZXJhZG1pbiIsIm5hbWUiOiJEZXZUZXN0IiwiaWF0IjoxNzc5NTM0MDMyfQ.9e2--lQFn4ogMjn42ENDIdqdCBSa3UAZI0dQiJEjQlM';

(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/superadmin/franchises', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: data
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log(text);
  } catch (err) {
    console.error(err);
  }
})();
