const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET full backup
router.get('/', async (req, res) => {
  try {
    const users = await pool.query('SELECT * FROM users');
    const items = await pool.query('SELECT * FROM items');
    const listings = await pool.query('SELECT * FROM listings');

    const backup = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: {
        users: users.rows,
        items: items.rows,
        listings: listings.rows
      }
    };

    res.setHeader('Content-Disposition', `attachment; filename=reseller-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST restore from backup
router.post('/restore', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.users || !data.items || !data.listings) {
      return res.status(400).json({ error: 'Invalid backup file format.' });
    }

    // Wipe existing data in correct order
    await pool.query('DELETE FROM listings');
    await pool.query('DELETE FROM items');
    await pool.query('DELETE FROM users');

    // Restore users
    for (const user of data.users) {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.name, user.email, user.password_hash, user.created_at]
      );
    }

    // Restore items
    for (const item of data.items) {
      await pool.query(
        `INSERT INTO items (id, added_by, name, description, category, status, cost, location, photos_ready, created_at, updated_at, quantity, brand, model, dimensions, color, condition, sku, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.added_by, item.name, item.description, item.category, item.status, item.cost, item.location, item.photos_ready, item.created_at, item.updated_at, item.quantity, item.brand, item.model, item.dimensions, item.color, item.condition, item.sku, item.notes]
      );
    }

    // Restore listings
    // Restore listings
    for (const listing of data.listings) {
      await pool.query(
        `INSERT INTO listings (
          id, item_id, platform, asking_price, listed_at, 
          sold_at, sale_price, platform_fees, shipping_costs, 
          listing_url, tracking_url, offers_enabled, min_offer_amount, expiration_days
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [
          listing.id, 
          listing.item_id, 
          listing.platform, 
          listing.asking_price, 
          listing.listed_at || new Date(), // Prevents the -1 date issue
          listing.sold_at, 
          listing.sale_price, 
          listing.platform_fees, 
          listing.shipping_costs, 
          listing.listing_url, 
          listing.tracking_url,
          listing.offers_enabled || false,
          listing.min_offer_amount || null,
          listing.expiration_days || 30
        ]
      );
    }

    res.json({ success: true, message: 'Database restored successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;