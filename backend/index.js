const express = require('express');
const cors = require('cors');
require('dotenv').config();
const initDb = require('./create-db');

const path = require('path');
const authRouter = require('./src/routes/auth');
const superadminRouter = require('./src/routes/superadmin');
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
const { createProductsTable, createRecipeDetailsTable, createFranchiseProductsTable, createChefFoodTable, createSubscriptionPlansTable } = require('./src/config/migrations');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/superadmin', superadminRouter);
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

initDb().then(async () => {
  try {
    await createProductsTable();
    await createFranchiseProductsTable();
    await createChefFoodTable();
    await createSubscriptionPlansTable();
    await createReviewsTable();
  } catch (err) {
    console.error('Migration error:', err.message || err);
  }

  try {
    await createRecipeDetailsTable();
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
}).catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
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