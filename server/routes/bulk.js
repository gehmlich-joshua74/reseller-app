const express = require('express');
const router = express.Router();
const pool = require('../db');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const stream = require('stream');

// 1. EXPORT: Download all items as CSV
// 1. EXPORT: Download all items and their listings as CSV
router.get('/export', async (req, res) => {
  try {
    // We JOIN the tables so we can see listing details (price, platform, floor, date)
    const result = await pool.query(`
      SELECT 
        i.id, i.name, i.category, i.status, i.cost, i.location, i.quantity, i.brand, i.model, i.sku, i.notes,
        l.platform, l.asking_price, l.offers_enabled, l.min_offer_amount, l.expiration_days, l.listed_at
      FROM items i 
      LEFT JOIN listings l ON i.id = l.item_id
      ORDER BY i.created_at DESC
    `);

    const fields = [
      'id', 'name', 'category', 'status', 'cost', 'location', 'quantity', 'brand', 'model', 'sku', 'notes',
      'platform', 'asking_price', 'offers_enabled', 'min_offer_amount', 'expiration_days', 'listed_at'
    ];
    
    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_bulk_edit.csv');
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. IMPORT: Upload CSV and update items (Bulk Edit)
// IMPORT: Upload CSV to update existing items OR add new ones
router.post('/import', express.text(), async (req, res) => {
  const results = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.body);

  bufferStream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        let updatedCount = 0;
        let createdCount = 0;

        for (const row of results) {
          if (row.id && row.id.trim() !== "") {
            // OPTION A: Update existing item
            await pool.query(
              `UPDATE items SET 
                name=$1, category=$2, status=$3, cost=$4, location=$5, 
                quantity=$6, brand=$7, model=$8, sku=$9, notes=$10, updated_at=now()
               WHERE id=$11`,
              [row.name, row.category, row.status, row.cost, row.location, 
               row.quantity, row.brand, row.model, row.sku, row.notes, row.id]
            );
            updatedCount++;
          } else {
            // OPTION B: Create new item (No ID provided)
            await pool.query(
              `INSERT INTO items (
                name, category, status, cost, location, 
                quantity, brand, model, sku, notes, added_by
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                row.name, 
                row.category || 'Other', 
                row.status || 'at_home', 
                row.cost || 0, 
                row.location || '', 
                row.quantity || 1, 
                row.brand || '', 
                row.model || '', 
                row.sku || '', 
                row.notes || '',
                '6e9219cc-fc42-4511-be63-98536283cc50' // Your default User ID
              ]
            );
            createdCount++;
          }
        }
        res.json({ 
          success: true, 
          message: `Process complete: Updated ${updatedCount} items and added ${createdCount} new items.` 
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database update failed. Check your CSV columns." });
      }
    });
});

module.exports = router;