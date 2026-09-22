/**
 * Phase 7 Automated Verification Test Script
 * Tests: Order Lifecycle, Race Conditions, Payment Submission & Moderation, Escrow Hold/Refund, Timeout Jobs, and Status Logs
 */

const BASE_URL = 'http://localhost:5001';
const { checkPaymentTimeouts } = require('./src/jobs/order-payment-timeout.job');
const { checkHandoverSellerTimeouts } = require('./src/jobs/handover-seller-timeout.job');
const db = require('./src/config/db');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 7 Verification Tests (Escrow Orders & Payments)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // ── Step 0: Auth Setup ──
  console.log('🔑 Setting up test accounts and tokens...');

  // 0a: Login Admin
  const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@efootball-market.com',
      password: 'Admin@123456',
    }),
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.data.access_token;

  // 0b: Register Seller
  const sellerEmail = `seller_p7_${Date.now()}@example.com`;
  const sellerRegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: sellerEmail,
      password: 'SellerPassword@123',
      display_name: 'Escrow Test Seller',
      role: 'SELLER',
    }),
  });
  const sellerData = await sellerRegRes.json();
  const sellerToken = sellerData.data.access_token;
  const sellerId = sellerData.data.user.id;

  // 0c: Register Buyer 1
  const buyer1Email = `buyer1_p7_${Date.now()}@example.com`;
  const buyer1RegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: buyer1Email,
      password: 'BuyerPassword@123',
      display_name: 'Fast Buyer 1',
      role: 'BUYER',
    }),
  });
  const buyer1Data = await buyer1RegRes.json();
  const buyer1Token = buyer1Data.data.access_token;
  const buyer1Id = buyer1Data.data.user.id;

  // 0d: Register Buyer 2
  const buyer2Email = `buyer2_p7_${Date.now()}@example.com`;
  const buyer2RegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: buyer2Email,
      password: 'BuyerPassword@123',
      display_name: 'Second Buyer 2',
      role: 'BUYER',
    }),
  });
  const buyer2Data = await buyer2RegRes.json();
  const buyer2Token = buyer2Data.data.access_token;

  console.log(`   ✅ Setup complete: Seller (${sellerId}), Buyer1 (${buyer1Id})`);

  // Helper to create a scan and listing
  const createListingHelper = async (title, price) => {
    const formData = new FormData();
    formData.append('game_id', '1');
    const dummyImageBytes = new Uint8Array(1024);
    dummyImageBytes.fill(150);
    formData.append(
      'images',
      new Blob([dummyImageBytes], { type: 'image/jpeg' }),
      'squad_for_order.jpg'
    );

    const scanRes = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: formData,
    });
    const scanData = await scanRes.json();
    const scanId = scanData.data.scan_id;

    // Poll until COMPLETED
    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(100);
      const checkRes = await fetch(`${BASE_URL}/api/v1/scans/${scanId}`, {
        headers: { Authorization: `Bearer ${sellerToken}` },
      });
      const checkData = await checkRes.json();
      if (checkData.data && checkData.data.status === 'COMPLETED') break;
    }

    const listingRes = await fetch(`${BASE_URL}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        squad_scan_id: scanId,
        platform_id: 1,
        title,
        asking_price: price,
      }),
    });
    const listingData = await listingRes.json();
    return listingData.data.listing.id;
  };

  console.log('   Creating 3 test listings for orders...');
  const listing1Id = await createListingHelper('Listing 1 for Timeout Test', 1000);
  const listing2Id = await createListingHelper('Listing 2 for Escrow Approval Test', 1500);
  const listing3Id = await createListingHelper('Listing 3 for Payment Reject Test', 2000);
  console.log(`   ✅ Listings created: [${listing1Id}, ${listing2Id}, ${listing3Id}]\n`);

  let order1Id = null;
  let order2Id = null;
  let order3Id = null;

  // ── AC 1: POST /api/v1/orders → Order CREATED + Listing RESERVED ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({ listing_id: listing1Id }),
    });
    const body = await res.json();

    // Check listing status
    const listingCheckRes = await fetch(`${BASE_URL}/api/v1/listings/${listing1Id}`);
    const listingCheckBody = await listingCheckRes.json();

    if (
      res.status === 201 &&
      body.success === true &&
      body.data.order &&
      body.data.order.status === 'CREATED' &&
      body.data.order.payment_deadline &&
      listingCheckBody.data.listing.status === 'RESERVED'
    ) {
      order1Id = body.data.order.id;
      console.log(`✅ AC-7.1 PASSED: POST /api/v1/orders created Order ${order1Id} (CREATED) & reserved listing ${listing1Id} (RESERVED)`);
      passed++;
    } else {
      console.error('❌ AC-7.1 FAILED: Unexpected response', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.1 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 2: POST /api/v1/orders duplicate on already reserved listing → 409 ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer2Token}`,
      },
      body: JSON.stringify({ listing_id: listing1Id }),
    });
    const body = await res.json();

    if (
      res.status === 409 &&
      body.success === false &&
      body.error.code === 'LISTING_ALREADY_RESERVED'
    ) {
      console.log(`✅ AC-7.2 PASSED: Duplicate order on reserved listing blocked with 409 LISTING_ALREADY_RESERVED`);
      passed++;
    } else {
      console.error('❌ AC-7.2 FAILED: Expected 409 conflict', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.2 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 3: Buyer buys own listing → 422 CANNOT_BUY_OWN_LISTING ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`, // seller buys own listing
      },
      body: JSON.stringify({ listing_id: listing2Id }),
    });
    const body = await res.json();

    if (
      res.status === 422 &&
      body.success === false &&
      body.error.code === 'CANNOT_BUY_OWN_LISTING'
    ) {
      console.log(`✅ AC-7.3 PASSED: Seller buying own listing rejected with 422 CANNOT_BUY_OWN_LISTING`);
      passed++;
    } else {
      console.error('❌ AC-7.3 FAILED: Expected 422 for buying own listing', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.3 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 4: Order not paid within 2 hours → EXPIRED + Listing → ACTIVE (cron/job) ──
  try {
    // Manually wind back payment_deadline to past
    await db.query(
      `UPDATE orders SET payment_deadline = DATE_SUB(NOW(), INTERVAL 5 MINUTE) WHERE id = ?`,
      [order1Id]
    );

    // Execute timeout job
    const jobResult = await checkPaymentTimeouts();

    // Verify order is EXPIRED
    const orderCheck = await fetch(`${BASE_URL}/api/v1/orders/${order1Id}`, {
      headers: { Authorization: `Bearer ${buyer1Token}` },
    });
    const orderBody = await orderCheck.json();

    // Verify listing is back to ACTIVE
    const listingCheck = await fetch(`${BASE_URL}/api/v1/listings/${listing1Id}`);
    const listingBody = await listingCheck.json();

    if (
      jobResult.processed >= 1 &&
      orderBody.data.order.status === 'EXPIRED' &&
      listingBody.data.listing.status === 'ACTIVE'
    ) {
      console.log(`✅ AC-7.4 PASSED: Payment timeout job transitioned Order ${order1Id} to EXPIRED & relisted listing ${listing1Id} to ACTIVE`);
      passed++;
    } else {
      console.error('❌ AC-7.4 FAILED: Order not expired or listing not restored', {
        jobResult,
        orderStatus: orderBody.data?.order?.status,
        listingStatus: listingBody.data?.listing?.status,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.4 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 5: Admin approve payment → Escrow HELD + Order PAYMENT_APPROVED ──
  try {
    // 5a: Buyer 1 orders Listing 2
    const createRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({ listing_id: listing2Id }),
    });
    const createBody = await createRes.json();
    order2Id = createBody.data.order.id;

    // 5b: Buyer 1 submits payment slip
    const payRes = await fetch(`${BASE_URL}/api/v1/orders/${order2Id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        payment_method: 'PROMPTPAY',
        payment_proof_url: 'https://storage.example.com/slips/slip_12345.jpg',
        bank_reference: 'KBANK-987654321',
      }),
    });
    const payBody = await payRes.json();

    // 5c: Admin approves payment
    const approveRes = await fetch(`${BASE_URL}/api/v1/admin/orders/${order2Id}/payment/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        note: 'PromptPay slip amount verified with SCB merchant statement',
      }),
    });
    const approveBody = await approveRes.json();

    // Verify detail
    const detailRes = await fetch(`${BASE_URL}/api/v1/orders/${order2Id}`, {
      headers: { Authorization: `Bearer ${buyer1Token}` },
    });
    const detailBody = await detailRes.json();

    if (
      payRes.status === 200 &&
      payBody.data.order.status === 'PAYMENT_SUBMITTED' &&
      approveRes.status === 200 &&
      approveBody.data.order.status === 'PAYMENT_APPROVED' &&
      approveBody.data.escrow.status === 'HELD' &&
      detailBody.data.order.escrow.status === 'HELD' &&
      detailBody.data.order.handover_deadline
    ) {
      console.log(`✅ AC-7.5 PASSED: Admin approved payment -> Order ${order2Id} is PAYMENT_APPROVED & Escrow is HELD (Amount: ฿${approveBody.data.escrow.amount_held})`);
      passed++;
    } else {
      console.error('❌ AC-7.5 FAILED: Approval flow failed', { payBody, approveBody });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.5 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 6: Admin reject payment → Order CANCELLED + Listing ACTIVE ──
  try {
    // 6a: Buyer 1 orders Listing 3
    const createRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({ listing_id: listing3Id }),
    });
    const createBody = await createRes.json();
    order3Id = createBody.data.order.id;

    // 6b: Buyer 1 submits unreadable slip
    await fetch(`${BASE_URL}/api/v1/orders/${order3Id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1Token}`,
      },
      body: JSON.stringify({
        payment_method: 'BANK_TRANSFER',
        payment_proof_url: 'https://storage.example.com/slips/corrupted_image.jpg',
      }),
    });

    // 6c: Admin rejects payment
    const rejectRes = await fetch(`${BASE_URL}/api/v1/admin/orders/${order3Id}/payment/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reason: 'Payment slip image is corrupted and unreadable. Ref: SLIP-BAD',
      }),
    });
    const rejectBody = await rejectRes.json();

    // Verify listing 3 is relisted back to ACTIVE
    const listingCheck = await fetch(`${BASE_URL}/api/v1/listings/${listing3Id}`);
    const listingBody = await listingCheck.json();

    if (
      rejectRes.status === 200 &&
      rejectBody.data.order.status === 'CANCELLED' &&
      listingBody.data.listing.status === 'ACTIVE'
    ) {
      console.log(`✅ AC-7.6 PASSED: Admin rejected payment -> Order ${order3Id} CANCELLED & Listing ${listing3Id} relisted to ACTIVE`);
      passed++;
    } else {
      console.error('❌ AC-7.6 FAILED: Reject flow failed', { rejectBody, listingBody });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.6 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 7: Seller handover timeout in 72h → Auto-cancel + Refund (cron/job) ──
  try {
    // For order2 (which has PAYMENT_APPROVED and Escrow HELD), wind back handover_deadline
    await db.query(
      `UPDATE orders SET handover_deadline = DATE_SUB(NOW(), INTERVAL 10 MINUTE) WHERE id = ?`,
      [order2Id]
    );

    // Execute handover timeout job
    const jobResult = await checkHandoverSellerTimeouts();

    // Verify order2 status is REFUNDED
    const orderCheck = await fetch(`${BASE_URL}/api/v1/orders/${order2Id}`, {
      headers: { Authorization: `Bearer ${buyer1Token}` },
    });
    const orderBody = await orderCheck.json();

    // Verify listing2 is back to ACTIVE
    const listingCheck = await fetch(`${BASE_URL}/api/v1/listings/${listing2Id}`);
    const listingBody = await listingCheck.json();

    if (
      jobResult.processed >= 1 &&
      orderBody.data.order.status === 'REFUNDED' &&
      orderBody.data.order.escrow.status === 'REFUNDED' &&
      listingBody.data.listing.status === 'ACTIVE'
    ) {
      console.log(`✅ AC-7.7 PASSED: 72h handover timeout job refunded Order ${order2Id}, refunded Escrow, and relisted Listing ${listing2Id} to ACTIVE`);
      passed++;
    } else {
      console.error('❌ AC-7.7 FAILED: Seller timeout refund failed', {
        jobResult,
        orderStatus: orderBody.data?.order?.status,
        escrowStatus: orderBody.data?.order?.escrow?.status,
        listingStatus: listingBody.data?.listing?.status,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.7 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 8: Verify order_status_logs (append-only) ──
  try {
    const [logs] = await db.query(
      `SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY id ASC`,
      [order2Id]
    );

    const statuses = logs.map((l) => l.to_status);
    // order2 went through: CREATED -> PAYMENT_SUBMITTED -> PAYMENT_APPROVED -> REFUNDED
    const expected = ['CREATED', 'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'REFUNDED'];
    const allCaptured = expected.every((s) => statuses.includes(s));

    if (logs.length >= 4 && allCaptured) {
      console.log(`✅ AC-7.8 PASSED: Append-only order_status_logs recorded all transitions: [${statuses.join(' -> ')}]`);
      passed++;
    } else {
      console.error('❌ AC-7.8 FAILED: Incomplete order status logs', logs);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.8 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 9: Verify escrow_status_logs (append-only) ──
  try {
    const [escrowLogs] = await db.query(
      `SELECT * FROM escrow_status_logs WHERE order_id = ? ORDER BY id ASC`,
      [order2Id]
    );

    const escrowStatuses = escrowLogs.map((l) => l.to_status);
    // Escrow went through: HELD -> REFUNDED
    const expectedEscrow = ['HELD', 'REFUNDED'];
    const allEscrowCaptured = expectedEscrow.every((s) => escrowStatuses.includes(s));

    if (escrowLogs.length >= 2 && allEscrowCaptured) {
      console.log(`✅ AC-7.9 PASSED: Append-only escrow_status_logs recorded all transitions: [${escrowStatuses.join(' -> ')}]`);
      passed++;
    } else {
      console.error('❌ AC-7.9 FAILED: Incomplete escrow status logs', escrowLogs);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-7.9 FAILED with exception:', err.message);
    failed++;
  }

  // ── Summary ──
  console.log('\n====================================================');
  console.log(`📊 Phase 7 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
