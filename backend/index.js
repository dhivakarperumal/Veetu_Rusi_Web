const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const authRouter = require('./src/routes/auth');
const superadminRouter = require('./src/routes/superadmin');
const dashboardRouter = require('./src/routes/dashboard');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
