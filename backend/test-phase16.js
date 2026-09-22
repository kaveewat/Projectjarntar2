/**
 * Phase 16 Verification Test Suite
 * Real-time Notifications & Auto-Release Scheduler
 *
 * Acceptance Criteria:
 * 1. Bell icon แสดง unread count อัปเดตทุก 30 วิ (GET /notifications/unread-count)
 * 2. เมื่อ Order status change → notification ปรากฏใน bell icon ของ user ที่เกี่ยวข้อง
 * 3. Click notification → navigate ไป reference page (reference_type / reference_id & mark as read API)
 * 4. Auto-release cron: test ด้วย reduced timeout → COMPLETED & escrow released
 * 5. Dispute SLA warning: test ด้วย dispute เก่า (<12h SLA left) → Admin ได้รับ notification (N25)
 */

const db = require('./src/config/db');
const { checkBuyerAutoRelease } = require('./src/jobs/buyer-auto-release.job');
const { checkDisputeSlaWarnings } = require('./src/jobs/dispute-sla.job');
const schedulerService = require('./src/services/scheduler.service');

const API_BASE = 'http://localhost:5001/api/v1';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 Running Phase 16 Verification Tests (Notifications & Scheduler)...');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    const timestamp = Date.now();
    const adminEmail = `admin_p16_${timestamp}@test.com`;
    const buyerEmail = `buyer_p16_${timestamp}@test.com`;
    const sellerEmail = `seller_p16_${timestamp}@test.com`;
    const password = 'Password123!';

    // ──────────────────────────────────────────────────────────────────────────
    // 0. Setup Users: Admin, Seller, Buyer
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📋 [Setup] Registering test users...');

    // 0.1 Admin
    const adminReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password,
        display_name: `Admin P16 ${timestamp}`,
        role: 'BUYER',
      }),
    });
    const adminUser = adminReg.data?.data?.user || adminReg.data?.user;
    const adminToken = adminReg.data?.data?.token || adminReg.data?.token || adminReg.data?.data?.access_token;
    await db.query(`UPDATE users SET role = 'ADMIN' WHERE id = ?`, [adminUser.id]);

    // 0.2 Seller
    const sellerReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sellerEmail,
        password,
        display_name: `Seller P16 ${timestamp}`,
        role: 'SELLER',
      }),
    });
    const sellerUser = sellerReg.data?.data?.user || sellerReg.data?.user;
    const sellerToken = sellerReg.data?.data?.token || sellerReg.data?.token || sellerReg.data?.data?.access_token;
    await db.query(`UPDATE users SET is_verified = 1 WHERE id = ?`, [sellerUser.id]);

    // 0.3 Buyer
    const buyerReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        password,
        display_name: `Buyer P16 ${timestamp}`,
        role: 'BUYER',
      }),
    });
    const buyerUser = buyerReg.data?.data?.user || buyerReg.data?.user;
    const buyerToken = buyerReg.data?.data?.token || buyerReg.data?.token || buyerReg.data?.data?.access_token;

    console.log(`   Created Admin ID: ${adminUser.id}, Seller ID: ${sellerUser.id}, Buyer ID: ${buyerUser.id}\n`);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Acceptance Criterion 1: Bell icon unread count polling API
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🧪 [Test 1] AC1: Bell icon unread count API (/notifications/unread-count)...');

    const unreadRes1 = await apiRequest('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    if (unreadRes1.status === 200 && (unreadRes1.data?.data?.unread_count !== undefined || unreadRes1.data?.data?.count !== undefined)) {
      const count = unreadRes1.data.data.unread_count ?? unreadRes1.data.data.count;
      console.log(`   ✅ PASS: Initial unread count endpoint returned status 200 with count = ${count}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: Unexpected unread count response:`, unreadRes1);
      failed++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Acceptance Criterion 2: Order status change triggers notifications
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🧪 [Test 2] AC2: Order lifecycle events trigger notifications for relevant users...');

    // 2.1 Create a Listing
    const [listingRes] = await db.query(`
      INSERT INTO account_listings (
        seller_id, game_id, title, description, asking_price, platform_id,
        status, value_badge, team_strength, created_at, updated_at
      ) VALUES (?, 1, 'Phase 16 Test Account Listing', 'Testing notification dispatch', 1500.00, 1, 'ACTIVE', 'GREAT_VALUE', 3150, NOW(), NOW())
    `, [sellerUser.id]);
    const listingId = listingRes.insertId;

    // 2.2 Buyer creates Order (triggers ORDER_CREATED for Seller)
    const orderCreateRes = await apiRequest('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        listing_id: listingId,
      }),
    });

    const order = orderCreateRes.data?.data?.order || orderCreateRes.data?.order;
    if (orderCreateRes.status === 201 && order?.id) {
      console.log(`   Created Order ID: ${order.id} (#${order.order_number})`);
      
      // Check seller's unread notifications for ORDER_CREATED
      const sellerNotifs = await apiRequest('/notifications?limit=10', {
        headers: { Authorization: `Bearer ${sellerToken}` },
      });
      const items = Array.isArray(sellerNotifs.data?.data)
        ? sellerNotifs.data.data
        : (sellerNotifs.data?.data?.notifications || []);
      const orderCreatedNotif = items.find((n) => n.type === 'ORDER_CREATED' && Number(n.reference_id) === Number(order.id));

      if (orderCreatedNotif) {
        console.log(`   ✅ PASS: Seller received ORDER_CREATED notification (ID: ${orderCreatedNotif.id})`);
        passed++;
      } else {
        console.error(`   ❌ FAIL: Seller did not receive ORDER_CREATED notification`, items);
        failed++;
      }
    } else {
      console.error(`   ❌ FAIL: Could not create order for notification testing:`, orderCreateRes);
      failed++;
    }

    // 2.3 Buyer submits payment slip (triggers PAYMENT_SUBMITTED for Admins)
    const submitSlipRes = await apiRequest(`/orders/${order.id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        payment_proof_url: 'https://storage.efootball-market.test/slips/slip_p16_test.jpg',
      }),
    });

    if (submitSlipRes.status === 200) {
      // Brief pause to ensure async notification broadcast completes
      await new Promise((r) => setTimeout(r, 200));

      // Check admin unread notifications for PAYMENT_SUBMITTED
      const adminNotifs = await apiRequest('/notifications?limit=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const adminItems = Array.isArray(adminNotifs.data?.data)
        ? adminNotifs.data.data
        : (adminNotifs.data?.data?.notifications || []);
      const paySubmittedNotif = adminItems.find((n) => n.type === 'PAYMENT_SUBMITTED' && Number(n.reference_id) === Number(order.id));

      if (paySubmittedNotif) {
        console.log(`   ✅ PASS: Admin received PAYMENT_SUBMITTED notification`);
        passed++;
      } else {
        console.error(`   ❌ FAIL: Admin did not receive PAYMENT_SUBMITTED notification`, adminItems);
        failed++;
      }
    } else {
      console.error(`   ❌ FAIL: Payment slip submission failed:`, submitSlipRes);
      failed++;
    }

    // 2.4 Admin approves payment (triggers PAYMENT_APPROVED for Buyer & HANDOVER_OPEN for Seller)
    const approvePayRes = await apiRequest(`/admin/orders/${order.id}/payment/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (approvePayRes.status === 200) {
      await new Promise((r) => setTimeout(r, 200));

      const buyerNotifs = await apiRequest('/notifications?limit=20', {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const buyerItems = Array.isArray(buyerNotifs.data?.data)
        ? buyerNotifs.data.data
        : (buyerNotifs.data?.data?.notifications || []);
      const payApprovedNotif = buyerItems.find((n) => n.type === 'PAYMENT_APPROVED' && Number(n.reference_id) === Number(order.id));

      if (payApprovedNotif) {
        console.log(`   ✅ PASS: Buyer received PAYMENT_APPROVED notification`);
        passed++;
      } else {
        console.error(`   ❌ FAIL: Buyer did not receive PAYMENT_APPROVED notification`);
        failed++;
      }
    } else {
      console.error(`   ❌ FAIL: Payment approval failed:`, approvePayRes);
      failed++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Acceptance Criterion 3: Click notification navigates & Mark as read
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🧪 [Test 3] AC3: Click notification reference navigation & Mark as Read API...');

    const buyerNotifsList = await apiRequest('/notifications?limit=5', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const buyerItemsList = Array.isArray(buyerNotifsList.data?.data)
      ? buyerNotifsList.data.data
      : (buyerNotifsList.data?.data?.notifications || []);
    const sampleNotif = buyerItemsList[0];

    if (sampleNotif) {
      // Check reference navigation fields
      const hasValidReference = (sampleNotif.reference_type === 'ORDER' && sampleNotif.reference_id > 0) || sampleNotif.link;
      if (hasValidReference) {
        console.log(`   ✅ PASS: Notification contains valid navigation reference: ${sampleNotif.reference_type} #${sampleNotif.reference_id}`);
        passed++;
      } else {
        console.error(`   ❌ FAIL: Notification missing valid reference:`, sampleNotif);
        failed++;
      }

      // Test Mark Single as Read
      const markReadRes = await apiRequest(`/notifications/${sampleNotif.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      if (markReadRes.status === 200) {
        console.log(`   ✅ PASS: PATCH /notifications/${sampleNotif.id}/read marked item as read`);
        passed++;
      } else {
        console.error(`   ❌ FAIL: Mark as read failed:`, markReadRes);
        failed++;
      }

      // Test Mark All as Read
      const markAllRes = await apiRequest('/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      const unreadCountAfter = await apiRequest('/notifications/unread-count', {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const remainingUnread = unreadCountAfter.data?.data?.unread_count ?? unreadCountAfter.data?.data?.count;

      if (markAllRes.status === 200 && remainingUnread === 0) {
        console.log(`   ✅ PASS: PATCH /notifications/read-all cleared all unread notifications (count = 0)`);
        passed++;
      } else {
        console.error(`   ❌ FAIL: Mark all as read did not clear count: remaining = ${remainingUnread}`);
        failed++;
      }
    } else {
      console.error(`   ❌ FAIL: No sample notification found for mark as read testing`, buyerItemsList);
      failed++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Acceptance Criterion 4: Auto-release cron transitions expired order to COMPLETED
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🧪 [Test 4] AC4: Auto-release cron job with simulated timeout (48h/reduced)...');

    // 4.1 Create an Order and Escrow record in 'HANDOVER_INFO_SUBMITTED' with auto_release_at in past
    const [expiredListing] = await db.query(`
      INSERT INTO account_listings (
        seller_id, game_id, title, description, asking_price, platform_id,
        status, value_badge, created_at, updated_at
      ) VALUES (?, 1, 'Auto-release Cron Test Listing', 'Simulated auto-release', 2000.00, 1, 'RESERVED', 'FAIR', NOW(), NOW())
    `, [sellerUser.id]);
    const expListingId = expiredListing.insertId;

    const [expiredOrder] = await db.query(`
      INSERT INTO orders (
        order_number, buyer_id, seller_id, listing_id, amount, platform_fee,
        seller_payout, fee_rate, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 2000.00, 100.00, 1900.00, 0.05, 'BUYER_REVIEWING', DATE_SUB(NOW(), INTERVAL 50 HOUR), DATE_SUB(NOW(), INTERVAL 49 HOUR))
    `, [`ORD-AUTOREL-${timestamp}`, buyerUser.id, sellerUser.id, expListingId]);
    const expOrderId = expiredOrder.insertId;

    await db.query(`
      INSERT INTO escrow_records (
        order_id, amount_held, platform_fee, seller_payout, status, held_at
      ) VALUES (?, 2000.00, 100.00, 1900.00, 'HELD', DATE_SUB(NOW(), INTERVAL 50 HOUR))
    `, [expOrderId]);

    // Create handover room past 48h deadline
    const [roomRes] = await db.query(`
      INSERT INTO handover_rooms (
        order_id, status, opened_at, auto_release_at, seller_submitted_at, expires_at
      ) VALUES (
        ?, 'INFO_PROVIDED', DATE_SUB(NOW(), INTERVAL 50 HOUR),
        DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 49 HOUR), DATE_ADD(NOW(), INTERVAL 24 HOUR)
      )
    `, [expOrderId]);
    const expRoomId = roomRes.insertId;

    // Execute checkBuyerAutoRelease
    const autoReleaseResult = await checkBuyerAutoRelease();
    console.log(`   Auto-release job executed: processed = ${autoReleaseResult.processed}`);

    // Verify DB states: Order -> COMPLETED, Escrow -> RELEASED, Room -> AUTO_RELEASED
    const [updatedOrders] = await db.query('SELECT status FROM orders WHERE id = ?', [expOrderId]);
    const [updatedEscrows] = await db.query('SELECT status FROM escrow_records WHERE order_id = ?', [expOrderId]);
    const [updatedRooms] = await db.query('SELECT status FROM handover_rooms WHERE id = ?', [expRoomId]);

    const orderCompleted = updatedOrders[0]?.status === 'COMPLETED';
    const escrowReleased = updatedEscrows[0]?.status === 'RELEASED';
    const roomAutoReleased = updatedRooms[0]?.status === 'AUTO_RELEASED';

    if (orderCompleted && escrowReleased && roomAutoReleased) {
      console.log(`   ✅ PASS: Auto-release completed! Order status is COMPLETED, escrow is RELEASED, room is AUTO_RELEASED`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: Auto-release state mismatch:`, {
        order: updatedOrders[0]?.status,
        escrow: updatedEscrows[0]?.status,
        room: updatedRooms[0]?.status,
      });
      failed++;
    }

    // Verify AUTO_RELEASE_TRIGGERED notification
    const [sellerAutoNotifs] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? AND type = 'AUTO_RELEASE_TRIGGERED' AND reference_id = ?`,
      [sellerUser.id, expOrderId]
    );

    if (sellerAutoNotifs.length > 0) {
      console.log(`   ✅ PASS: Seller received AUTO_RELEASE_TRIGGERED notification (N13)`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: Seller did not receive AUTO_RELEASE_TRIGGERED notification`);
      failed++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Acceptance Criterion 5: Dispute SLA warning cron notifies admins
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🧪 [Test 5] AC5: Dispute SLA warning cron job (< 12h remaining / > 36h open)...');

    // Create dispute approaching SLA (< 12 hours left)
    const [disputeListing] = await db.query(`
      INSERT INTO account_listings (
        seller_id, game_id, title, description, asking_price, platform_id,
        status, value_badge, created_at, updated_at
      ) VALUES (?, 1, 'Dispute SLA Test Listing', 'Testing SLA alert', 1200.00, 1, 'RESERVED', 'FAIR', NOW(), NOW())
    `, [sellerUser.id]);
    const dispListingId = disputeListing.insertId;

    const [dispOrder] = await db.query(`
      INSERT INTO orders (
        order_number, buyer_id, seller_id, listing_id, amount, platform_fee,
        seller_payout, fee_rate, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 1200.00, 60.00, 1140.00, 0.05, 'DISPUTED', DATE_SUB(NOW(), INTERVAL 40 HOUR), DATE_SUB(NOW(), INTERVAL 40 HOUR))
    `, [`ORD-DISP-SLA-${timestamp}`, buyerUser.id, sellerUser.id, dispListingId]);
    const dispOrderId = dispOrder.insertId;

    // SLA deadline set to 6 hours from now (< 12h SLA left)
    const [dispRes] = await db.query(`
      INSERT INTO disputes (
        order_id, opened_by, dispute_reason_id, description, status,
        opened_at, sla_deadline
      ) VALUES (
        ?, ?, 1, 'Simulated dispute past 36h SLA warning threshold', 'OPEN',
        DATE_SUB(NOW(), INTERVAL 40 HOUR), DATE_ADD(NOW(), INTERVAL 6 HOUR)
      )
    `, [dispOrderId, buyerUser.id]);
    const disputeId = dispRes.insertId;

    // Run Dispute SLA cron check
    const slaCheckResult = await checkDisputeSlaWarnings();
    console.log(`   Dispute SLA check executed: warned = ${slaCheckResult.processed}`);

    // Verify Admin received DISPUTE_SLA_WARNING
    const [adminSlaNotifs] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? AND type = 'DISPUTE_SLA_WARNING' AND reference_id = ?`,
      [adminUser.id, disputeId]
    );

    if (adminSlaNotifs.length > 0) {
      console.log(`   ✅ PASS: Admin received DISPUTE_SLA_WARNING notification (N25) for dispute #${disputeId}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: Admin did not receive DISPUTE_SLA_WARNING notification`);
      failed++;
    }

    // Verify anti-spam prevention on immediate second check
    const secondCheckResult = await checkDisputeSlaWarnings();
    if (secondCheckResult.processed === 0) {
      console.log(`   ✅ PASS: Deduplication prevented duplicate SLA alert on immediate rerun (warned = 0)`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: Duplicate SLA alert dispatched: warned = ${secondCheckResult.processed}`);
      failed++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Scheduler Service Lifecycle Test
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n🧪 [Test 6] Schedulers Service Lifecycle Initialization & Shutdown...');
    try {
      schedulerService.initSchedulers();
      schedulerService.stopSchedulers();
      console.log('   ✅ PASS: Scheduler service initialized and stopped smoothly without error');
      passed++;
    } catch (schedErr) {
      console.error('   ❌ FAIL: Scheduler service error:', schedErr.message);
      failed++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Summary
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n================================================================');
    console.log(`🏁 Phase 16 Verification Finished! Passed: ${passed} | Failed: ${failed}`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Test suite uncaught error:', err);
    process.exit(1);
  }
}

runTests();
