/**
 * test-phase11.js
 * Verification test suite for Phase 11: Frontend Authentication, KYC & User Profile APIs
 */

const API_BASE = 'http://localhost:5001/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 11 Verification Tests (Auth, KYC & Profile)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const timestamp = Date.now();
  const testBuyer = {
    email: `buyer_p11_${timestamp}@example.com`,
    password: 'Password@123',
    display_name: `Buyer_P11_${timestamp}`,
    role: 'BUYER',
    phone: '0812345678',
    line_id: 'buyer_line_11',
  };

  const testSeller = {
    email: `seller_p11_${timestamp}@example.com`,
    password: 'Password@123',
    display_name: `Seller_P11_${timestamp}`,
    role: 'SELLER',
    phone: '0898765432',
    line_id: 'seller_line_11',
  };

  // 1. AC-11.1: Register new Buyer
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBuyer),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data.user.email === testBuyer.email.toLowerCase()) {
      console.log('✅ AC-11.1 PASSED: Register new BUYER succeeded');
      passed++;
    } else {
      console.error('❌ AC-11.1 FAILED: Register buyer failed', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.1 FAILED with exception:', err.message);
    failed++;
  }

  // 2. AC-11.1b: Register new Seller
  let sellerToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSeller),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data.user.role === 'SELLER') {
      sellerToken = data.data.access_token;
      console.log('✅ AC-11.1b PASSED: Register new SELLER with role succeeded');
      passed++;
    } else {
      console.error('❌ AC-11.1b FAILED: Register seller failed', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.1b FAILED with exception:', err.message);
    failed++;
  }

  // 3. AC-11.2: Login with valid credentials
  let buyerToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testBuyer.email, password: testBuyer.password }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data.access_token) {
      buyerToken = data.data.access_token;
      console.log('✅ AC-11.2 PASSED: Login with valid credentials succeeded');
      passed++;
    } else {
      console.error('❌ AC-11.2 FAILED: Login failed', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.2 FAILED with exception:', err.message);
    failed++;
  }

  // 4. AC-11.3: Login with invalid credentials returns 401
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testBuyer.email, password: 'WrongPassword@999' }),
    });
    const data = await res.json();
    if (res.status === 401 && !data.success) {
      console.log('✅ AC-11.3 PASSED: Login with invalid password correctly rejected with 401');
      passed++;
    } else {
      console.error('❌ AC-11.3 FAILED: Invalid login was not rejected with 401', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.3 FAILED with exception:', err.message);
    failed++;
  }

  // 5. AC-11.4: Session check GET /auth/me
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data.user.email === testBuyer.email.toLowerCase()) {
      console.log('✅ AC-11.4 PASSED: GET /auth/me returned authentic session profile');
      passed++;
    } else {
      console.error('❌ AC-11.4 FAILED: GET /auth/me failed', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.4 FAILED with exception:', err.message);
    failed++;
  }

  // 6. AC-11.5: Update Profile PATCH /users/me
  try {
    const updatedName = `Updated_Buyer_${timestamp}`;
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ display_name: updatedName, phone: '0811112222', line_id: 'line_updated' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.data.user.display_name === updatedName) {
      console.log('✅ AC-11.5 PASSED: PATCH /users/me updated profile successfully');
      passed++;
    } else {
      console.error('❌ AC-11.5 FAILED: Profile update failed', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.5 FAILED with exception:', err.message);
    failed++;
  }

  // 7. AC-11.6: Change Password PATCH /users/me/password & login with new password
  const newPassword = 'NewSecretPassword@456';
  try {
    const res = await fetch(`${API_BASE}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ current_password: testBuyer.password, new_password: newPassword }),
    });
    const data = await res.json();

    // Verify login with new password
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testBuyer.email, password: newPassword }),
    });
    const loginData = await loginRes.json();

    if (res.status === 200 && data.success && loginRes.status === 200 && loginData.success) {
      console.log('✅ AC-11.6 PASSED: Password changed and re-authenticated with new password');
      passed++;
    } else {
      console.error('❌ AC-11.6 FAILED: Password change or re-login failed', data, loginData);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.6 FAILED with exception:', err.message);
    failed++;
  }

  // 8. AC-11.7: Forgot & Reset Password
  try {
    const resForgot = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testBuyer.email }),
    });
    const dataForgot = await resForgot.json();

    const resReset = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'test_token', new_password: 'ResetPassword@789' }),
    });
    const dataReset = await resReset.json();

    if (resForgot.status === 200 && dataForgot.success && resReset.status === 200 && dataReset.success) {
      console.log('✅ AC-11.7 PASSED: Forgot & Reset password endpoints operational');
      passed++;
    } else {
      console.error('❌ AC-11.7 FAILED: Password recovery flow failed', dataForgot, dataReset);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.7 FAILED with exception:', err.message);
    failed++;
  }

  // 9. AC-11.8: KYC Submission POST /users/kyc
  try {
    const kycPayload = {
      real_name: 'สมชาย ใจดี',
      id_card_number: '1100200300400',
      id_card_image_url: '/uploads/id_card_sample_p11.png',
      selfie_image_url: '/uploads/selfie_sample_p11.png',
    };

    const res = await fetch(`${API_BASE}/users/kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify(kycPayload),
    });
    const data = await res.json();

    if (res.status === 200 && data.success && data.data.kyc.status === 'PENDING') {
      console.log('✅ AC-11.8 PASSED: KYC submission stored with status=PENDING');
      passed++;
    } else {
      console.error('❌ AC-11.8 FAILED: KYC submit failed', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.8 FAILED with exception:', err.message);
    failed++;
  }

  // 10. AC-11.9: KYC Status Check GET /users/kyc
  try {
    const res = await fetch(`${API_BASE}/users/kyc`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const data = await res.json();

    if (res.status === 200 && data.success && data.data.kyc.real_name === 'สมชาย ใจดี') {
      console.log('✅ AC-11.9 PASSED: GET /users/kyc returned KYC verification status');
      passed++;
    } else {
      console.error('❌ AC-11.9 FAILED: GET /users/kyc failed', data);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-11.9 FAILED with exception:', err.message);
    failed++;
  }

  // Summary
  console.log('\n====================================================');
  console.log(`📊 Phase 11 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
