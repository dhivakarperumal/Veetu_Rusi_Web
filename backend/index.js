const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const initDb = require('./create-db');

const authRouter = require('./src/routes/auth');
const superadminRouter = require('./src/routes/superadmin');
const adminRouter = require('./src/routes/admin');
const subscriptionsRouter = require('./src/routes/subscriptions');
const dashboardRouter = require('./src/routes/dashboard');
const productsRouter = require('./src/routes/products');
const franchiseProductsRouter = require('./src/routes/franchiseProducts');
const categoriesRouter = require('./src/routes/categories');
const reviewsRouter = require('./src/routes/reviews');
const chefCategoriesRouter = require('./src/routes/chefCategories');
const chefFoodCategoriesRouter = require('./src/routes/chefFoodCategories');
const chefFoodsRouter = require('./src/routes/chefFoods');
const recipesRouter = require('./src/routes/recipes');
const preordersRouter = require('./src/routes/preorders');
const ordersRouter = require('./src/routes/orders');
const cartRouter = require('./src/routes/cart');
const wishlistRouter = require('./src/routes/wishlist');
const dealersRouter = require('./src/routes/dealers');
const { verifyToken, requireRole } = require('./src/middleware/authMiddleware');
const superadminController = require('./src/controllers/superadminController');
let createProductsTable = async () => {};
let createRecipeDetailsTable = async () => {};
let createFranchiseProductsTable = async () => {};
let createChefFoodTable = async () => {};
let createDeliveryPartnersTable = async () => {};
let createSubscriptionPlansTable = async () => {};
let createReviewsTable = async () => {};
let createDealersTable = async () => {};
let createUserFoodCartTable = async () => {};
let createChefFoodCategoryTable = async () => {};
let createChefCategoryTable = async () => {};
let createFranchiseCategoryTable = async () => {};
let createUserFoodOrderTable = async () => {};
let createDeliveryLiveTrackingTable = async () => {};
let createWishlistTable = async () => {};
let ensureAuditColumns = async () => {};
let cleanupHomeChefs = async () => {};
let addHomeChefUniqueConstraints = async () => {};
let addDeliveryPartnerUniqueConstraints = async () => {};
let createDpEarningsTables = async () => {};
try {
  const migrations = require('./src/config/migrations');
  createProductsTable = migrations.createProductsTable || createProductsTable;
  createRecipeDetailsTable = migrations.createRecipeDetailsTable || createRecipeDetailsTable;
  createFranchiseProductsTable = migrations.createFranchiseProductsTable || createFranchiseProductsTable;
  createChefFoodTable = migrations.createChefFoodTable || createChefFoodTable;
  createDeliveryPartnersTable = migrations.createDeliveryPartnersTable || createDeliveryPartnersTable;
  createSubscriptionPlansTable = migrations.createSubscriptionPlansTable || createSubscriptionPlansTable;
  createReviewsTable = migrations.createReviewsTable || createReviewsTable;
  createDealersTable = migrations.createDealersTable || createDealersTable;
  createUserFoodCartTable = migrations.createUserFoodCartTable || createUserFoodCartTable;
  createChefFoodCategoryTable = migrations.createChefFoodCategoryTable || createChefFoodCategoryTable;
  createChefCategoryTable = migrations.createChefCategoryTable || createChefCategoryTable;
  createFranchiseCategoryTable = migrations.createFranchiseCategoryTable || createFranchiseCategoryTable;
  createUserFoodOrderTable = migrations.createUserFoodOrderTable || createUserFoodOrderTable;
  createDeliveryLiveTrackingTable = migrations.createDeliveryLiveTrackingTable || createDeliveryLiveTrackingTable;
  createWishlistTable = migrations.createWishlistTable || createWishlistTable;
  ensureAuditColumns = migrations.ensureAuditColumns || ensureAuditColumns;
  cleanupHomeChefs = migrations.cleanupHomeChefs || cleanupHomeChefs;
  addHomeChefUniqueConstraints = migrations.addHomeChefUniqueConstraints || addHomeChefUniqueConstraints;
  addDeliveryPartnerUniqueConstraints = migrations.addDeliveryPartnerUniqueConstraints || addDeliveryPartnerUniqueConstraints;
  createDpEarningsTables = migrations.createDpEarningsTables || createDpEarningsTables;
} catch (err) {
  console.error('Warning: could not load migrations module:', err.message || err);
}
const userFoodRouter = require('./src/routes/userFood');
const userFoodOrdersRouter = require('./src/routes/userFoodOrders');
const deliveryRouter = require('./src/routes/delivery');

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const bannersRouter = require('./src/routes/banners');
const videosRouter = require('./src/routes/videos');
const uploadRouter = require('./src/routes/upload');

app.use('/api/auth', authRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/admin', adminRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/videos', videosRouter);
app.use('/api/upload', uploadRouter);

const areasRouter = express.Router();
areasRouter.use(verifyToken);
areasRouter.use(requireRole(['superadmin', 'admin']));
areasRouter.get('/', superadminController.getAreas);
areasRouter.post('/', superadminController.createArea);
areasRouter.put('/:id', superadminController.updateArea);
areasRouter.patch('/status/:id', superadminController.patchAreaStatus);
areasRouter.delete('/:id', superadminController.deleteArea);
app.use('/api/areas', areasRouter);

app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/products', productsRouter);
app.use('/api/franchise-products', franchiseProductsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/chef-categories', chefCategoriesRouter);
app.use('/api/chef-food-categories', chefFoodCategoriesRouter);
app.use('/api/chef-foods', chefFoodsRouter);
app.use('/api/preorders', preordersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/chef/recipes', recipesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
const homeChefCategorysRouter = require('./src/routes/homeChefCategorys');
app.use('/api/home-chef-categories', homeChefCategorysRouter);

app.use('/api/dealers', dealersRouter);
app.use('/api/user-food', userFoodRouter);
app.use('/api/user-food-orders', userFoodOrdersRouter);
app.use('/api/userFoodOrders', userFoodOrdersRouter);
app.use('/api/delivery', deliveryRouter);

const dpEarningsRouter = require('./src/routes/dpEarnings');
app.use('/api/dp-earnings', dpEarningsRouter);

const nearbyChefsRouter = require('./src/routes/nearbyChefs');
app.use('/api/nearby-chefs', nearbyChefsRouter);


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const startServer = async () => {
  try {
    await initDb();
  } catch (err) {
    console.error('Database initialization failed:', err);
    console.error('Continuing to start the backend server in degraded mode. API calls will fail until the database is available.');
  }

  try {
    await createProductsTable();
    await createFranchiseProductsTable();
    await createChefFoodTable();
    await createDeliveryPartnersTable();
    await createSubscriptionPlansTable();
    await createReviewsTable();
    await createUserFoodCartTable();
    await createUserFoodOrderTable();
    await createDeliveryLiveTrackingTable();
    await createDealersTable();
    await createChefFoodCategoryTable();
    await createChefCategoryTable();
    await createFranchiseCategoryTable();
    await createWishlistTable();
    await createDpEarningsTables();
  } catch (err) {
    console.error('Migration error:', err.message || err);
  }

  try {
    await createRecipeDetailsTable();
    // Ensure audit columns exist on all tables
    try {
      await ensureAuditColumns();
    } catch (err) {
      console.error('ensureAuditColumns failed:', err.message || err);
    }
    // Cleanup home_chefs table: remove chef_id, chef_unique_code, created_by_phone; add franchise_id
    try {
      await cleanupHomeChefs();
    } catch (err) {
      console.error('cleanupHomeChefs failed:', err.message || err);
    }
    // Add unique constraints to home_chefs table
    try {
      await addHomeChefUniqueConstraints();
    } catch (err) {
      console.error('addHomeChefUniqueConstraints failed:', err.message || err);
    }
    // Add unique constraints to delivery_partners table
    try {
      await addDeliveryPartnerUniqueConstraints();
    } catch (err) {
      console.error('addDeliveryPartnerUniqueConstraints failed:', err.message || err);
    }
  } catch (err) {
    console.error('Recipe details migration error:', err.message || err);
  }

  const server = app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please stop the process using it or set a different PORT in .env.`);
      process.exit(1);
    }
    throw err;
  });

  try {
    const { Server } = require('socket.io');
    const jwt = require('jsonwebtoken');
    const { setIo } = require('./src/utils/socket');

    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });

    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

    io.use((socket, next) => {
      const token = socket.handshake?.auth?.token;
      if (!token) return next();
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
      } catch (err) {
        // ignore invalid token for now
      }
      next();
    });

    io.on('connection', (socket) => {
      const uid = socket.user?.user_id || socket.user?.id;
      const role = socket.user?.role;
      if (uid) {
        socket.join(`user:${uid}`);
        if (role && String(role).toLowerCase().includes('chef')) {
          socket.join(`chef:${uid}`);
        }
      }

      socket.on('join', (data) => {
        if (!data) return;
        if (data.room) socket.join(data.room);
      });
    });

    setIo(io);
    console.log('Socket.IO initialized');
  } catch (err) {
    console.error('Socket.IO init failed:', err.message || err);
  }
};

startServer().catch((err) => {
  console.error('Failed to start backend server:', err);
});

// Image generation proxy - do not expose your OpenAI key in frontend
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size = '1024x1024' } = req.body || {};
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OpenAI API key. Set OPENAI_API_KEY in backend .env' });

    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Missing prompt' });

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(502).json({ error: 'No image returned from provider', raw: data });

    return res.json({ b64_json: b64 });
  } catch (err) {
    console.error('Generate image error:', err);
    return res.status(500).json({ error: 'Generation failed' });
  }
});