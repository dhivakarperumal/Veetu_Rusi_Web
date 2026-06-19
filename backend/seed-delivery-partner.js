const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'veetu_rusi';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

(async function main() {
  const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, port: DB_PORT });
  try {
    const [tables] = await conn.execute("SHOW TABLES LIKE 'delivery_partners'");
    if (!tables || tables.length === 0) {
      console.error('delivery_partners table does not exist in database. Run migrations first.');
      process.exit(1);
    }

    const [[{ cnt }]] = await conn.execute('SELECT COUNT(*) AS cnt FROM delivery_partners');
    if (cnt > 0) {
      console.log('delivery_partners already contains data; skipping seed.');
      process.exit(0);
    }

    const hashed = hashPassword('Password@123');
    const now = new Date();
    const createdAt = now.toISOString().slice(0, 19).replace('T', ' ');

    const values = [
      'dp_sample_001', // user_id
      'dp_sample_001', // delivery_partner_user_id
      'Sample Delivery Partner', // name
      'dp_sample@example.com', // email
      '9999999999', // mobile
      'Pending', // status
      'Male', // gender
      '1990-01-01', // date_of_birth
      36, // age
      'O+', // blood_group
      null, // alt_mobile
      'Emergency Contact', // emergency_contact_name
      'Sibling', // emergency_contact_relationship
      '8888888888', // emergency_contact_mobile
      '123 Sample Street', // current_address
      '123 Sample Street', // permanent_address
      'Sample City', // city
      'Sample State', // state
      '123456', // pincode
      'POINT(0 0)', // live_location (stored as string if column expects varchar)
      'Bike', // vehicle_type
      'Honda', // vehicle_brand
      'CBR500', // vehicle_model
      'MH12AB1234', // vehicle_number
      'Red', // vehicle_color
      'LIC1234567', // license_number
      'Sample Delivery Partner', // license_holder_name
      '2020-01-01', // license_issue_date
      '2030-01-01', // license_expiry_date
      null, // license_front_image
      null, // license_back_image
      '111122223333', // aadhaar_number
      null, // aadhaar_front_url
      null, // aadhaar_back_url
      'ABCDE1234F', // pan_number
      null, // pan_card_url
      null, // selfie_verification_url
      null, // selfie_with_vehicle
      null, // selfie_with_aadhaar
      null, // vehicle_front_photo
      'Sample Delivery Partner', // account_holder_name
      'Sample Bank', // bank_name
      '123456789012', // bank_account_number
      'SBIN0000123', // ifsc_code
      'Sample Branch', // branch_name
      'sample@upi', // upi_id
      'Area1,Area2', // available_areas
      1, // available_time_morning
      0, // available_time_afternoon
      0, // available_time_evening
      0, // available_time_night
      '5 KM', // preferred_distance
      '10 KM', // delivery_radius
      '5 years', // driving_experience
      hashed, // password
      'system', // created_by
      'system', // updated_by
      createdAt, // created_at
      createdAt // updated_at
    ];

    const placeholders = new Array(values.length).fill('?').join(', ');
    const columns = [
      'user_id','delivery_partner_user_id','name','email','mobile','status','gender','date_of_birth','age','blood_group',
      'alt_mobile','emergency_contact_name','emergency_contact_relationship','emergency_contact_mobile','current_address','permanent_address','city','state','pincode','live_location',
      'vehicle_type','vehicle_brand','vehicle_model','vehicle_number','vehicle_color',
      'license_number','license_holder_name','license_issue_date','license_expiry_date','license_front_image','license_back_image',
      'aadhaar_number','aadhaar_front_url','aadhaar_back_url','pan_number','pan_card_url',
      'selfie_verification_url','selfie_with_vehicle','selfie_with_aadhaar','vehicle_front_photo',
      'account_holder_name','bank_name','bank_account_number','ifsc_code','branch_name','upi_id',
      'available_areas','available_time_morning','available_time_afternoon','available_time_evening','available_time_night',
      'preferred_distance','delivery_radius','driving_experience','password','created_by','updated_by','created_at','updated_at'
    ];

    const query = `INSERT INTO delivery_partners (${columns.join(', ')}) VALUES (${placeholders})`;
    await conn.execute(query, values);
    console.log('Inserted sample delivery partner into delivery_partners table.');
  } catch (err) {
    console.error('Error seeding delivery_partners:', err.message || err);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
