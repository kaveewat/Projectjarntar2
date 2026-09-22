const db = require('../../config/db');
const { sendSuccess } = require('../../utils/response');

/**
 * Admin Analytics & Executive Dashboard Controller
 */

/**
 * Get Admin Overview Metrics
 * GET /api/v1/admin/dashboard
 */
const getAdminOverview = async (req, res, next) => {
  try {
    // 1. Active listings count
    const [listingsRows] = await db.query(
      `SELECT COUNT(*) AS count FROM account_listings WHERE status = 'ACTIVE'`
    );

    // 2. Pending payment reviews count
    const [pendingPaymentRows] = await db.query(
      `SELECT COUNT(*) AS count FROM orders WHERE status = 'PAYMENT_SUBMITTED'`
    );

    // 3. Open disputes count
    const [disputesRows] = await db.query(
      `SELECT COUNT(*) AS count FROM disputes WHERE status IN ('OPEN', 'UNDER_REVIEW')`
    );

    // 4. Pending KYC verification count
    const [kycRows] = await db.query(
      `SELECT COUNT(*) AS count FROM users WHERE role = 'SELLER' AND is_verified = 0`
    );

    // 5. Financial metrics (Today & MTD & All-time)
    const [todayFinancials] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS gmv_today,
              COALESCE(SUM(platform_fee), 0) AS revenue_today,
              COUNT(*) AS orders_today
       FROM orders
       WHERE status = 'COMPLETED' AND DATE(completed_at) = CURDATE()`
    );

    const [mtdFinancials] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS gmv_mtd,
              COALESCE(SUM(platform_fee), 0) AS revenue_mtd,
              COUNT(*) AS orders_mtd
       FROM orders
       WHERE status = 'COMPLETED'
         AND MONTH(completed_at) = MONTH(CURDATE())
         AND YEAR(completed_at) = YEAR(CURDATE())`
    );

    const [allTimeFinancials] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_gmv,
              COALESCE(SUM(platform_fee), 0) AS total_revenue,
              COUNT(*) AS completed_orders
       FROM orders
       WHERE status = 'COMPLETED'`
    );

    // 6. Total users count
    const [usersRows] = await db.query(
      `SELECT COUNT(*) AS count FROM users WHERE is_banned = 0`
    );

    // 7. Total escrow held
    const [escrowRows] = await db.query(
      `SELECT COALESCE(SUM(amount_held), 0) AS total_escrow_held, COUNT(*) AS held_count
       FROM escrow_records
       WHERE status IN ('HELD', 'FROZEN')`
    );

    return sendSuccess(
      res,
      {
        total_active_listings: listingsRows[0].count,
        pending_payments: pendingPaymentRows[0].count,
        open_disputes: disputesRows[0].count,
        pending_kyc: kycRows[0].count,
        total_gmv: Number(allTimeFinancials[0].total_gmv),
        total_revenue: Number(allTimeFinancials[0].total_revenue),
        completed_orders: Number(allTimeFinancials[0].completed_orders),
        escrow_held: Number(escrowRows[0].total_escrow_held),
        total_escrow_held: Number(escrowRows[0].total_escrow_held),
        revenue_today: Number(todayFinancials[0].revenue_today),
        revenue_mtd: Number(mtdFinancials[0].revenue_mtd),
        gmv_today: Number(todayFinancials[0].gmv_today),
        gmv_mtd: Number(mtdFinancials[0].gmv_mtd),
        orders_today: todayFinancials[0].orders_today,
        orders_mtd: mtdFinancials[0].orders_mtd,
        total_users: usersRows[0].count,
      },
      'Admin overview metrics retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Admin Pending Actions Queue (Priority list needing human action)
 * GET /api/v1/admin/dashboard/pending-actions
 */
const getAdminPendingActions = async (req, res, next) => {
  try {
    // 1. Payments pending verification
    const [pendingPayments] = await db.query(
      `SELECT o.id AS order_id, o.order_number, o.amount, o.payment_deadline,
              u_buyer.display_name AS buyer_name, u_buyer.email AS buyer_email,
              p.slip_image_url, p.submitted_at AS payment_submitted_at
       FROM orders o
       JOIN users u_buyer ON o.buyer_id = u_buyer.id
       LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'PENDING'
       WHERE o.status = 'PAYMENT_SUBMITTED'
       ORDER BY p.submitted_at ASC
       LIMIT 20`
    );

    // 2. Open disputes requiring review/resolution
    const [openDisputes] = await db.query(
      `SELECT d.id AS dispute_id, d.order_id, d.status, d.opened_at, d.sla_deadline,
              dr.code AS reason_code, dr.description_th AS reason_title,
              o.order_number, o.amount,
              u.display_name AS opened_by_name
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
       JOIN users u ON d.opened_by = u.id
       WHERE d.status IN ('OPEN', 'UNDER_REVIEW')
       ORDER BY d.sla_deadline ASC
       LIMIT 20`
    );

    return sendSuccess(
      res,
      {
        payments_pending: pendingPayments,
        payments_pending_count: pendingPayments.length,
        disputes_open: openDisputes,
        disputes_open_count: openDisputes.length,
        kyc_pending: [],
        kyc_pending_count: 0,
      },
      'Admin pending actions queue retrieved'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Sales Analytics
 * GET /api/v1/admin/analytics/sales
 */
const getSalesAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const conditions = ["status = 'COMPLETED'"];
    const params = [];

    if (from) {
      conditions.push('completed_at >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('completed_at <= ?');
      params.push(to);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total totals
    const [totalRows] = await db.query(
      `SELECT COUNT(*) AS total_orders,
              COALESCE(SUM(amount), 0) AS total_volume,
              COALESCE(SUM(platform_fee), 0) AS platform_revenue,
              COALESCE(AVG(amount), 0) AS avg_order_value
       FROM orders ${whereClause}`,
      params
    );

    // Group by date (last 30 days)
    const [timelineRows] = await db.query(
      `SELECT DATE(completed_at) AS date,
              COUNT(*) AS orders_count,
              COALESCE(SUM(amount), 0) AS volume,
              COALESCE(SUM(platform_fee), 0) AS revenue
       FROM orders
       ${whereClause}
       GROUP BY DATE(completed_at)
       ORDER BY date ASC
       LIMIT 30`,
      params
    );

    return sendSuccess(
      res,
      {
        total_orders: totalRows[0].total_orders,
        total_volume: Number(totalRows[0].total_volume),
        platform_revenue: Number(totalRows[0].platform_revenue),
        avg_order_value: Number(Number(totalRows[0].avg_order_value).toFixed(2)),
        timeline: timelineRows.map((r) => ({
          ...r,
          volume: Number(r.volume),
          revenue: Number(r.revenue),
        })),
      },
      'Sales analytics retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Listings Analytics
 * GET /api/v1/admin/analytics/listings
 */
const getListingsAnalytics = async (req, res, next) => {
  try {
    const [statusCounts] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM account_listings
       GROUP BY status`
    );

    const countsMap = {
      ACTIVE: 0,
      RESERVED: 0,
      SOLD: 0,
      CANCELLED: 0,
      SUSPENDED: 0,
    };
    statusCounts.forEach((r) => {
      countsMap[r.status] = r.count;
    });

    const [avgPriceRow] = await db.query(
      `SELECT AVG(asking_price) AS avg_price, MIN(asking_price) AS min_price, MAX(asking_price) AS max_price
       FROM account_listings
       WHERE status = 'ACTIVE'`
    );

    return sendSuccess(
      res,
      {
        status_breakdown: countsMap,
        active_count: countsMap.ACTIVE,
        sold_count: countsMap.SOLD,
        reserved_count: countsMap.RESERVED,
        cancelled_count: countsMap.CANCELLED,
        suspended_count: countsMap.SUSPENDED,
        pricing: {
          avg_price: Number(Number(avgPriceRow[0].avg_price || 0).toFixed(2)),
          min_price: Number(avgPriceRow[0].min_price || 0),
          max_price: Number(avgPriceRow[0].max_price || 0),
        },
      },
      'Listings analytics retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Disputes Analytics
 * GET /api/v1/admin/analytics/disputes
 */
const getDisputesAnalytics = async (req, res, next) => {
  try {
    const [statusRows] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM disputes
       GROUP BY status`
    );

    const breakdown = {
      OPEN: 0,
      UNDER_REVIEW: 0,
      RESOLVED_BUYER: 0,
      RESOLVED_SELLER: 0,
      CANCELLED: 0,
    };

    let total = 0;
    statusRows.forEach((r) => {
      breakdown[r.status] = r.count;
      total += r.count;
    });

    // Reasons breakdown
    const [reasonRows] = await db.query(
      `SELECT dr.code, dr.description_th, COUNT(d.id) AS count
       FROM disputes d
       JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
       GROUP BY dr.id, dr.code, dr.description_th
       ORDER BY count DESC`
    );

    return sendSuccess(
      res,
      {
        total_disputes: total,
        status_breakdown: breakdown,
        reasons_breakdown: reasonRows,
      },
      'Disputes analytics retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Prices & Valuation Analytics
 * GET /api/v1/admin/analytics/prices
 */
const getPricesAnalytics = async (req, res, next) => {
  try {
    const [priceComp] = await db.query(
      `SELECT AVG(l.asking_price) AS avg_listing_price,
              AVG(v.fair_price_min) AS avg_fair_min,
              AVG(v.fair_price_max) AS avg_fair_max,
              COUNT(*) AS sample_size
       FROM account_listings l
       JOIN valuations v ON l.squad_scan_id = v.scan_id
       WHERE l.status IN ('ACTIVE', 'SOLD')`
    );

    const [strengthTiers] = await db.query(
      `SELECT 
         CASE 
           WHEN team_strength >= 3150 THEN '3150+'
           WHEN team_strength >= 3100 THEN '3100-3149'
           WHEN team_strength >= 3050 THEN '3050-3099'
           ELSE '<3050'
         END AS strength_tier,
         COUNT(*) AS count,
         AVG(asking_price) AS avg_price
       FROM account_listings
       WHERE team_strength IS NOT NULL
       GROUP BY strength_tier
       ORDER BY strength_tier DESC`
    );

    return sendSuccess(
      res,
      {
        valuation_comparison: {
          avg_listing_price: Number(Number(priceComp[0]?.avg_listing_price || 0).toFixed(2)),
          avg_fair_min: Number(Number(priceComp[0]?.avg_fair_min || 0).toFixed(2)),
          avg_fair_max: Number(Number(priceComp[0]?.avg_fair_max || 0).toFixed(2)),
          sample_size: priceComp[0]?.sample_size || 0,
        },
        pricing_by_strength: strengthTiers.map((s) => ({
          ...s,
          avg_price: Number(Number(s.avg_price).toFixed(2)),
        })),
      },
      'Price analytics retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get AI Squad Scan Accuracy Analytics
 * GET /api/v1/admin/analytics/ai-accuracy
 */
const getAiAccuracyAnalytics = async (req, res, next) => {
  try {
    const [scanRows] = await db.query(
      `SELECT 
         COUNT(*) AS total_scans,
         SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_scans,
         SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_scans,
         SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) AS processing_scans
       FROM squad_scans`
    );

    const total = scanRows[0].total_scans || 0;
    const completed = scanRows[0].completed_scans || 0;
    const successRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 100;

    return sendSuccess(
      res,
      {
        total_scans: total,
        completed_scans: completed,
        failed_scans: scanRows[0].failed_scans || 0,
        processing_scans: scanRows[0].processing_scans || 0,
        scan_success_rate: successRate,
      },
      'AI accuracy analytics retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAdminOverview,
  getAdminPendingActions,
  getSalesAnalytics,
  getListingsAnalytics,
  getDisputesAnalytics,
  getPricesAnalytics,
  getAiAccuracyAnalytics,
};
