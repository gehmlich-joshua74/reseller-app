const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all listings for an item
router.get('/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM listings WHERE item_id = $1 ORDER BY listed_at DESC',
      [item_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new listing
router.post('/', async (req, res) => {
  try {
    const { item_id, platform, asking_price, listing_url } = req.body;
    const result = await pool.query(
      `INSERT INTO listings (item_id, platform, asking_price, listing_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [item_id, platform, asking_price, listing_url]
    );
    // update item status to listed
    await pool.query(
      'UPDATE items SET status = $1 WHERE id = $2',
      ['listed', item_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark a listing as sold
router.patch('/:id/sold', async (req, res) => {
  try {
    const { id } = req.params;
    const { sale_price, platform_fees, shipping_costs, item_id, tracking_url } = req.body;
    const result = await pool.query(
      `UPDATE listings 
       SET sold_at = now(), sale_price = $1, platform_fees = $2, shipping_costs = $3, tracking_url = $4
       WHERE id = $5
       RETURNING *`,
      [sale_price, platform_fees, shipping_costs, tracking_url, id]
    );
    // update item status to sold
    await pool.query(
      'UPDATE items SET status = $1 WHERE id = $2',
      ['sold', item_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a listing
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await pool.query('SELECT item_id FROM listings WHERE id = $1', [id]);
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
    await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['at_home', listing.rows[0].item_id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;