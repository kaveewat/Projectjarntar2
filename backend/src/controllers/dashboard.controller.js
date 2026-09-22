const db = require('../config/db');
const { sendSuccess } = require('../utils/response');

/**
 * User Dashboard Controller (Buyer & Seller)
 */

/**
 * Get Buyer Dashboard Summary
 * GET /api/v1/dashboard/buyer
 */
const getBuyerDashboard = async (req, res, next) => {
  try {
    const buyerId = req.user.id;

    // 1. Active orders (in progress)
    const [activeOrders] = await db.query(
      `SELECT o.*, l.title AS listing_title, l.asking_price AS listing_price,
              p.name AS platform_name, g.name AS game_name,
              er.status AS escrow_status
       FROM orders o
       JOIN account_listings l ON o.listing_id = l.id
       JOIN platforms p ON l.platform_id = p.id
       JOIN games g ON l.game_id = g.id
       LEFT JOIN escrow_records er ON o.id = er.order_id
       WHERE o.buyer_id = ?
         AND o.status IN ('CREATED', 'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'HANDOVER_OPEN', 'HANDOVER_INFO_PROVIDED', 'BUYER_REVIEWING', 'DISPUTED')
       ORDER BY o.created_at DESC`,
      [buyerId]
    );

    // 2. Completed orders count & total spent
    const [completedRows] = await db.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total_spent
       FROM orders
       WHERE buyer_id = ? AND status = 'COMPLETED'`,
      [buyerId]
    );

    // 3. Pending disputes count
    const [disputeRows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM disputes
       WHERE opened_by = ? AND status IN ('OPEN', 'UNDER_REVIEW')`,
      [buyerId]
    );

    // 4. Recent completed orders
    const [recentCompleted] = await db.query(
      `SELECT o.id, o.order_number, o.amount, o.completed_at, l.title AS listing_title
       FROM orders o
       JOIN account_listings l ON o.listing_id = l.id
       WHERE o.buyer_id = ? AND o.status = 'COMPLETED'
       ORDER BY o.completed_at DESC
       LIMIT 5`,
      [buyerId]
    );

    return sendSuccess(
      res,
      {
        active_orders: activeOrders,
        active_orders_count: activeOrders.length,
        completed_orders_count: completedRows[0].count,
        total_spent: Number(completedRows[0].total_spent),
        pending_disputes_count: disputeRows[0].count,
        recent_completed: recentCompleted,
      },
      'Buyer dashboard retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Seller Dashboard Summary
 * GET /api/v1/dashboard/seller
 */
const getSellerDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // 1. Active listings
    const [activeListings] = await db.query(
      `SELECT l.*, l.asking_price AS price, p.name AS platform_name, g.name AS game_name
       FROM account_listings l
       JOIN platforms p ON l.platform_id = p.id
       JOIN games g ON l.game_id = g.id
       WHERE l.seller_id = ? AND l.status = 'ACTIVE'
       ORDER BY l.created_at DESC
       LIMIT 10`,
      [sellerId]
    );

    const [activeCountRows] = await db.query(
      `SELECT COUNT(*) AS count FROM account_listings WHERE seller_id = ? AND status = 'ACTIVE'`,
      [sellerId]
    );

    // 2. Orders awaiting seller handover / review
    const [pendingOrders] = await db.query(
      `SELECT o.*, l.title AS listing_title, l.asking_price AS listing_price,
              u.display_name AS buyer_name, er.status AS escrow_status
       FROM orders o
       JOIN account_listings l ON o.listing_id = l.id
       JOIN users u ON o.buyer_id = u.id
       LEFT JOIN escrow_records er ON o.id = er.order_id
       WHERE o.seller_id = ?
         AND o.status IN ('PAYMENT_APPROVED', 'HANDOVER_OPEN', 'HANDOVER_INFO_PROVIDED', 'BUYER_REVIEWING')
       ORDER BY o.created_at DESC`,
      [sellerId]
    );

    // 3. Financial overview
    const [earnedRows] = await db.query(
      `SELECT COALESCE(SUM(seller_payout), 0) AS total_earned, COUNT(*) AS count
       FROM orders
       WHERE seller_id = ? AND status = 'COMPLETED'`,
      [sellerId]
    );

    const [pendingPayoutRows] = await db.query(
      `SELECT COALESCE(SUM(seller_payout), 0) AS pending_payout
       FROM orders
       WHERE seller_id = ?
         AND status IN ('PAYMENT_APPROVED', 'HANDOVER_OPEN', 'HANDOVER_INFO_PROVIDED', 'BUYER_REVIEWING')`,
      [sellerId]
    );

    // 4. Disputes count on seller's listings
    const [disputeRows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       WHERE o.seller_id = ? AND d.status IN ('OPEN', 'UNDER_REVIEW')`,
      [sellerId]
    );

    return sendSuccess(
      res,
      {
        active_listings: activeListings,
        active_listings_count: activeCountRows[0].count,
        pending_orders: pendingOrders,
        pending_orders_count: pendingOrders.length,
        total_earned: Number(earnedRows[0].total_earned),
        completed_sales_count: earnedRows[0].count,
        pending_payout: Number(pendingPayoutRows[0].pending_payout),
        dispute_count: disputeRows[0].count,
      },
      'Seller dashboard retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getBuyerDashboard,
  getSellerDashboard,
};
