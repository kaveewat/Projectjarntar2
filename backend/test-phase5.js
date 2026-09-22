/**
 * Phase 5 Automated Verification Test Script
 */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 5 Verification Tests (AI Scanner & Valuation)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Step 0: Register a seller user for scan tests
  const sellerEmail = `seller_scan_${Date.now()}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: sellerEmail,
      password: 'SellerPassword@123',
      display_name: 'Pro Squad Seller',
      role: 'SELLER',
    }),
  });

  const registerData = await registerRes.json();
  const token = registerData.data.access_token;
  console.log(`🔑 Authenticated as test seller: ${sellerEmail}\n`);

  let completedScanId = null;

  // ── AC 1: POST /api/v1/scans + Squad image → creates scan with status=PROCESSING ──
  try {
    const formData = new FormData();
    formData.append('game_id', '1');

    // Create a dummy 1KB JPEG image blob
    const dummyImageBytes = new Uint8Array(1024);
    dummyImageBytes.fill(255);
    formData.append(
      'images',
      new Blob([dummyImageBytes], { type: 'image/jpeg' }),
      'squad_screenshot_01.jpg'
    );

    const res = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const body = await res.json();

    if (
      res.status === 201 &&
      body.success === true &&
      body.data.scan_id &&
      body.data.status === 'PROCESSING'
    ) {
      completedScanId = body.data.scan_id;
      console.log('✅ PASS [AC 1]: POST /api/v1/scans creates scan record with status=PROCESSING');
      console.log(`   Created Scan ID: ${completedScanId}`);
      passed++;
    } else {
      console.error('❌ FAIL [AC 1]: Unexpected response on submit scan:', res.status, body);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 1]: Error in submit scan:', err.message);
    failed++;
  }

  // ── AC 2: AI processing completes successfully → status=COMPLETED, players recorded ──
  try {
    console.log('   Waiting for AI processing to complete...');
    let isCompleted = false;
    let scanResult = null;

    // Poll up to 10 seconds (check every 500ms)
    for (let attempt = 1; attempt <= 20; attempt++) {
      await sleep(500);
      const res = await fetch(`${BASE_URL}/api/v1/scans/${completedScanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (body.success && body.data.scan.status === 'COMPLETED') {
        isCompleted = true;
        scanResult = body.data;
        break;
      }
    }

    if (
      isCompleted &&
      scanResult.players &&
      scanResult.players.length > 0 &&
      scanResult.scan.status === 'COMPLETED'
    ) {
      console.log('✅ PASS [AC 2]: AI analysis finished with status=COMPLETED and recorded players');
      console.log(`   Detected Players Count: ${scanResult.players.length}`);
      console.log(`   Sample Player: ${scanResult.players[0].detected_name} (${scanResult.players[0].detected_tier})`);
      passed++;
    } else {
      console.error('❌ FAIL [AC 2]: AI analysis did not complete as expected:', scanResult);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 2]: Error checking AI completion:', err.message);
    failed++;
  }

  // ── AC 3: GET /api/v1/scans/:id/valuation → fair_price_min, fair_price_max, algorithm_version ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/scans/${completedScanId}/valuation?asking_price=1200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    if (
      res.status === 200 &&
      body.success === true &&
      body.data.valuation &&
      typeof body.data.valuation.fair_price_min === 'number' &&
      typeof body.data.valuation.fair_price_max === 'number' &&
      body.data.valuation.algorithm_version &&
      body.data.valuation.badge
    ) {
      console.log('✅ PASS [AC 3]: GET /api/v1/scans/:id/valuation returns fair price range, algorithm, and badge');
      console.log(`   Fair Price Range: ฿${body.data.valuation.fair_price_min} - ฿${body.data.valuation.fair_price_max}`);
      console.log(`   Algorithm Version: ${body.data.valuation.algorithm_version}`);
      console.log(`   Value Badge: ${body.data.valuation.badge}`);
      passed++;
    } else {
      console.error('❌ FAIL [AC 3]: Unexpected valuation response:', res.status, body);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 3]: Error getting valuation:', err.message);
    failed++;
  }

  // ── AC 4: AI failure (API down / blurry image) → status=FAILED, clear error_message ──
  try {
    const formData = new FormData();
    formData.append('game_id', '1');
    formData.append(
      'images',
      new Blob([new Uint8Array(500)], { type: 'image/jpeg' }),
      'simulate_failure_blurry.jpg'
    );

    const submitRes = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const submitBody = await submitRes.json();
    const failedScanId = submitBody.data.scan_id;

    // Poll for failure completion
    let isFailed = false;
    let failedScanData = null;

    for (let attempt = 1; attempt <= 15; attempt++) {
      await sleep(400);
      const res = await fetch(`${BASE_URL}/api/v1/scans/${failedScanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (body.success && body.data.scan.status === 'FAILED') {
        isFailed = true;
        failedScanData = body.data.scan;
        break;
      }
    }

    if (
      isFailed &&
      failedScanData.status === 'FAILED' &&
      failedScanData.error_message &&
      failedScanData.error_message.length > 0
    ) {
      console.log('✅ PASS [AC 4]: AI failure gracefully captured with status=FAILED and error_message');
      console.log(`   Recorded Error Message: "${failedScanData.error_message}"`);
      passed++;
    } else {
      console.error('❌ FAIL [AC 4]: Failure state not captured properly:', failedScanData);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 4]: Error testing failure path:', err.message);
    failed++;
  }

  // ── AC 5: Temporary files cleaned up after process (check backend/uploads/ is empty) ──
  try {
    const uploadDir = path.resolve(__dirname, 'uploads');
    let remainingFiles = [];

    if (fs.existsSync(uploadDir)) {
      remainingFiles = fs.readdirSync(uploadDir).filter((file) => file !== '.gitkeep');
    }

    if (remainingFiles.length === 0) {
      console.log('✅ PASS [AC 5]: Temporary upload files cleaned up from backend/uploads/ (directory is empty)');
      passed++;
    } else {
      console.error(`❌ FAIL [AC 5]: Temp files still remaining in uploads directory:`, remainingFiles);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 5]: Error checking temp uploads cleanup:', err.message);
    failed++;
  }

  // ── AC 6: Non-image file upload → 400 validation error (INVALID_FILE_TYPE) ──
  try {
    const formData = new FormData();
    formData.append('game_id', '1');
    formData.append(
      'images',
      new Blob(['Plain text document pretending to be squad'], { type: 'text/plain' }),
      'malicious_script.txt'
    );

    const res = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = await res.json();

    if (
      res.status === 400 &&
      body.success === false &&
      body.error.code === 'INVALID_FILE_TYPE'
    ) {
      console.log('✅ PASS [AC 6]: Non-image file upload rejected with 400 INVALID_FILE_TYPE');
      console.log(`   Error Response: ${JSON.stringify(body.error)}`);
      passed++;
    } else {
      console.error('❌ FAIL [AC 6]: Non-image upload not rejected properly:', res.status, body);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 6]: Error in non-image upload test:', err.message);
    failed++;
  }

  // ── AC 7: File exceeding 10MB → 400 validation error (FILE_TOO_LARGE) ──
  try {
    const formData = new FormData();
    formData.append('game_id', '1');

    // Create a 10.5 MB image blob
    const largeBytes = new Uint8Array(10.5 * 1024 * 1024);
    formData.append(
      'images',
      new Blob([largeBytes], { type: 'image/jpeg' }),
      'giant_squad.jpg'
    );

    const res = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = await res.json();

    if (
      res.status === 400 &&
      body.success === false &&
      body.error.code === 'FILE_TOO_LARGE'
    ) {
      console.log('✅ PASS [AC 7]: File size > 10MB rejected with 400 FILE_TOO_LARGE');
      console.log(`   Error Response: ${JSON.stringify(body.error)}`);
      passed++;
    } else {
      console.error('❌ FAIL [AC 7]: Oversized file not rejected properly:', res.status, body);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL [AC 7]: Error in oversized file test:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 5 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
