const db = require('../config/db');
const { sendSuccess } = require('../utils/response');

/**
 * Public Market Controller
 */

/**
 * Get public market price history and benchmarks
 * GET /api/v1/market/price-history
 */
const getPriceHistory = async (req, res, next) => {
  try {
    // 1. Average sold prices grouped by team strength tier
    const [strengthBenchmark] = await db.query(
      `SELECT 
         CASE 
           WHEN l.team_strength >= 3150 THEN '3150+'
           WHEN l.team_strength >= 3100 THEN '3100-3149'
           WHEN l.team_strength >= 3050 THEN '3050-3099'
           ELSE '<3050'
         END AS strength_tier,
         COUNT(*) AS sales_count,
         AVG(o.amount) AS avg_sold_price,
         MIN(o.amount) AS min_sold_price,
         MAX(o.amount) AS max_sold_price
       FROM orders o
       JOIN account_listings l ON o.listing_id = l.id
       WHERE o.status = 'COMPLETED'
       GROUP BY strength_tier
       ORDER BY strength_tier DESC`
    );

    // 2. Recent sold market transactions (sanitized: no user identity exposed)
    const [recentSales] = await db.query(
      `SELECT o.id AS transaction_id,
              l.title AS listing_title,
              l.team_strength,
              p.name AS platform_name,
              g.name AS game_name,
              o.amount AS sold_price,
              o.completed_at
       FROM orders o
       JOIN account_listings l ON o.listing_id = l.id
       JOIN platforms p ON l.platform_id = p.id
       JOIN games g ON l.game_id = g.id
       WHERE o.status = 'COMPLETED'
       ORDER BY o.completed_at DESC
       LIMIT 15`
    );

    return sendSuccess(
      res,
      {
        avg_price_by_strength: strengthBenchmark.map((item) => ({
          ...item,
          avg_sold_price: Number(Number(item.avg_sold_price).toFixed(2)),
          min_sold_price: Number(item.min_sold_price),
          max_sold_price: Number(item.max_sold_price),
        })),
        recent_sales: recentSales.map((s) => ({
          ...s,
          sold_price: Number(s.sold_price),
        })),
      },
      'Public market price history retrieved'
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getPriceHistory,
};
