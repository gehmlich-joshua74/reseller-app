const express = require('express');
const router = express.Router();
const pool = require('../db');

const PLATFORM_EXPIRY_DAYS = {
  'eBay': 30,
  'Facebook Marketplace': 7,
  'OfferUp': 30,
  'Mercari': 60,
  'Poshmark': 60,
};

router.get('/', async (req, res) => {
  try {
    // Overall financials
    const financials = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE i.status = 'sold') as total_sold,
        COALESCE(SUM(l.sale_price) FILTER (WHERE i.status = 'sold'), 0) as gross_income,
        COALESCE(SUM(i.cost) FILTER (WHERE i.status = 'sold'), 0) as total_cost,
        COALESCE(SUM(l.platform_fees) FILTER (WHERE i.status = 'sold'), 0) as total_fees,
        COALESCE(SUM(l.shipping_costs) FILTER (WHERE i.status = 'sold'), 0) as total_shipping,
        COALESCE(SUM(l.sale_price - i.cost - COALESCE(l.platform_fees,0) - COALESCE(l.shipping_costs,0)) FILTER (WHERE i.status = 'sold'), 0) as net_profit
      FROM items i
      LEFT JOIN listings l ON l.item_id = i.id
    `);

    // By marketplace — listed counts
    const byMarketplaceListed = await pool.query(`
      SELECT platform, COUNT(*) as listed_count
      FROM listings
      WHERE sold_at IS NULL
      GROUP BY platform
      ORDER BY listed_count DESC
    `);

    // By marketplace — financials
    const byMarketplaceFinancials = await pool.query(`
      SELECT
        l.platform,
        COUNT(*) as total_sold,
        COALESCE(SUM(l.sale_price), 0) as gross_income,
        COALESCE(SUM(i.cost), 0) as total_cost,
        COALESCE(SUM(l.platform_fees), 0) as total_fees,
        COALESCE(SUM(l.shipping_costs), 0) as total_shipping,
        COALESCE(SUM(l.sale_price - i.cost - COALESCE(l.platform_fees,0) - COALESCE(l.shipping_costs,0)), 0) as net_profit
      FROM listings l
      JOIN items i ON i.id = l.item_id
      WHERE l.sold_at IS NOT NULL
      GROUP BY l.platform
      ORDER BY net_profit DESC
    `);

    // By category
    const byCategory = await pool.query(`
      SELECT
        i.category,
        COUNT(*) FILTER (WHERE i.status = 'sold') as total_sold,
        COUNT(*) FILTER (WHERE i.status = 'listed') as total_listed,
        COUNT(*) FILTER (WHERE i.status = 'at_home') as total_at_home,
        COALESCE(SUM(l.sale_price - i.cost - COALESCE(l.platform_fees,0) - COALESCE(l.shipping_costs,0)) FILTER (WHERE i.status = 'sold'), 0) as net_profit
      FROM items i
      LEFT JOIN listings l ON l.item_id = i.id
      GROUP BY i.category
      ORDER BY total_sold DESC
    `);

    // Returns
    const returns = await pool.query(`
      SELECT
        l.platform,
        i.category,
        COUNT(*) as return_count
      FROM listings l
      JOIN items i ON i.id = l.item_id
      WHERE l.sold_at IS NULL AND l.listed_at < now() - interval '90 days'
      GROUP BY l.platform, i.category
      ORDER BY return_count DESC
    `);

    // Expiring listings
    const activeListing = await pool.query(`
      SELECT i.name, i.category, l.platform, l.listed_at, l.asking_price, l.id as listing_id
      FROM listings l
      JOIN items i ON i.id = l.item_id
      WHERE l.sold_at IS NULL
      ORDER BY l.listed_at ASC
    `);

    const expiring = activeListing.rows.map(listing => {
      const days = PLATFORM_EXPIRY_DAYS[listing.platform] || 30;
      const listedAt = new Date(listing.listed_at);
      const expiresAt = new Date(listedAt.getTime() + days * 24 * 60 * 60 * 1000);
      const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      return { ...listing, expires_at: expiresAt, days_left: daysLeft };
    }).sort((a, b) => a.days_left - b.days_left);

    res.json({
      financials: financials.rows[0],
      byMarketplaceListed: byMarketplaceListed.rows,
      byMarketplaceFinancials: byMarketplaceFinancials.rows,
      byCategory: byCategory.rows,
      returns: returns.rows,
      expiring
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;