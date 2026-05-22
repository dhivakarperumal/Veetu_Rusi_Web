const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const authRouter = require('./src/routes/auth');
const superadminRouter = require('./src/routes/superadmin');
const dashboardRouter = require('./src/routes/dashboard');
const productsRouter = require('./src/routes/products');
const { createProductsTable } = require('./src/config/migrations');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/products', productsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const startServer = async () => {
  try {
    await createProductsTable();
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
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
};

startServer();
