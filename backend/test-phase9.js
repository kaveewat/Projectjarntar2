/**
 * Phase 9 Verification Test Suite: Dashboard, Metrics & Audit Report API
 *
 * Verifies all Phase 9 Acceptance Criteria:
 * 1. AC-9.1: GET /api/v1/dashboard/seller returns correct summary cards
 * 2. AC-9.2: GET /api/v1/admin/dashboard returns GMV + pending actions count
 * 3. AC-9.3: Notifications created automatically on order status change
 * 4. AC-9.4: GET /api/v1/notifications/unread-count returns accurate count
 * 5. AC-9.5: PATCH /api/v1/notifications/read-all marks all notifications as read
 * 6. AC-9.6: GET /api/v1/admin/audit-logs returns historical admin actions
 * 7. AC-9.7: PATCH /api/v1/admin/platform-settings/:key updates setting & writes audit log
 * 8. AC-9.8: GET /api/v1/dashboard/buyer returns active orders & completed statistics
 * 9. AC-9.9: GET /api/v1/market/price-history public endpoint works without auth
 * 10. AC-9.10: GET /api/v1/admin/analytics/sales returns volume, revenue, and timeline
 */

const db = require('./src/config/db');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 9 Verification Tests (Dashboard, Metrics & Audit)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // ── Setup: Authenticate Admin & Register Seller and Buyer ──
  console.log('🔑 Setting up test accounts and tokens...');
  const timestamp = Date.now();
  const adminEmail = 'admin@efootball-market.com';
  const adminPassword = 'Admin@123456';

  // Admin login
  const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.data?.access_token;

  // Register Seller
  const sellerEmail = `seller_p9_${timestamp}@example.com`;
  const sellerRegisterRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: sellerEmail,
      password: 'Password123!',
      display_name: 'Phase 9 Seller',
      role: 'SELLER',
    }),
  });
  const sellerRegData = await sellerRegisterRes.json();
  const sellerToken = sellerRegData.data?.access_token;
  const sellerId = sellerRegData.data?.user?.id;

  // Register Buyer
  const buyerEmail = `buyer_p9_${timestamp}@example.com`;
  const buyerRegisterRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: buyerEmail,
      password: 'Password123!',
      display_name: 'Phase 9 Buyer',
      role: 'BUYER',
    }),
  });
  const buyerRegData = await buyerRegisterRes.json();
  const buyerToken = buyerRegData.data?.access_token;
  const buyerId = buyerRegData.data?.user?.id;

  console.log(`   ✅ Setup complete: Admin, Seller (${sellerEmail}), Buyer (${buyerEmail})\n`);

  // Create 1 listing for seller
  const [scanResult] = await db.query(
    `INSERT INTO squad_scans (user_id, game_id, image_urls, status, processing_time_ms, created_at, completed_at)
     VALUES (?, 1, '[]', 'COMPLETED', 1200, NOW(), NOW())`,
    [sellerId]
  );
  const scanId = scanResult.insertId;

  const [listingResult] = await db.query(
    `INSERT INTO account_listings (seller_id, game_id, platform_id, squad_scan_id, title, description, asking_price, team_strength, status, created_at, updated_at)
     VALUES (?, 1, 1, ?, 'P9 Dashboard Testing Squad', 'High strength test team', 1200.00, 3120, 'ACTIVE', NOW(), NOW())`,
    [sellerId, scanId]
  );
  const listingId = listingResult.insertId;

  // ── AC 1: GET /dashboard/seller returns summary cards ──
  try {
    const sellerDashRes = await fetch(`${BASE_URL}/api/v1/dashboard/seller`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const sellerDashBody = await sellerDashRes.json();

    const data = sellerDashBody.data;
    if (
      sellerDashRes.status === 200 &&
      sellerDashBody.success === true &&
      data.active_listings_count >= 1 &&
      data.active_listings.some((l) => l.id === listingId) &&
      typeof data.total_earned === 'number' &&
      typeof data.pending_payout === 'number' &&
      typeof data.dispute_count === 'number'
    ) {
      console.log('✅ AC-9.1 PASSED: GET /api/v1/dashboard/seller returned summary cards accurately');
      console.log(`   (Active Listings: ${data.active_listings_count}, Total Earned: ฿${data.total_earned}, Pending Payout: ฿${data.pending_payout})`);
      passed++;
    } else {
      console.error('❌ AC-9.1 FAILED: Seller dashboard response invalid', sellerDashBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-9.1 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 2: GET /admin/dashboard returns GMV + pending actions count ──
  try {
    const adminDashRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDashBody = await adminDashRes.json();

    const data = adminDashBody.data;
    if (
      adminDashRes.status === 200 &&
      adminDashBody.success === true &&
      typeof data.total_active_listings === 'number' &&
      typeof data.pending_payments === 'number' &&
      typeof data.open_disputes === 'number' &&
      typeof data.gmv_today === 'number' &&
      typeof data.revenue_today === 'number'
    ) {
      console.log('✅ AC-9.2 PASSED: GET /api/v1/admin/dashboard returned overview metrics');
      console.log(`   (Active Listings: ${data.total_active_listings}, Pending Payments: ${data.pending_payments}, GMV Today: ฿${data.gmv_today})`);
      passed++;
    } else {
      console.error('❌ AC-9.2 FAILED: Admin dashboard overview response invalid', adminDashBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-9.2 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 3: Notifications created automatically on order status change ──
  let createdOrderId = null;
  try {
    // Buyer places order on seller's listing
    const orderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });
    const orderBody = await orderRes.json();
    createdOrderId = orderBody.data?.order?.id;

    // Buyer submits slip
    await fetch(`${BASE_URL}/api/v1/orders/${createdOrderId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        payment_proof_url: 'https://example.com/slips/p9_slip.jpg',
        payment_method: 'PROMPTPAY',
        bank_reference: 'P9-REF-001',
      }),
    });

    // Admin approves payment
    await fetch(`${BASE_URL}/api/v1/admin/orders/${createdOrderId}/payment/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ note: 'Payment verified for P9 test' }),
    });

    await sleep(200);

    // Query DB directly to verify notifications for both Seller and Buyer
    const [sellerNotifs] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [sellerId]
    );

    const [buyerNotifs] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [buyerId]
    );

    const hasOrderCreated = sellerNotifs.some((n) => n.type === 'ORDER_CREATED');
    const hasHandoverOpen = sellerNotifs.some((n) => n.type === 'HANDOVER_OPEN');
    const hasPaymentApproved = buyerNotifs.some((n) => n.type === 'PAYMENT_APPROVED');

    if (hasOrderCreated && hasHandoverOpen && hasPaymentApproved) {
      console.log('✅ AC-9.3 PASSED: Notifications created automatically on order lifecycle events');
      console.log(`   (Seller received: [${sellerNotifs.map((n) => n.type).join(', ')}])`);
      console.log(`   (Buyer received: [${buyerNotifs.map((n) => n.type).join(', ')}])`);
      passed++;
    } else {
      console.error('❌ AC-9.3 FAILED: Automatic notifications missing in DB', {
        sellerNotifs,
        buyerNotifs,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-9.3 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 4: GET /api/v1/notifications/unread-count returns count ──
  try {
    const unreadRes = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const unreadBody = await unreadRes.json();

    if (
      unreadRes.status === 200 &&
      unreadBody.success === true &&
      typeof unreadBody.data?.count === 'number' &&
      unreadBody.data?.count >= 2
    ) {
      console.log(`✅ AC-9.4 PASSED: GET /api/v1/notifications/unread-count returned ${unreadBody.data.count} unread`);
      passed++;
    } else {
      console.error('❌ AC-9.4 FAILED: Unread count response invalid', unreadBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-9.4 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 5: PATCH /api/v1/notifications/read-all marks all as read ──
  try {
    const readAllRes = await fetch(`${BASE_URL}/api/v1/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const readAllBody = await readAllRes.json();

    // Check count again
    const checkCount = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const checkCountBody = await checkCount.json();

    // Query DB directly
    const [unreadInDb] = await db.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [sellerId]
    );

    if (
      readAllRes.status === 200 &&
      readAllBody.success === true &&
      checkCountBody.data?.count === 0 &&
      unreadInDb[0].count === 0
    ) {
      console.log('✅ AC-9.5 PASSED: PATCH /api/v1/notifications/read-all marked all notifications is_read=1');
      passed++;
    } else {
      console.error('❌ AC-9.5 FAILED: Unread notifications still present after read-all', {
        readAllBody,
        checkCountBody,
        unreadInDb: unreadInDb[0].count,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-9.5 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 6: GET /api/v1/admin/audit-logs returns historical admin actions ──
  try {
    const auditRes = await fetch(`${BASE_URL}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditBody = await auditRes.json();

    if (
      auditRes.status === 200 &&
      auditBody.success === true &&
      Array.isArray(auditBody.data) &&
      auditBody.meta &&
      typeof auditBody.meta.total === 'number'
    ) {
      console.log(`✅ AC-9.6 PASSED: GET /api/v1/admin/audit-logs retrieved ${auditBody.data.length} audit entries`);
      passed++;
    } else {
      console.error('❌ AC-9.6 FAILED: Audit logs list response invalid', auditBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-9.6 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 7: PATCH /api/v1/admin/platform-settings/platform_fee_rate updates & writes audit log ──
  try {
    const updateSettingRes = await fetch(
      `${BASE_URL}/api/v1/admin/platform-settings/platform_fee_rate`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ value: '0.06' }),
      }
    );
    const updateSettingBody = await updateSettingRes.json();

    // Query setting in DB
    const [settingRows] = await db.query(
      `SELECT * FROM platform_settings WHERE setting_key = 'platform_fee_rate'`
    );

    // Query audit_logs to verify audit record was inserted
    const [auditRows] = await db.query(
      `SELECT * FROM audit_logs
       WHERE action = 'UPDATE_PLATFORM_SETTING' AND target_type = 'PLATFORM_SETTING'
       ORDER BY created_at DESC LIMIT 1`
    );

    const auditEntry = auditRows[0];
    const afterData = typeof auditEntry?.after_data === 'string' ? JSON.parse(auditEntry.after_data) : auditEntry?.after_data;

    // Restore to 0.05
    await fetch(`${BASE_URL}/api/v1/admin/platform-settings/platform_fee_rate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ value: '0.05' }),
    });

    if (
      updateSettingRes.status === 200 &&
      updateSettingBody.success === true &&
      settingRows[0].setting_value === '0.06' &&
      auditEntry &&
      afterData?.setting_value === '0.06'
    ) {
      console.log('✅ AC-9.7 PASSED: PATCH platform_fee_rate updated setting & recorded entry in audit_logs');
      console.log(`   (Audit ID: ${auditEntry.id}, Actor: ${auditEntry.actor_id}, Action: ${auditEntry.action})`);
      passed++;
    } else {
      console.error('❌ AC-9.7 FAILED: Setting update or audit record verification failed', {
        updateSettingBody,
        settingValue: settingRows[0]?.setting_value,
        auditEntry,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-9.7 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 8 (Extra): GET /dashboard/buyer returns active orders & stats ──
  try {
    const buyerDashRes = await fetch(`${BASE_URL}/api/v1/dashboard/buyer`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const buyerDashBody = await buyerDashRes.json();

    if (
      buyerDashRes.status === 200 &&
      buyerDashBody.success === true &&
      buyerDashBody.data?.active_orders_count >= 1 &&
      typeof buyerDashBody.data?.total_spent === 'number'
    ) {
      console.log('✅ EXTRA PASSED: GET /api/v1/dashboard/buyer returned active orders count and stats');
      passed++;
    } else {
      console.error('❌ EXTRA FAILED: Buyer dashboard response invalid', buyerDashBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ EXTRA FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 9 (Extra): GET /api/v1/market/price-history public endpoint ──
  try {
    const marketRes = await fetch(`${BASE_URL}/api/v1/market/price-history`);
    const marketBody = await marketRes.json();

    if (
      marketRes.status === 200 &&
      marketBody.success === true &&
      Array.isArray(marketBody.data?.avg_price_by_strength) &&
      Array.isArray(marketBody.data?.recent_sales)
    ) {
      console.log('✅ EXTRA PASSED: GET /api/v1/market/price-history returned public price benchmarks without auth');
      passed++;
    } else {
      console.error('❌ EXTRA FAILED: Public market price history invalid', marketBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ EXTRA FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 10 (Extra): GET /api/v1/admin/analytics/sales & /disputes ──
  try {
    const salesRes = await fetch(`${BASE_URL}/api/v1/admin/analytics/sales`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const salesBody = await salesRes.json();

    const disputesRes = await fetch(`${BASE_URL}/api/v1/admin/analytics/disputes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const disputesBody = await disputesRes.json();

    if (
      salesRes.status === 200 &&
      salesBody.success === true &&
      typeof salesBody.data?.total_volume === 'number' &&
      disputesRes.status === 200 &&
      disputesBody.success === true &&
      typeof disputesBody.data?.total_disputes === 'number'
    ) {
      console.log('✅ EXTRA PASSED: Admin sales and disputes analytics endpoints fully operational');
      passed++;
    } else {
      console.error('❌ EXTRA FAILED: Admin analytics endpoints invalid', { salesBody, disputesBody });
      failed++;
    }
  } catch (err) {
    console.error('❌ EXTRA FAILED with exception:', err.message);
    failed++;
  }

  // ── Final Summary ──
  console.log('\n====================================================');
  console.log(`📊 Phase 9 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('FATAL Test Suite Error:', err);
  process.exit(1);
});
