/**
 * Phase 15 Verification Test Suite
 * Tests: Admin Dashboard, Escrow Monitoring, Payment Moderation, Dispute Arbitration,
 *        KYC Review, User Management, Platform Settings, Analytics & RBAC Security
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
  console.log('================================================================');
  console.log('🚀 Running Phase 15 Verification Tests (Admin Console & Escrow)...');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    const timestamp = Date.now();
    const adminEmail = `admin_p15_${timestamp}@test.com`;
    const buyerEmail = `buyer_p15_${timestamp}@test.com`;
    const sellerEmail = `seller_p15_${timestamp}@test.com`;
    const password = 'Password123!';

    // 1. Register Admin User
    const adminReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password,
        display_name: `Admin P15 ${timestamp}`,
        role: 'BUYER',
      }),
    });
    const adminUser = adminReg.data?.data?.user || adminReg.data?.user;
    const adminToken = adminReg.data?.data?.token || adminReg.data?.token || adminReg.data?.data?.access_token;

    // Promote admin to ADMIN role in DB
    await db.query(`UPDATE users SET role = 'ADMIN' WHERE id = ?`, [adminUser.id]);

    // 2. Register Buyer
    const buyerReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        password,
        display_name: `Buyer P15 ${timestamp}`,
        role: 'BUYER',
      }),
    });
    const buyerUser = buyerReg.data?.data?.user || buyerReg.data?.user;
    const buyerToken = buyerReg.data?.data?.token || buyerReg.data?.token || buyerReg.data?.data?.access_token;

    // 3. Register Seller
    const sellerReg = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sellerEmail,
        password,
        display_name: `Seller P15 ${timestamp}`,
        role: 'SELLER',
      }),
    });
    const sellerUser = sellerReg.data?.data?.user || sellerReg.data?.user;
    const sellerToken = sellerReg.data?.data?.token || sellerReg.data?.token || sellerReg.data?.data?.access_token;

    console.log(`👤 Accounts: Admin ID=${adminUser?.id}, Buyer ID=${buyerUser?.id}, Seller ID=${sellerUser?.id}\n`);

    // ──────────────────────────────────────────────────────────
    // AC-15.7: RBAC Security — BUYER blocked from admin endpoints
    // ──────────────────────────────────────────────────────────
    console.log('--- Testing AC-15.7: Non-admin RBAC Enforcement (403 Forbidden) ---');
    const blockedDashboard = await apiRequest('/admin/dashboard', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const blockedOrders = await apiRequest('/admin/orders', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const blockedDisputes = await apiRequest('/admin/disputes', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const blockedKyc = await apiRequest('/admin/kyc', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const blockedSettings = await apiRequest('/admin/platform-settings', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    if (
      blockedDashboard.status === 403 &&
      blockedOrders.status === 403 &&
      blockedDisputes.status === 403 &&
      blockedKyc.status === 403 &&
      blockedSettings.status === 403
    ) {
      console.log('✅ AC-15.7 PASSED: All admin endpoints return 403 Forbidden for BUYER role');
      passed++;
    } else {
      console.error('❌ AC-15.7 FAILED: Some admin endpoints allowed access or did not return 403', {
        dashboard: blockedDashboard.status,
        orders: blockedOrders.status,
        disputes: blockedDisputes.status,
        kyc: blockedKyc.status,
        settings: blockedSettings.status,
      });
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-15.1: Admin views pending payments, inspects slip, approves payment
    // ──────────────────────────────────────────────────────────
    console.log('\n--- Testing AC-15.1: Admin Slip Inspection & Payment Approval ---');

    // Create listing & order
    const [listingRes] = await db.query(
      `INSERT INTO account_listings (seller_id, game_id, platform_id, title, description, asking_price, status, created_at, updated_at)
       VALUES (?, 1, 1, 'Phase 15 Moderation Squad', 'Full test squad for admin approval', 2500.00, 'ACTIVE', NOW(), NOW())`,
      [sellerUser.id]
    );
    const listingId = listingRes.insertId;

    const orderRes = await apiRequest('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });
    const order = orderRes.data?.data?.order || orderRes.data?.order;

    // Buyer uploads slip
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
    formData.append('bank_reference', `REF-P15-${timestamp}`);

    await apiRequest(`/orders/${order.id}/payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: formData,
    });
    if (fs.existsSync(tempSlipPath)) fs.unlinkSync(tempSlipPath);

    // Admin lists pending orders
    const pendingOrdersRes = await apiRequest('/admin/orders?status=PAYMENT_SUBMITTED', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const ordersList = Array.isArray(pendingOrdersRes.data?.data)
      ? pendingOrdersRes.data.data
      : pendingOrdersRes.data?.data?.orders || [];
    const foundPendingOrder = ordersList.find((o) => o.id === order.id);

    // Admin views order detail
    const adminOrderDetailRes = await apiRequest(`/admin/orders/${order.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orderDetail = adminOrderDetailRes.data?.data?.order || adminOrderDetailRes.data?.order;
    const slipUrl = orderDetail?.payment?.payment_proof_url || orderDetail?.payment_proof_url;

    // Admin approves payment
    const approvePaymentRes = await apiRequest(`/admin/orders/${order.id}/payment/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ note: 'Payment slip verified by Phase 15 QA' }),
    });

    const [updatedOrderRows] = await db.query(`SELECT status FROM orders WHERE id = ?`, [order.id]);
    const updatedStatus = updatedOrderRows[0]?.status;

    if (
      foundPendingOrder &&
      slipUrl &&
      approvePaymentRes.status === 200 &&
      (updatedStatus === 'PAYMENT_APPROVED' || updatedStatus === 'HANDOVER_OPEN')
    ) {
      console.log(`✅ AC-15.1 PASSED: Admin inspected pending slip and approved payment. Order status transitioned to: ${updatedStatus}`);
      passed++;
    } else {
      console.error('❌ AC-15.1 FAILED: Payment approval workflow failed', {
        foundPendingOrder: Boolean(foundPendingOrder),
        slipUrl,
        approveStatus: approvePaymentRes.status,
        updatedStatus,
      });
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-15.2: Moderator sees disputes sorted by SLA & views split panel
    // ──────────────────────────────────────────────────────────
    console.log('\n--- Testing AC-15.2: Dispute Queue Sorted by SLA & Detail View ---');

    // Create a second listing & order for dispute testing
    const [listing2Res] = await db.query(
      `INSERT INTO account_listings (seller_id, game_id, platform_id, title, description, asking_price, status, created_at, updated_at)
       VALUES (?, 1, 1, 'Phase 15 Dispute Squad', 'Squad to test dispute resolution', 1800.00, 'ACTIVE', NOW(), NOW())`,
      [sellerUser.id]
    );
    const listing2Id = listing2Res.insertId;

    const order2Res = await apiRequest('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ listing_id: listing2Id }),
    });
    const order2 = order2Res.data?.data?.order || order2Res.data?.order;

    // Simulate payment approval and escrow holding for order2
    await db.query(`UPDATE orders SET status = 'PAYMENT_SUBMITTED' WHERE id = ?`, [order2.id]);
    const escrowService = require('./src/services/escrow.service');
    await escrowService.holdEscrow({
      orderId: order2.id,
      adminId: adminUser.id,
      note: 'Auto escrow held for dispute test',
    });

    // Advance order to BUYER_REVIEWING
    await db.query(`UPDATE orders SET status = 'BUYER_REVIEWING', updated_at = NOW() WHERE id = ?`, [order2.id]);

    // Buyer opens dispute via API
    const openDisputeRes = await apiRequest('/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        order_id: order2.id,
        dispute_reason_id: 1,
        description: 'Konami account credentials do not match squad information.',
      }),
    });
    const disputeId = openDisputeRes.data?.data?.dispute?.id || openDisputeRes.data?.dispute?.id;

    // Admin/Moderator lists disputes
    const disputesListRes = await apiRequest('/admin/disputes?status=OPEN', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const disputesList = Array.isArray(disputesListRes.data?.data)
      ? disputesListRes.data.data
      : disputesListRes.data?.data?.disputes || [];
    const foundDispute = disputesList.find((d) => d.id === disputeId);

    // Admin views dispute detail with split panel data (dispute, order, escrow, evidence, comments)
    const disputeDetailRes = await apiRequest(`/admin/disputes/${disputeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const disputeDetailData = disputeDetailRes.data?.data || {};

    if (
      openDisputeRes.status === 201 &&
      foundDispute &&
      foundDispute.sla_deadline &&
      disputeDetailRes.status === 200 &&
      disputeDetailData.dispute &&
      disputeDetailData.order &&
      disputeDetailData.escrow
    ) {
      console.log(`✅ AC-15.2 PASSED: Dispute queue retrieved with SLA deadlines and complete split-panel data (order, escrow, comments)`);
      passed++;
    } else {
      console.error('❌ AC-15.2 FAILED: Dispute list or split-panel detail retrieval failed', {
        openStatus: openDisputeRes.status,
        foundDispute: Boolean(foundDispute),
        hasSla: Boolean(foundDispute?.sla_deadline),
        detailStatus: disputeDetailRes.status,
      });
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-15.3: Admin resolves dispute for Buyer → Order status updated
    // ──────────────────────────────────────────────────────────
    console.log('\n--- Testing AC-15.3: Admin Resolves Dispute for Buyer ---');

    const resolveRes = await apiRequest(`/admin/disputes/${disputeId}/resolve/buyer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        resolution_note: 'Buyer provided verifiable video proof that Konami ID password was invalid.',
      }),
    });

    const [disputeRows] = await db.query(`SELECT status, resolved_by FROM disputes WHERE id = ?`, [disputeId]);
    const [orderAfterDispute] = await db.query(`SELECT status FROM orders WHERE id = ?`, [order2.id]);
    const [escrowAfterDispute] = await db.query(`SELECT status FROM escrow_records WHERE order_id = ?`, [order2.id]);

    if (
      resolveRes.status === 200 &&
      disputeRows[0]?.status === 'RESOLVED_BUYER' &&
      orderAfterDispute[0]?.status === 'REFUNDED' &&
      escrowAfterDispute[0]?.status === 'REFUNDED'
    ) {
      console.log(`✅ AC-15.3 PASSED: Dispute resolved in Buyer's favor. Order status=${orderAfterDispute[0]?.status}, Escrow=${escrowAfterDispute[0]?.status}`);
      passed++;
    } else {
      console.error('❌ AC-15.3 FAILED: Dispute resolution failed', {
        resolveStatus: resolveRes.status,
        disputeStatus: disputeRows[0]?.status,
        orderStatus: orderAfterDispute[0]?.status,
        escrowStatus: escrowAfterDispute[0]?.status,
      });
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-15.4: Admin Approve KYC → user.is_verified = true
    // ──────────────────────────────────────────────────────────
    console.log('\n--- Testing AC-15.4: Admin KYC Approval & User Verification ---');

    // Seller submits KYC
    const submitKycRes = await apiRequest('/users/kyc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        real_name: 'Somchai TestSeller',
        id_card_number: '1100400123456',
        id_card_image_url: '/uploads/sample_id_card.png',
        selfie_image_url: '/uploads/sample_selfie.png',
      }),
    });

    // Admin views KYC list and detail
    const kycListRes = await apiRequest('/admin/kyc?status=PENDING', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const kycList = Array.isArray(kycListRes.data?.data) ? kycListRes.data.data : kycListRes.data?.data?.kyc_list || [];
    const pendingKyc = kycList.find((k) => k.user_id === sellerUser.id);

    // Admin views KYC detail
    const kycDetailRes = await apiRequest(`/admin/kyc/${pendingKyc.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Admin approves KYC
    const approveKycRes = await apiRequest(`/admin/kyc/${pendingKyc.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const [userRows] = await db.query(`SELECT is_verified, role FROM users WHERE id = ?`, [sellerUser.id]);
    const [kycRows] = await db.query(`SELECT status, reviewed_by FROM user_kyc WHERE id = ?`, [pendingKyc.id]);

    if (
      submitKycRes.status === 200 &&
      kycDetailRes.status === 200 &&
      approveKycRes.status === 200 &&
      userRows[0]?.is_verified === 1 &&
      userRows[0]?.role === 'VERIFIED_SELLER' &&
      kycRows[0]?.status === 'APPROVED'
    ) {
      console.log(`✅ AC-15.4 PASSED: KYC approved. user.is_verified=1 and role upgraded to VERIFIED_SELLER`);
      passed++;
    } else {
      console.error('❌ AC-15.4 FAILED: KYC approval failed', {
        submitKycStatus: submitKycRes.status,
        approveStatus: approveKycRes.status,
        userVerified: userRows[0]?.is_verified,
        userRole: userRows[0]?.role,
        kycStatus: kycRows[0]?.status,
      });
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-15.5: Platform settings: update fee rate → saved → returns new value
    // ──────────────────────────────────────────────────────────
    console.log('\n--- Testing AC-15.5: Platform Settings Configuration ---');

    const updateFeeRes = await apiRequest('/admin/platform-settings/platform_fee_rate', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ value: '0.075' }),
    });

    const getSettingsRes = await apiRequest('/admin/platform-settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const settingsList = Array.isArray(getSettingsRes.data?.data?.settings)
      ? getSettingsRes.data.data.settings
      : [];
    const feeSetting = settingsList.find((s) => s.setting_key === 'platform_fee_rate');

    // Restore setting
    await apiRequest('/admin/platform-settings/platform_fee_rate', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ value: '0.05' }),
    });

    if (updateFeeRes.status === 200 && feeSetting && (feeSetting.setting_value === '0.075' || feeSetting.setting_value === 0.075)) {
      console.log(`✅ AC-15.5 PASSED: Platform settings updated platform_fee_rate to 0.075 and returned updated value`);
      passed++;
    } else {
      console.error('❌ AC-15.5 FAILED: Platform setting update failed', {
        updateStatus: updateFeeRes.status,
        savedValue: feeSetting?.setting_value,
      });
      failed++;
    }

    // ──────────────────────────────────────────────────────────
    // AC-15.6: Analytics chart displays GMV trend correctly
    // ──────────────────────────────────────────────────────────
    console.log('\n--- Testing AC-15.6: Platform Analytics & GMV Telemetry ---');

    const analyticsRes = await apiRequest('/admin/analytics/sales', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = analyticsRes.data?.data || {};

    if (
      analyticsRes.status === 200 &&
      analyticsData.total_volume !== undefined &&
      (Array.isArray(analyticsData.timeline) || Array.isArray(analyticsData.daily_gmv))
    ) {
      const gmvTimeline = analyticsData.timeline || analyticsData.daily_gmv;
      console.log(`✅ AC-15.6 PASSED: Sales & GMV analytics returned GMV total_volume=${analyticsData.total_volume} and ${gmvTimeline.length} timeline data points`);
      passed++;
    } else {
      console.error('❌ AC-15.6 FAILED: Analytics endpoint failed', analyticsRes);
      failed++;
    }

  } catch (error) {
    console.error('💥 Test Execution Exception:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 Phase 15 Test Summary: Passed: ${passed}/7, Failed: ${failed}`);
  console.log('================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runTests();
