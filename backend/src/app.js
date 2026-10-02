const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'conectada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', database: 'sin conexión' });
  }
});

app.use('/api/auth', require('./routes/auth.routes')); app.use('/api/users', require('./routes/user.routes')); app.use('/api/categories', require('./routes/category.routes'));

module.exports = app;