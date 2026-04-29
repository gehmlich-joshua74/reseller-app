const express = require('express');
const cors = require('cors');
const pool = require('./db');
const itemsRouter = require('./routes/items');
const listingsRouter = require('./routes/listings');
const analyticsRouter = require('./routes/analytics');
const backupRouter = require('./routes/backup');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/items', itemsRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/backup', backupRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Reseller API is running' });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});