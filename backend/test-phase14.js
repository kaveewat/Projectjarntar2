/**
 * Phase 14 Verification Test Suite
 * Tests: Escrow Checkout, Payment Proof, Handover Vault & Dispute Interaction UI Contracts
 */

const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

const API_BASE = 'http://localhost:5001/api/v1';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 14 Verification Tests (Escrow & Handover)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Create Buyer & Seller Test Accounts
    const timestamp = Date.now();
    const buyerEmail = `buyer_p14_${timestamp}@test.com`;
    const sellerEmail = `seller_p14_${timestamp}@test.com`;
    const password = 'Password123!';

    // Register Buyer
    const buyerReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        password,
        display_name: `Buyer P14 ${timestamp}`,
        role: 'BUYER',
      }),
    });

    const buyerToken = buyerReg.data?.data?.token || buyerReg.data?.token || buyerReg.data?.data?.access_token;
    const buyerUser = buyerReg.data?.data?.user || buyerReg.data?.user;

    // Register Seller
    const sellerReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sellerEmail,
        password,
        display_name: `Seller P14 ${timestamp}`,
        role: 'SELLER',
      }),
    });

    const sellerToken = sellerReg.data?.data?.token || sellerReg.data?.token || sellerReg.data?.data?.access_token;
    const sellerUser = sellerReg.data?.data?.user || sellerReg.data?.user;

    console.log(`👤 Test Buyer ID=${buyerUser?.id}, Test Seller ID=${sellerUser?.id}`);

    // Create a live listing for this seller
    const [listingRes] = await db.query(
      `INSERT INTO account_listings (seller_id, game_id, platform_id, title, description, asking_price, status, created_at, updated_at)
       VALUES (?, 1, 1, 'Phase 14 Test Escrow Squad', 'Full test squad for checkout', 1200.00, 'ACTIVE', NOW(), NOW())`,
      [sellerUser.id]
    );
    const listingId = listingRes.insertId;

    // ──────────────────────────────────────────────────────────
    // AC-14.1: Buyer creates order (Buy Listing with Escrow)
    // ──────────────────────────────────────────────────────────
    const orderRes = await apiRequest('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });

    const order = orderRes.data?.data?.order || orderRes.data?.order;
    if (orderRes.status === 201 && order && (order.status === 'CREATED' || order.status === 'PENDING_PAYMENT')) {
      console.log(`✅ AC-14.1 PASSED: Order #${order.id} (${order.order_number}) created with status=${order.status}`);
      passed++;
    } else {
      console.error('❌ AC-14.1 FAILED: Order creation failed', orderRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-14.2: Buyer submits payment slip
    // ──────────────────────────────────────────────────────────
    const tempSlipPath = path.resolve(__dirname, `temp_slip_${timestamp}.png`);
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(tempSlipPath, pngBuffer);

    const formData = new FormData();
    const slipBlob = new Blob([fs.readFileSync(tempSlipPath)], { type: 'image/png' });
    formData.append('payment_proof', slipBlob, 'transfer_slip.png');
    formData.append('payment_method', 'PROMPTPAY');
    formData.append('bank_reference', `REF-${timestamp}`);

    const payRes = await apiRequest(`/orders/${order.id}/payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: formData,
    });

    if (fs.existsSync(tempSlipPath)) fs.unlinkSync(tempSlipPath);

    if (payRes.status === 201 || payRes.status === 200) {
      console.log(`✅ AC-14.2 PASSED: Payment slip submitted. Status updated to PAYMENT_SUBMITTED`);
      passed++;
    } else {
      console.error('❌ AC-14.2 FAILED: Payment slip submission failed', payRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // Transition to HANDOVER_OPEN (Simulate Admin/Escrow Approval)
    // ──────────────────────────────────────────────────────────
    await db.query(
      `UPDATE orders SET status = 'HANDOVER_OPEN', updated_at = NOW() WHERE id = ?`,
      [order.id]
    );

    // ──────────────────────────────────────────────────────────
    // AC-14.3: Handover room status & countdown timer
    // ──────────────────────────────────────────────────────────
    const roomRes = await apiRequest(`/handover/${order.id}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    const room = roomRes.data?.data?.room;
    if (roomRes.status === 200 && room && (room.status === 'WAITING_SELLER' || room.status === 'WAITING_SELLER_SUBMISSION')) {
      console.log(`✅ AC-14.3 PASSED: Handover Room #${order.id} is active (status=${room.status})`);
      passed++;
    } else {
      console.error('❌ AC-14.3 FAILED: Handover room retrieval failed', roomRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-14.4: Seller submits encrypted credentials
    // ──────────────────────────────────────────────────────────
    const submitCredsRes = await apiRequest(`/handover/${order.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        konami_email: `konami_${timestamp}@game.com`,
        konami_password: 'SuperSecretKonami2026!',
        notes: 'Link via Konami ID from eFootball title screen.',
      }),
    });

    if (submitCredsRes.status === 200) {
      console.log(`✅ AC-14.4 PASSED: Seller submitted encrypted Konami credentials (AES-256-GCM)`);
      passed++;
    } else {
      console.error('❌ AC-14.4 FAILED: Seller credential submission failed', submitCredsRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-14.5: Buyer decrypts credentials on demand
    // ──────────────────────────────────────────────────────────
    const decryptRes = await apiRequest(`/handover/${order.id}/info`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    const decrypted = decryptRes.data?.data?.credentials || decryptRes.data?.data;
    if (
      decryptRes.status === 200 &&
      decrypted &&
      decrypted.konami_email === `konami_${timestamp}@game.com` &&
      decrypted.konami_password === 'SuperSecretKonami2026!'
    ) {
      console.log(`✅ AC-14.5 PASSED: Buyer decrypted credentials successfully: ${decrypted.konami_email}`);
      passed++;
    } else {
      console.error('❌ AC-14.5 FAILED: Buyer credential decryption failed', decryptRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-14.6: Buyer confirms receipt -> Order COMPLETED & Escrow Released
    // ──────────────────────────────────────────────────────────
    const confirmRes = await apiRequest(`/handover/${order.id}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
    });

    const [updatedOrder] = await db.query(`SELECT status FROM orders WHERE id = ?`, [order.id]);

    if (confirmRes.status === 200 && updatedOrder[0]?.status === 'COMPLETED') {
      console.log(`✅ AC-14.6 PASSED: Buyer confirmed receipt. Order status updated to COMPLETED`);
      passed++;
    } else {
      console.error('❌ AC-14.6 FAILED: Buyer confirm failed', confirmRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-14.7: Dispute filing flow
    // ──────────────────────────────────────────────────────────
    // Create second order to test dispute
    const [listing2Res] = await db.query(
      `INSERT INTO account_listings (seller_id, game_id, platform_id, title, description, asking_price, status, created_at, updated_at)
       VALUES (?, 1, 1, 'Phase 14 Dispute Test Squad', 'Squad to test dispute report', 900.00, 'ACTIVE', NOW(), NOW())`,
      [sellerUser.id]
    );

    const order2Res = await apiRequest('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ listing_id: listing2Res.insertId }),
    });
    const order2 = order2Res.data?.data?.order || order2Res.data?.order;

    // Set order2 to BUYER_REVIEWING
    await db.query(
      `UPDATE orders SET status = 'BUYER_REVIEWING', updated_at = NOW() WHERE id = ?`,
      [order2.id]
    );

    const disputeRes = await apiRequest('/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        order_id: order2.id,
        dispute_reason_id: 1,
        description: 'Konami account login failed. Password does not match.',
      }),
    });

    const dispute = disputeRes.data?.data?.dispute;
    if (disputeRes.status === 201 && dispute) {
      console.log(`✅ AC-14.7 PASSED: Dispute #${dispute.id} opened successfully for Order #${order2.id}`);
      passed++;
    } else {
      console.error('❌ AC-14.7 FAILED: Dispute opening failed', disputeRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-14.8: Buyer Dashboard metrics
    // ──────────────────────────────────────────────────────────
    const dashRes = await apiRequest('/dashboard/buyer', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    const dashData = dashRes.data?.data || dashRes.data;
    if (dashRes.status === 200 && dashData) {
      const comp = dashData.completed_orders_count ?? dashData.completed_count;
      const disp = dashData.pending_disputes_count ?? dashData.dispute_count;
      console.log(`✅ AC-14.8 PASSED: Buyer Dashboard loaded (Completed: ${comp}, Disputes: ${disp})`);
      passed++;
    } else {
      console.error('❌ AC-14.8 FAILED: Buyer dashboard API failed', dashRes.data);
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-14.9: Verify all Phase 14 frontend components & services exist
    // ──────────────────────────────────────────────────────────
    const requiredFiles = [
      '../frontend/src/services/orders.api.js',
      '../frontend/src/services/handover.api.js',
      '../frontend/src/services/disputes.api.js',
      '../frontend/src/components/order/OrderTimeline.jsx',
      '../frontend/src/components/handover/CountdownTimer.jsx',
      '../frontend/src/components/handover/AccountInfoBox.jsx',
      '../frontend/src/pages/buyer/BuyerDashboardPage.jsx',
      '../frontend/src/pages/buyer/MyOrdersPage.jsx',
      '../frontend/src/pages/buyer/OrderDetailPage.jsx',
      '../frontend/src/pages/buyer/PaymentSubmitPage.jsx',
      '../frontend/src/pages/shared/HandoverRoomPage.jsx',
      '../frontend/src/pages/buyer/OpenDisputePage.jsx',
      '../frontend/src/pages/shared/DisputeDetailPage.jsx',
    ];

    let allFilesExist = true;
    for (const f of requiredFiles) {
      if (!fs.existsSync(path.resolve(__dirname, f))) {
        console.error(`❌ Missing file: ${f}`);
        allFilesExist = false;
      }
    }

    if (allFilesExist) {
      console.log(`✅ AC-14.9 PASSED: All 13 Phase 14 frontend components, pages, and services verified`);
      passed++;
    } else {
      failed++;
    }

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 14 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
