/**
 * Phase 8 Automated Verification Test Script
 * Tests: Secure Handover Room, AES-256-GCM Encryption, Credential Purge,
 * Dispute Engine (Escrow Freeze & Rulings), 48h Auto-Release Job, Access Audit Logs
 */

const BASE_URL = 'http://localhost:5001';
const { checkBuyerAutoRelease } = require('./src/jobs/buyer-auto-release.job');
const db = require('./src/config/db');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 8 Verification Tests (Handover & Disputes)...');
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
  const sellerEmail = `seller_p8_${Date.now()}@example.com`;
  const sellerRegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: sellerEmail,
      password: 'SellerPassword@123',
      display_name: 'Handover Test Seller',
      role: 'SELLER',
    }),
  });
  const sellerData = await sellerRegRes.json();
  const sellerToken = sellerData.data.access_token;

  // 0c: Register Buyer
  const buyerEmail = `buyer_p8_${Date.now()}@example.com`;
  const buyerRegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: buyerEmail,
      password: 'BuyerPassword@123',
      display_name: 'Secure Buyer',
      role: 'BUYER',
    }),
  });
  const buyerData = await buyerRegRes.json();
  const buyerToken = buyerData.data.access_token;

  console.log(`   ✅ Setup complete: Admin, Seller (${sellerEmail}), Buyer (${buyerEmail})`);

  // Helper to create Order in PAYMENT_APPROVED status with Escrow HELD
  const createApprovedOrderHelper = async (title, price) => {
    // 1. Scan & Listing
    const formData = new FormData();
    formData.append('game_id', '1');
    const dummyImageBytes = new Uint8Array(1024);
    dummyImageBytes.fill(180);
    formData.append(
      'images',
      new Blob([dummyImageBytes], { type: 'image/jpeg' }),
      'squad_p8.jpg'
    );

    const scanRes = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: formData,
    });
    const scanData = await scanRes.json();
    const scanId = scanData.data.scan_id;

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
    const listingId = listingData.data.listing.id;

    // 2. Buyer creates order
    const orderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });
    const orderData = await orderRes.json();
    const orderId = orderData.data.order.id;

    // 3. Buyer submits payment
    await fetch(`${BASE_URL}/api/v1/orders/${orderId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        payment_method: 'PROMPTPAY',
        payment_proof_url: 'https://storage.example.com/slips/slip_verified.jpg',
        bank_reference: 'KBANK-APPROVED',
      }),
    });

    // 4. Admin approves payment -> Escrow HELD, Order PAYMENT_APPROVED
    await fetch(`${BASE_URL}/api/v1/admin/orders/${orderId}/payment/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ note: 'Payment verified' }),
    });

    return { orderId, listingId };
  };

  console.log('   Creating 4 paid orders for testing Handover & Disputes...');
  const orderA = await createApprovedOrderHelper('Order A for Handover & Purge', 1000);
  const orderB = await createApprovedOrderHelper('Order B for Dispute Buyer Win', 1200);
  const orderC = await createApprovedOrderHelper('Order C for Dispute Seller Win', 1400);
  const orderD = await createApprovedOrderHelper('Order D for 48h Auto-Release', 1600);
  console.log(`   ✅ Orders created and approved: [${orderA.orderId}, ${orderB.orderId}, ${orderC.orderId}, ${orderD.orderId}]\n`);

  const plainKonamiEmail = 'konami_secure_gamer@example.com';
  const plainKonamiPass = 'UltraSecretPass#2026!';
  const plainNotes = 'Konami ID linked to clean email without 2FA.';

  // ── AC 1: Seller submit credentials → Encrypted in DB (unreadable in raw DB) ──
  try {
    const submitRes = await fetch(`${BASE_URL}/api/v1/handover/${orderA.orderId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        konami_email: plainKonamiEmail,
        konami_password: plainKonamiPass,
        notes: plainNotes,
      }),
    });
    const submitBody = await submitRes.json();

    // Query database directly to inspect raw content in handover_messages
    const [rawRows] = await db.query(
      `SELECT hm.* FROM handover_messages hm
       JOIN handover_rooms hr ON hm.room_id = hr.id
       WHERE hr.order_id = ?`,
      [orderA.orderId]
    );

    const rawRow = rawRows && rawRows.length > 0 ? rawRows[0] : null;
    const isEncrypted = rawRow &&
      !rawRow.content_encrypted.includes(plainKonamiEmail) &&
      !rawRow.content_encrypted.includes(plainKonamiPass) &&
      rawRow.encryption_iv &&
      rawRow.encryption_iv.length >= 16;

    if (
      submitRes.status === 200 &&
      submitBody.success === true &&
      isEncrypted
    ) {
      console.log('✅ AC-8.1 PASSED: Seller credentials encrypted with AES-256-GCM (Plaintext unreadable in DB)');
      console.log(`   (Raw IV: ${rawRow.encryption_iv.substring(0, 16)}..., Ciphertext length: ${rawRow.content_encrypted.length})`);
      passed++;
    } else {
      console.error('❌ AC-8.1 FAILED: Credentials not encrypted properly or plaintext leaked in DB', { submitBody, rawRow });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.1 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 2: Buyer GET /handover/:id/info → Decrypt + return plaintext ──
  try {
    const infoRes = await fetch(`${BASE_URL}/api/v1/handover/${orderA.orderId}/info`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const infoBody = await infoRes.json();

    const creds = infoBody.data && infoBody.data.credentials;
    if (
      infoRes.status === 200 &&
      infoBody.success === true &&
      creds &&
      creds.konami_email === plainKonamiEmail &&
      creds.konami_password === plainKonamiPass &&
      creds.notes === plainNotes
    ) {
      console.log('✅ AC-8.2 PASSED: Buyer GET /handover/:id/info successfully decrypted account credentials');
      console.log(`   (Decrypted Email: ${creds.konami_email}, Password: ${creds.konami_password.substring(0, 4)}****)`);
      passed++;
    } else {
      console.error('❌ AC-8.2 FAILED: Decryption failed or mismatched', infoBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.2 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 3: Buyer confirm → handover_messages hard-deleted (0 rows in DB) ──
  try {
    const confirmRes = await fetch(`${BASE_URL}/api/v1/handover/${orderA.orderId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const confirmBody = await confirmRes.json();

    // Query database directly to confirm row was hard-deleted
    const [messagesAfterConfirm] = await db.query(
      `SELECT hm.* FROM handover_messages hm
       JOIN handover_rooms hr ON hm.room_id = hr.id
       WHERE hr.order_id = ?`,
      [orderA.orderId]
    );

    // Verify order is COMPLETED and escrow is RELEASED
    const orderCheck = await fetch(`${BASE_URL}/api/v1/orders/${orderA.orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const orderBody = await orderCheck.json();

    if (
      confirmRes.status === 200 &&
      confirmBody.success === true &&
      messagesAfterConfirm.length === 0 &&
      orderBody.data.order.status === 'COMPLETED' &&
      orderBody.data.order.escrow.status === 'RELEASED'
    ) {
      console.log('✅ AC-8.3 PASSED: Buyer confirmation triggered permanent hard-delete of credentials (0 rows in DB) & released Escrow');
      passed++;
    } else {
      console.error('❌ AC-8.3 FAILED: Credentials still exist in DB or escrow not released', {
        messagesCount: messagesAfterConfirm.length,
        orderStatus: orderBody.data?.order?.status,
        escrowStatus: orderBody.data?.order?.escrow?.status,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.3 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 4: POST /handover/:id/problem → Dispute created + Escrow FROZEN ──
  let disputeIdB = null;
  try {
    // Seller submits credentials for Order B
    await fetch(`${BASE_URL}/api/v1/handover/${orderB.orderId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        konami_email: 'wrong_account@test.com',
        konami_password: 'WrongPassword123!',
      }),
    });

    // Buyer reports problem
    const problemRes = await fetch(`${BASE_URL}/api/v1/handover/${orderB.orderId}/problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        order_id: orderB.orderId,
        dispute_reason_id: 2, // LOGIN_FAILED
        description: 'Account password was incorrect. Unable to authenticate into Konami ID.',
      }),
    });
    const problemBody = await problemRes.json();
    disputeIdB = problemBody.data && problemBody.data.dispute && problemBody.data.dispute.id;

    // Check escrow status in DB
    const [escrowRows] = await db.query(
      `SELECT * FROM escrow_records WHERE order_id = ?`,
      [orderB.orderId]
    );

    // Check order status
    const orderCheck = await fetch(`${BASE_URL}/api/v1/orders/${orderB.orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const orderBody = await orderCheck.json();

    if (
      problemRes.status === 200 &&
      disputeIdB &&
      escrowRows[0].status === 'FROZEN' &&
      orderBody.data.order.status === 'DISPUTED'
    ) {
      console.log(`✅ AC-8.4 PASSED: Problem reported -> Dispute ${disputeIdB} created & Escrow FROZEN`);
      passed++;
    } else {
      console.error('❌ AC-8.4 FAILED: Dispute creation or escrow freeze failed', { problemBody, escrow: escrowRows[0] });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.4 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 5: Admin resolve for Buyer → Escrow REFUNDED + Order REFUNDED ──
  try {
    const resolveRes = await fetch(`${BASE_URL}/api/v1/admin/disputes/${disputeIdB}/resolve/buyer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        resolution_note: 'Seller failed to provide valid password. Full refund issued to buyer.',
      }),
    });
    const resolveBody = await resolveRes.json();

    // Verify order and escrow status
    const orderCheck = await fetch(`${BASE_URL}/api/v1/orders/${orderB.orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const orderBody = await orderCheck.json();

    // Verify listing is restored to ACTIVE
    const listingCheck = await fetch(`${BASE_URL}/api/v1/listings/${orderB.listingId}`);
    const listingBody = await listingCheck.json();

    if (
      resolveRes.status === 200 &&
      orderBody.data.order.status === 'REFUNDED' &&
      orderBody.data.order.escrow.status === 'REFUNDED' &&
      listingBody.data.listing.status === 'ACTIVE'
    ) {
      console.log(`✅ AC-8.5 PASSED: Admin resolved Dispute ${disputeIdB} for Buyer -> Escrow REFUNDED, Order REFUNDED, Listing relisted to ACTIVE`);
      passed++;
    } else {
      console.error('❌ AC-8.5 FAILED: Buyer resolution failed', { resolveBody, order: orderBody.data });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.5 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 6: Admin resolve for Seller → Escrow RELEASED + Order COMPLETED ──
  try {
    // Submit credentials for Order C
    await fetch(`${BASE_URL}/api/v1/handover/${orderC.orderId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        konami_email: 'seller_valid_account@test.com',
        konami_password: 'ValidPassword123!',
      }),
    });

    // Buyer opens dispute for Order C
    const disputeRes = await fetch(`${BASE_URL}/api/v1/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        order_id: orderC.orderId,
        dispute_reason_id: 4, // OTHER
        description: 'Buyer claims missing players, but scan was confirmed.',
      }),
    });
    const disputeBody = await disputeRes.json();
    const disputeIdC = disputeBody.data.dispute.id;

    // Admin resolves in favor of Seller
    const resolveRes = await fetch(`${BASE_URL}/api/v1/admin/disputes/${disputeIdC}/resolve/seller`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        resolution_note: 'Investigation confirmed that squad players matched scan. Payment released to seller.',
      }),
    });
    const resolveBody = await resolveRes.json();

    const orderCheck = await fetch(`${BASE_URL}/api/v1/orders/${orderC.orderId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const orderBody = await orderCheck.json();

    if (
      resolveRes.status === 200 &&
      orderBody.data.order.status === 'COMPLETED' &&
      orderBody.data.order.escrow.status === 'RELEASED'
    ) {
      console.log(`✅ AC-8.6 PASSED: Admin resolved Dispute ${disputeIdC} for Seller -> Escrow RELEASED, Order COMPLETED`);
      passed++;
    } else {
      console.error('❌ AC-8.6 FAILED: Seller resolution failed', { resolveBody, order: orderBody.data });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.6 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 7: Auto-release after 48h → Order COMPLETED + Escrow RELEASED (cron) ──
  try {
    // Submit credentials for Order D
    await fetch(`${BASE_URL}/api/v1/handover/${orderD.orderId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        konami_email: 'auto_release_account@test.com',
        konami_password: 'AutoReleasePass123!',
      }),
    });

    // Wind back auto_release_at to 10 minutes ago
    await db.query(
      `UPDATE handover_rooms SET auto_release_at = DATE_SUB(NOW(), INTERVAL 10 MINUTE) WHERE order_id = ?`,
      [orderD.orderId]
    );

    // Run auto-release job
    const autoReleaseResult = await checkBuyerAutoRelease();

    // Verify order is COMPLETED and escrow is RELEASED
    const orderCheck = await fetch(`${BASE_URL}/api/v1/orders/${orderD.orderId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const orderBody = await orderCheck.json();

    // Verify credentials purged
    const [messagesAfter] = await db.query(
      `SELECT hm.* FROM handover_messages hm
       JOIN handover_rooms hr ON hm.room_id = hr.id
       WHERE hr.order_id = ?`,
      [orderD.orderId]
    );

    if (
      autoReleaseResult.processed >= 1 &&
      orderBody.data.order.status === 'COMPLETED' &&
      orderBody.data.order.escrow.status === 'RELEASED' &&
      messagesAfter.length === 0
    ) {
      console.log('✅ AC-8.7 PASSED: 48h auto-release job completed Order, released Escrow to seller, and purged credentials');
      passed++;
    } else {
      console.error('❌ AC-8.7 FAILED: Auto-release failed', {
        autoReleaseResult,
        order: orderBody.data?.order,
        messagesCount: messagesAfter.length,
      });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.7 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 8: Handover access log records IP + action on every step ──
  try {
    const logsRes = await fetch(`${BASE_URL}/api/v1/handover/admin/${orderA.orderId}/logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const logsBody = await logsRes.json();

    const actions = (logsBody.data?.access_logs || []).map((l) => l.action);
    const expectedActions = ['ROOM_OPENED', 'INFO_SUBMITTED', 'INFO_VIEWED', 'CONFIRMED'];
    const allActionsCaptured = expectedActions.every((a) => actions.includes(a));

    const allHaveIp = (logsBody.data?.access_logs || []).every((l) => l.ip_address);

    if (
      logsRes.status === 200 &&
      logsBody.success === true &&
      allActionsCaptured &&
      allHaveIp
    ) {
      console.log(`✅ AC-8.8 PASSED: Handover access audit logs recorded IP & actions: [${actions.join(' -> ')}]`);
      passed++;
    } else {
      console.error('❌ AC-8.8 FAILED: Incomplete access logs', logsBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-8.8 FAILED with exception:', err.message);
    failed++;
  }

  // ── Extra Quality Check: Dispute Reasons Catalog ──
  try {
    const reasonsRes = await fetch(`${BASE_URL}/api/v1/disputes/reasons`);
    const reasonsBody = await reasonsRes.json();

    if (
      reasonsRes.status === 200 &&
      reasonsBody.success === true &&
      Array.isArray(reasonsBody.data.reasons) &&
      reasonsBody.data.reasons.length >= 4
    ) {
      console.log(`✅ EXTRA PASSED: Dispute reasons endpoint returned ${reasonsBody.data.reasons.length} active categories`);
      passed++;
    } else {
      console.error('❌ EXTRA FAILED: Reasons catalog invalid', reasonsBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ EXTRA FAILED with exception:', err.message);
    failed++;
  }

  // ── Summary ──
  console.log('\n====================================================');
  console.log(`📊 Phase 8 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
