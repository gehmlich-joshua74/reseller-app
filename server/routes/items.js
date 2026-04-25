const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, 
        l.listed_at, 
        l.platform,
        l.asking_price,
        l.sale_price,
        l.platform_fees,
        l.shipping_costs
      FROM items i
      LEFT JOIN listings l ON l.item_id = i.id
      ORDER BY i.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new item
router.post('/', async (req, res) => {
  try {
    const { added_by, name, description, category, cost, location } = req.body;
    const result = await pool.query(
      `INSERT INTO items (added_by, name, description, category, cost, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [added_by, name, description, category, cost, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update item status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE items SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM listings WHERE item_id = $1', [id]);
    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH edit an item
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, cost, location } = req.body;
    const result = await pool.query(
      `UPDATE items SET name=$1, description=$2, category=$3, cost=$4, location=$5 WHERE id=$6 RETURNING *`,
      [name, description, category, cost, location, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH revert item status
router.patch('/:id/revert', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await pool.query('SELECT status FROM items WHERE id = $1', [id]);
    const currentStatus = item.rows[0].status;

    if (currentStatus === 'sold') {
      await pool.query(
        `UPDATE listings SET sold_at = NULL, sale_price = NULL, platform_fees = NULL, shipping_costs = NULL WHERE item_id = $1`,
        [id]
      );
      await pool.query(`UPDATE items SET status = 'listed' WHERE id = $1`, [id]);
    } else if (currentStatus === 'listed') {
      await pool.query(`DELETE FROM listings WHERE item_id = $1`, [id]);
      await pool.query(`UPDATE items SET status = 'at_home' WHERE id = $1`, [id]);
    }

    const updated = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;