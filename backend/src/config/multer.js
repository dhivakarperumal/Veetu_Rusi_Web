const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    const fieldname = file.fieldname;

    if (fieldname === 'banner_image') {
      folder += 'banners/';
    } else if (fieldname === 'restaurant_image' || fieldname === 'gst_doc' || fieldname === 'fssai_doc') {
      folder += 'restaurants/';
    } else if (fieldname === 'chef_image' || fieldname === 'aadhaar_doc' || fieldname === 'pan_doc') {
      folder += 'homechefs/';
    } else if (fieldname === 'partner_image' || fieldname === 'license_doc') {
      folder += 'deliverypartners/';
    }

    // Resolve directory path
    const dirPath = path.join(__dirname, '../../', folder);
    
    // Ensure directories exist
    fs.mkdirSync(dirPath, { recursive: true });
    cb(null, dirPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
