# Products CRUD Backend Implementation Guide

## 🎯 Overview

Complete backend implementation for home chef product management with full CRUD operations, chef metadata capture, and creator information tracking.

---

## 📦 What Was Implemented

### 1. **Products Controller** 
**File**: `backend/src/controllers/productController.js`

Complete CRUD operations with 7 main functions:

#### `getAllProducts()`
- Get all products with optional filters
- Query parameters: `chef_id`, `category`, `status`
- Returns array sorted by creation date (newest first)

#### `getProductById(id)`
- Fetch specific product by ID
- Returns complete product details including variants

#### `createProduct()`
- Create new product with comprehensive data
- **Required fields**: name, category, mrp, chef_id
- **Auto-filled fields**: created_at, updated_at, product_code
- **Chef metadata captured**: chef_id, chef_name, chef_phone, chef_email
- **Creator metadata captured**: created_by_user_id, created_by_email, created_by_name, created_by_phone
- Returns newly created product ID and product code

#### `updateProduct(id)`
- Update existing product
- Same fields as create
- Updates `updated_at` timestamp automatically

#### `deleteProduct(id)`
- Soft/hard delete product
- Verifies product exists before deletion

#### `getLatestProductCode()`
- Generate next product code in SP### format
- Auto-incremented sequence

#### `getCategories()`
- Return available food categories
- Currently hardcoded; can be moved to database

---

### 2. **Products Routes**
**File**: `backend/src/routes/products.js`

RESTful API endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/products` | Create new product |
| `GET` | `/api/products` | List products (with filters) |
| `GET` | `/api/products/:id` | Get product details |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/products/categories` | Get available categories |
| `GET` | `/api/products/latest-code` | Get next product code |

---

### 3. **Database Table Schema**
**File**: `backend/src/config/migrations.js`

**Table**: `products`

#### Key Columns:

**Product Information**
- `id` (INT, PK, AUTO_INCREMENT)
- `name` (VARCHAR 255, NOT NULL)
- `description` (LONGTEXT)
- `category` (VARCHAR 100)
- `product_type` (VARCHAR 100) - "Cooked Food" or "Masala/Pre-cooked"
- `subcategory` (VARCHAR 100)

**Pricing**
- `mrp` (DECIMAL 10,2, NOT NULL)
- `offer` (INT, default 0)
- `offer_price` (DECIMAL 10,2)
- `product_code` (VARCHAR 50, UNIQUE)

**Stock Management**
- `total_stock` (INT, default 0)
- `rating` (DECIMAL 2,1, default 5)
- `status` (VARCHAR 50, default 'Active')

**Food-Specific Fields**
- `material` (VARCHAR 255) - ingredients/materials
- `nutrition_info` (VARCHAR 255)
- `storage_instructions` (VARCHAR 255)
- `presentation_style` (VARCHAR 255)
- `portion_format` (VARCHAR 255)
- `service_type` (VARCHAR 255)
- `packaging_notes` (VARCHAR 255)
- `dietary_tag` (VARCHAR 255)
- `heat_profile` (VARCHAR 255)
- `serving_size` (VARCHAR 100)
- `prep_time` (VARCHAR 100)
- `ingredients` (LONGTEXT)
- `spice_level` (VARCHAR 50)
- `shelf_life_days` (INT)

**Masala-Specific Fields**
- `net_weight` (VARCHAR 100)
- `package_count` (INT)
- `packaging_type` (VARCHAR 100)
- `manufacture_date` (DATE)

**Chef Information** ⭐
- `chef_id` (VARCHAR 255, NOT NULL)
- `chef_name` (VARCHAR 255)
- `chef_phone` (VARCHAR 20)
- `chef_email` (VARCHAR 255)

**Creator Information** ⭐
- `created_by_user_id` (VARCHAR 255)
- `created_by_email` (VARCHAR 255)
- `created_by_name` (VARCHAR 255)
- `created_by_phone` (VARCHAR 20)

**Variants & Additional**
- `variants` (LONGTEXT) - JSON array of product variations
- `franchise_id` (VARCHAR 255) - optional franchise link
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE)

**Indexes**
- `idx_chef_id` on chef_id
- `idx_category` on category
- `idx_status` on status
- `idx_created_at` on created_at

---

### 4. **Frontend Integration**
**File**: `frontend/src/HomeChef/Pages/AddProducts.jsx`

Updated `handleSubmit()` function to:

1. Extract user data from localStorage
2. Gather chef information
3. Include all creator metadata
4. Submit complete data payload with variants

**Data sent to backend**:
```javascript
{
  ...formData,           // All product fields
  variants,              // Array of product variations
  chef_id,               // From localStorage or user.id
  chef_name,             // Chef's name
  chef_phone,            // Chef's phone
  chef_email,            // Chef's email
  created_by_user_id,    // User ID who created
  created_by_email,      // Creator's email
  created_by_name,       // Creator's name
  created_by_phone       // Creator's phone
}
```

---

## 🚀 How to Test

### Backend Setup

1. **Start Backend Server**
```bash
cd backend
npm start
```

2. **Check Health Endpoint**
```bash
curl http://localhost:5000/api/health
# Should return: { "status": "ok" }
```

3. **Products Table Auto-Created**
- On server startup, migrations run automatically
- Check database: `SHOW TABLES;` in phpMyAdmin

---

### API Testing with Postman/cURL

#### Create Product
```bash
POST http://localhost:5000/api/products
Content-Type: application/json

{
  "name": "Chicken Biryani",
  "description": "Fragrant basmati rice with tender chicken",
  "category": "Cooked Food",
  "product_type": "Cooked Food",
  "mrp": 250,
  "offer": 10,
  "offer_price": 225,
  "total_stock": 20,
  "status": "Active",
  "serving_size": "Single",
  "prep_time": "45 mins",
  "ingredients": "Chicken, Basmati Rice, Spices",
  "spice_level": "Medium",
  "shelf_life_days": 1,
  "storage_instructions": "Keep Refrigerated",
  "chef_id": "chef_123",
  "chef_name": "Amita Sharma",
  "chef_phone": "98765432100",
  "chef_email": "amita@example.com",
  "created_by_user_id": "user_456",
  "created_by_email": "creator@example.com",
  "created_by_name": "Franchise Admin",
  "created_by_phone": "97654321000",
  "variants": [
    {
      "color": "#FF6B6B",
      "colorName": "Red",
      "images": ["data:image/jpeg;base64,..."],
      "selectedSizes": ["Single"],
      "sizesStock": {"Single": 20}
    }
  ]
}
```

#### Get All Products
```bash
GET http://localhost:5000/api/products
# Optional filters:
# ?chef_id=chef_123
# ?category=Cooked%20Food
# ?status=Active
```

#### Get Product by ID
```bash
GET http://localhost:5000/api/products/1
```

#### Update Product
```bash
PUT http://localhost:5000/api/products/1
Content-Type: application/json

{
  "name": "Butter Chicken Biryani",
  "mrp": 280,
  ...otherFields
}
```

#### Delete Product
```bash
DELETE http://localhost:5000/api/products/1
```

#### Get Categories
```bash
GET http://localhost:5000/api/products/categories
```

#### Get Latest Product Code
```bash
GET http://localhost:5000/api/products/latest-code
```

---

### Frontend Testing

1. **Navigate to Chef Product Add Page**
   - URL: `http://localhost:5173/chef/add-products`

2. **Fill Form**
   - Name: "Paneer Tikka"
   - Category: "Cooked Food"
   - Product Type: "Cooked Food"
   - MRP: 150
   - Fill all required fields

3. **Submit**
   - Should show success toast
   - Redirects to `/chef/products`
   - Data visible in database

---

## 📊 Database Verification

### phpMyAdmin Checks

1. **View Products Table**
```sql
SELECT * FROM products;
```

2. **Check Specific Chef's Products**
```sql
SELECT * FROM products WHERE chef_id = 'chef_123';
```

3. **View Table Structure**
```sql
SHOW COLUMNS FROM products;
```

4. **Check Variants JSON**
```sql
SELECT id, name, variants FROM products WHERE id = 1;
```

---

## 🔧 Configuration

### Backend Routes Registration
**File**: `backend/index.js`

```javascript
const productsRouter = require('./src/routes/products');
const { createProductsTable } = require('./src/config/migrations');

// Register routes
app.use('/api/products', productsRouter);

// Run migrations on startup
app.listen(port, async () => {
  await createProductsTable();
  console.log(`Backend listening on http://localhost:${port}`);
});
```

---

## ⚠️ Important Notes

### Data Validation
- **Required on Create**: name, category, mrp, chef_id
- **Type-specific requirements**:
  - Cooked Food: serving_size, prep_time, ingredients, shelf_life_days
  - Masala/Pre-cooked: net_weight, ingredients, packaging_type, shelf_life_days

### Image Handling
- Images stored as base64 in variants field
- Frontend compresses images to 0.5MB max
- Consider moving to cloud storage for production

### Product Codes
- Auto-generated format: SP### (e.g., SP001, SP002)
- Stored in `product_code` field
- Can be custom if provided

### Chef & Creator Info
- **Chef ID**: Primary identifier for product owner
- **Creator**: Franchise admin or system user who created
- Both tracked for audit and ownership verification

---

## 🔐 Security Considerations (Optional Enhancements)

1. **Add Authentication Middleware**
```javascript
const authMiddleware = require('../middleware/authMiddleware');
router.post('/', authMiddleware, productController.createProduct);
```

2. **Verify Chef Ownership**
```javascript
if (product.chef_id !== req.user.id) {
  return res.status(403).json({ message: 'Unauthorized' });
}
```

3. **Validate Base64 Size**
```javascript
if (base64String.length > 2000000) { // 2MB limit
  return res.status(400).json({ message: 'Image too large' });
}
```

---

## 📝 Files Modified/Created

| File | Status | Purpose |
|------|--------|---------|
| `backend/src/controllers/productController.js` | ✅ Created | CRUD operations |
| `backend/src/routes/products.js` | ✅ Created | API endpoints |
| `backend/src/config/migrations.js` | ✅ Created | Database schema |
| `backend/index.js` | ✅ Updated | Route registration & migrations |
| `frontend/src/HomeChef/Pages/AddProducts.jsx` | ✅ Updated | Form submission logic |

---

## 🎓 Workflow Example

### Complete Product Lifecycle

1. **Chef Login** → Authentication
2. **Navigate to Add Product** → `/chef/add-products`
3. **Fill Product Form** → All fields including type-specific
4. **Submit Form** → Frontend posts to `/api/products`
5. **Backend Processing** → Validates, inserts into database
6. **Success Response** → Product created with ID and code
7. **Redirect** → `/chef/products` (list view)
8. **Database Storage** → All chef/creator info captured

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Products table not created | Check migrations run on server startup |
| 500 errors on POST | Verify all required fields present |
| Images not saving | Check MySQL max_allowed_packet setting |
| Products not appearing in list | Verify chef_id matches logged-in user |
| Update not working | Ensure product ID exists, check ownership |

---

## ✅ Implementation Complete!

All backend CRUD operations, database schema, and frontend integration are ready. 

**Next Steps:**
1. Start backend server
2. Test API endpoints
3. Test frontend form submission
4. Verify database records
5. Optional: Add authentication middleware for enhanced security

For any issues or enhancements, refer to the code comments in each file.
