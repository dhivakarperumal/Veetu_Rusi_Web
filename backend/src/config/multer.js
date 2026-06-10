const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    const fieldname = file.fieldname;

    const homeChefFields = [
      'profile_photo',
      'cover_banner',
      'aadhaar_front_url',
      'aadhaar_back_url',
      'pan_card_url',
      'fssai_certificate_url',
      'gst_certificate_url',
      'signature_url',
      'selfie_verification_url',
      'kitchen_photos',
      'kitchen_videos'
    ];
    const restaurantFields = [
      'logo_url',
      'banner_url',
      'aadhaar_url',
      'pan_url',
      'gst_certificate_url',
      'shop_license_url',
      'restaurant_photos_urls',
      'kitchen_photos_urls',
      'signature_url'
    ];
    const deliveryFields = [
      'profile_photo',
      'cover_photo',
      'aadhaar_front_url',
      'aadhaar_back_url',
      'pan_card_url',
      'selfie_verification_url',
      'police_verification_certificate',
      'vehicle_front_photo',
      'vehicle_back_photo',
      'rc_book_image',
      'insurance_document_image',
      'license_front_image',
      'license_back_image'
    ];

    if (homeChefFields.includes(fieldname)) {
      folder += 'homechefs/';
    } else if (restaurantFields.includes(fieldname)) {
      folder += 'restaurants/';
    } else if (deliveryFields.includes(fieldname)) {
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
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.webp', '.mp4', '.mov', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos, and PDF documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = upload;
