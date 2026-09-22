const db = require('../config/db');
const orderLogModel = require('./order-status-log.model');
const { AppError } = require('../middleware/errorHandler');

/**
 * Account Order Model with Race Condition Protection
 */

/**
 * Generate unique order number: ORD-YYYYMMDD-XXXXX
 */
const generateOrderNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${dateStr}-${rand}`;
};

/**
 * Create order and atomically reserve the listing
 * @param {object} param0
 */
const createOrder = async ({ listingId, buyerId }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock listing row with FOR UPDATE to prevent race conditions
    const [listings] = await conn.query(
      `SELECT * FROM account_listings WHERE id = ? FOR UPDATE`,
      [listingId]
    );

    if (!listings || listings.length === 0) {
      throw new AppError(`Listing with ID ${listingId} not found`, 404, 'NOT_FOUND');
    }

    const listing = listings[0];

    // 2. Rule 7.9: Cannot buy own listing
    if (listing.seller_id === buyerId) {
      throw new AppError('Cannot buy your own listing.', 422, 'CANNOT_BUY_OWN_LISTING');
    }

    // 3. Race condition check: Listing must be ACTIVE and not soft-deleted
    if (listing.status !== 'ACTIVE' || listing.deleted_at !== null) {
      throw new AppError(
        `Listing is not available for purchase (current status: ${listing.status}).`,
        409,
        'LISTING_ALREADY_RESERVED'
      );
    }

    // 4. Read platform fee rate
    const [feeRows] = await conn.query(
      `SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_rate' LIMIT 1`
    );
    const feeRate = feeRows && feeRows.length > 0 ? Number(feeRows[0].setting_value) : 0.05;

    const amount = Number(listing.asking_price);
    const platformFee = Math.round(amount * feeRate * 100) / 100;
    const sellerPayout = Math.round((amount - platformFee) * 100) / 100;
    const orderNumber = generateOrderNumber();

    // 5. Insert order in CREATED state with 2-hour payment deadline
    const insertOrderSql = `
      INSERT INTO orders (
        order_number, listing_id, buyer_id, seller_id, amount, platform_fee,
        seller_payout, fee_rate, status, payment_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', DATE_ADD(NOW(), INTERVAL 2 HOUR))
    `;
    const [orderResult] = await conn.query(insertOrderSql, [
      orderNumber,
      listingId,
      buyerId,
      listing.seller_id,
      amount,
      platformFee,
      sellerPayout,
      feeRate,
    ]);

    const orderId = orderResult.insertId;

    // 6. Transition listing to RESERVED
    await conn.query(
      `UPDATE account_listings SET status = 'RESERVED', updated_at = NOW() WHERE id = ?`,
      [listingId]
    );

    // 7. Append-only order status log
    await orderLogModel.logStatusChange({
      connection: conn,
      orderId,
      fromStatus: null,
      toStatus: 'CREATED',
      changedBy: buyerId,
      note: 'Order created by buyer',
    });

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Find order by ID with all details (buyer, seller, listing, payment, escrow)
 * @param {number} id
 * @param {object} connection
 */
const findById = async (id, connection = null) => {
  const client = connection || db;
  const sql = `
    SELECT o.*,
           b.display_name AS buyer_name, b.email AS buyer_email,
           s.display_name AS seller_name, s.email AS seller_email,
           l.title AS listing_title, l.asking_price AS listing_price,
           p.name AS platform_name
    FROM orders o
    LEFT JOIN users b ON o.buyer_id = b.id
    LEFT JOIN users s ON o.seller_id = s.id
    LEFT JOIN account_listings l ON o.listing_id = l.id
    LEFT JOIN platforms p ON l.platform_id = p.id
    WHERE o.id = ?
    LIMIT 1
  `;
  const [rows] = await client.query(sql, [id]);
  if (!rows || rows.length === 0) return null;

  const order = rows[0];
  order.amount = Number(order.amount);
  order.platform_fee = Number(order.platform_fee);
  order.seller_payout = Number(order.seller_payout);
  order.fee_rate = Number(order.fee_rate);

  // Fetch payment if exists
  const [payments] = await client.query(
    `SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
    [id]
  );
  order.payment = payments && payments.length > 0 ? {
    ...payments[0],
    amount: Number(payments[0].amount),
  } : null;

  // Fetch escrow if exists
  const [escrows] = await client.query(
    `SELECT * FROM escrow_records WHERE order_id = ? LIMIT 1`,
    [id]
  );
  order.escrow = escrows && escrows.length > 0 ? {
    ...escrows[0],
    amount_held: Number(escrows[0].amount_held),
    platform_fee: Number(escrows[0].platform_fee),
    seller_payout: Number(escrows[0].seller_payout),
  } : null;

  return order;
};

/**
 * Find orders with filters and pagination
 * @param {object} param0
 */
const findAll = async ({
  buyerId = null,
  sellerId = null,
  status = null,
  limit = 20,
  offset = 0,
}) => {
  const conditions = [];
  const params = [];

  if (buyerId && sellerId) {
    conditions.push('(o.buyer_id = ? OR o.seller_id = ?)');
    params.push(buyerId, sellerId);
  } else if (buyerId) {
    conditions.push('o.buyer_id = ?');
    params.push(buyerId);
  } else if (sellerId) {
    conditions.push('o.seller_id = ?');
    params.push(sellerId);
  }

  if (status && status !== 'ALL') {
    conditions.push('o.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM orders o ${whereClause}`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0] ? countRows[0].total : 0;

  const queryParams = [...params, Number(limit), Number(offset)];
  const dataSql = `
    SELECT o.*,
           b.display_name AS buyer_name,
           s.display_name AS seller_name,
           l.title AS listing_title,
           p.name AS platform_name
    FROM orders o
    LEFT JOIN users b ON o.buyer_id = b.id
    LEFT JOIN users s ON o.seller_id = s.id
    LEFT JOIN account_listings l ON o.listing_id = l.id
    LEFT JOIN platforms p ON l.platform_id = p.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(dataSql, queryParams);

  return {
    orders: rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      platform_fee: Number(r.platform_fee),
      seller_payout: Number(r.seller_payout),
      fee_rate: Number(r.fee_rate),
    })),
    total,
  };
};

/**
 * Buyer cancels order (only allowed in CREATED or PENDING_PAYMENT)
 * @param {object} param0
 */
const cancelOrder = async ({ orderId, cancelledBy, reason = 'Cancelled by buyer' }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
    if (!orders || orders.length === 0) {
      throw new AppError(`Order with ID ${orderId} not found`, 404, 'NOT_FOUND');
    }

    const order = orders[0];
    const allowed = ['CREATED', 'PENDING_PAYMENT'];
    if (!allowed.includes(order.status)) {
      throw new AppError(
        `Cannot cancel order: Current status is '${order.status}'. Only CREATED or PENDING_PAYMENT orders can be cancelled.`,
        422,
        'ORDER_WRONG_STATUS'
      );
    }

    // 1. Update order
    await conn.query(
      `UPDATE orders 
       SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_by = ?, cancel_reason = ? 
       WHERE id = ?`,
      [cancelledBy, reason, orderId]
    );

    // 2. Relist listing back to ACTIVE
    await conn.query(
      `UPDATE account_listings SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?`,
      [order.listing_id]
    );

    // 3. Append-only status log
    await orderLogModel.logStatusChange({
      connection: conn,
      orderId,
      fromStatus: order.status,
      toStatus: 'CANCELLED',
      changedBy: cancelledBy,
      note: reason,
    });

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Update order status with logging
 * @param {object} param0
 */
const updateStatus = async ({
  connection = null,
  orderId,
  newStatus,
  changedBy = null,
  note = null,
  extraFields = {},
}) => {
  const client = connection || db;

  const [current] = await client.query('SELECT status FROM orders WHERE id = ?', [orderId]);
  if (!current || current.length === 0) return false;

  const fromStatus = current[0].status;

  const setClauses = ['status = ?', 'updated_at = NOW()'];
  const values = [newStatus];

  for (const [key, val] of Object.entries(extraFields)) {
    setClauses.push(`\`${key}\` = ?`);
    values.push(val);
  }

  values.push(orderId);
  const sql = `UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`;
  await client.query(sql, values);

  await orderLogModel.logStatusChange({
    connection: client,
    orderId,
    fromStatus,
    toStatus: newStatus,
    changedBy,
    note,
  });

  return true;
};

module.exports = {
  createOrder,
  findById,
  findAll,
  cancelOrder,
  updateStatus,
};
