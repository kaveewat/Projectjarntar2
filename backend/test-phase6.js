/**
 * Phase 6 Automated Verification Test Script
 * Tests: Listing Management, Search/Filter Catalog, Validation & Limits, Admin Moderation
 */

const BASE_URL = 'http://localhost:5001';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 6 Verification Tests (Listings & Catalog)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // ── Step 0: Auth Setup (Admin and Test Sellers) ──
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
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.data.access_token;
  console.log('   ✅ Admin authenticated');

  // 0b: Register Primary Test Seller
  const sellerEmail = `seller_p6_${Date.now()}@example.com`;
  const sellerRegRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: sellerEmail,
      password: 'SellerPassword@123',
      display_name: 'Epic Squad Trader',
      role: 'SELLER',
    }),
  });
  const sellerRegData = await sellerRegRes.json();
  const sellerToken = sellerRegData.data.access_token;
  const sellerId = sellerRegData.data.user.id;
  console.log(`   ✅ Test Seller registered: ${sellerEmail} (ID: ${sellerId})`);

  // 0c: Create 4 COMPLETED scans for this seller so we can test listing creation and limits
  const scanIds = [];
  for (let i = 0; i < 4; i++) {
    const formData = new FormData();
    formData.append('game_id', '1');
    const dummyImageBytes = new Uint8Array(1024);
    dummyImageBytes.fill(200 + i);
    formData.append(
      'images',
      new Blob([dummyImageBytes], { type: 'image/jpeg' }),
      `squad_screen_${i}.jpg`
    );

    const scanRes = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: formData,
    });
    const scanData = await scanRes.json();
    scanIds.push(scanData.data.scan_id);
    await sleep(100); // Allow async worker to complete scan
  }

  // Poll scan completion
  for (const sId of scanIds) {
    let attempts = 0;
    while (attempts < 10) {
      const checkRes = await fetch(`${BASE_URL}/api/v1/scans/${sId}`, {
        headers: { Authorization: `Bearer ${sellerToken}` },
      });
      const checkData = await checkRes.json();
      if (checkData.data && checkData.data.status === 'COMPLETED') break;
      await sleep(100);
      attempts++;
    }
  }
  console.log(`   ✅ Created and completed ${scanIds.length} squad scans: [${scanIds.join(', ')}]\n`);

  // Helper to create listing
  const createListingHelper = async (scanId, title, askingPrice, platformId = 1) => {
    const res = await fetch(`${BASE_URL}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        squad_scan_id: scanId,
        platform_id: platformId,
        game_id: 1,
        title,
        description: 'Clean squad with Big Time & Epic cards. No ban history.',
        asking_price: askingPrice,
      }),
    });
    return res;
  };

  let listing1Id = null;
  let listing2Id = null;
  let listing3Id = null;

  // ── AC 1: GET /api/v1/listings returns list of ACTIVE listings with pagination metadata ──
  try {
    // First, create Listing 1 (price 1200, within fair price range)
    const createRes1 = await createListingHelper(scanIds[0], 'Stacked Div 1 Squad - Messi & Rummenigge', 1200);
    const createData1 = await createRes1.json();
    if (createRes1.status !== 201) {
      throw new Error(`Failed to create test listing 1: ${JSON.stringify(createData1)}`);
    }
    listing1Id = createData1.data.listing.id;

    // Create Listing 2 (price 500, underpriced -> GREAT_VALUE)
    const createRes2 = await createListingHelper(scanIds[1], 'Budget Beast Squad Fast Sale', 500);
    const createData2 = await createRes2.json();
    listing2Id = createData2.data.listing.id;

    // Fetch listings
    const res = await fetch(`${BASE_URL}/api/v1/listings?page=1&limit=10`);
    const body = await res.json();

    if (
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.data) &&
      body.data.length >= 2 &&
      body.meta &&
      typeof body.meta.total === 'number' &&
      body.meta.page === 1 &&
      body.meta.limit === 10 &&
      body.meta.totalPages >= 1
    ) {
      console.log('✅ AC-6.1 PASSED: GET /api/v1/listings returns ACTIVE listings with pagination metadata');
      console.log(`   (Retrieved ${body.data.length} listings, total: ${body.meta.total})`);
      passed++;
    } else {
      console.error('❌ AC-6.1 FAILED: Unexpected response structure', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.1 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 2: Filter ?player_name=Messi returns only listings containing Lionel Messi card ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/listings?player_name=Messi`);
    const body = await res.json();

    if (
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.data) &&
      body.data.length > 0 &&
      body.data.some((l) => l.id === listing1Id)
    ) {
      console.log(`✅ AC-6.2 PASSED: Filter ?player_name=Messi returned ${body.data.length} matched listing(s) containing Messi`);
      passed++;
    } else {
      console.error('❌ AC-6.2 FAILED: Expected listings containing Messi', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.2 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 3: Filter ?min_price=500&max_price=2000 returns listings in price range ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/listings?min_price=500&max_price=2000`);
    const body = await res.json();

    const allInRange = body.data && body.data.every((l) => l.asking_price >= 500 && l.asking_price <= 2000);

    if (res.status === 200 && body.success === true && allInRange && body.data.length >= 2) {
      console.log(`✅ AC-6.3 PASSED: Filter ?min_price=500&max_price=2000 correctly filtered ${body.data.length} listings`);
      passed++;
    } else {
      console.error('❌ AC-6.3 FAILED: Price filtering failed', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.3 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 4: Filter ?badge=GREAT_VALUE returns only listings flagged as GREAT_VALUE ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/listings?badge=GREAT_VALUE`);
    const body = await res.json();

    const allGreatValue = body.data && body.data.length > 0 && body.data.every((l) => l.value_badge === 'GREAT_VALUE');

    if (res.status === 200 && body.success === true && allGreatValue) {
      console.log(`✅ AC-6.4 PASSED: Filter ?badge=GREAT_VALUE returned ${body.data.length} GREAT_VALUE listing(s)`);
      passed++;
    } else {
      console.error('❌ AC-6.4 FAILED: Badge filter returned unexpected listings', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.4 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 5: POST /api/v1/listings with non-completed scan returns 422 error ──
  try {
    // 5a: Test with a non-existent scan ID (e.g. 999999)
    const resNonExistent = await fetch(`${BASE_URL}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        squad_scan_id: 999999,
        platform_id: 1,
        title: 'Squad with invalid scan',
        asking_price: 1000,
      }),
    });
    const bodyNonExistent = await resNonExistent.json();

    if (
      resNonExistent.status === 422 &&
      bodyNonExistent.success === false &&
      (bodyNonExistent.error.code === 'SCAN_NOT_FOUND' || bodyNonExistent.error.code === 'SCAN_NOT_COMPLETED')
    ) {
      console.log(`✅ AC-6.5 PASSED: POST /api/v1/listings with non-completed/non-existent scan rejected with 422 (${bodyNonExistent.error.code})`);
      passed++;
    } else {
      console.error('❌ AC-6.5 FAILED: Expected 422 for non-completed scan', bodyNonExistent);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.5 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 6: Seller cannot create > 3 active listings simultaneously (receives 422 limit error) ──
  try {
    // We already have listing1 and listing2. Create listing3 (active count becomes 3)
    const createRes3 = await createListingHelper(scanIds[2], 'Third Active Squad Listing', 1500);
    const createData3 = await createRes3.json();
    if (createRes3.status !== 201) {
      throw new Error(`Failed to create listing 3: ${JSON.stringify(createData3)}`);
    }
    listing3Id = createData3.data.listing.id;

    // Now attempt to create 4th active listing (should be rejected with 422 ACTIVE_LISTING_LIMIT_REACHED)
    const createRes4 = await createListingHelper(scanIds[3], 'Fourth Squad Attempt Over Limit', 2000);
    const createBody4 = await createRes4.json();

    if (
      createRes4.status === 422 &&
      createBody4.success === false &&
      createBody4.error.code === 'ACTIVE_LISTING_LIMIT_REACHED'
    ) {
      console.log(`✅ AC-6.6 PASSED: 4th active listing blocked with 422 ACTIVE_LISTING_LIMIT_REACHED: "${createBody4.error.message}"`);
      passed++;
    } else {
      console.error('❌ AC-6.6 FAILED: Expected 422 ACTIVE_LISTING_LIMIT_REACHED but got:', createRes4.status, createBody4);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.6 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 7: DELETE /api/v1/listings/:id by owner transitions status to CANCELLED ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/listings/${listing3Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const body = await res.json();

    // Verify detail check
    const checkRes = await fetch(`${BASE_URL}/api/v1/listings/${listing3Id}`);
    const checkBody = await checkRes.json();

    if (
      res.status === 200 &&
      body.success === true &&
      body.data.listing.status === 'CANCELLED' &&
      checkBody.data.listing.status === 'CANCELLED'
    ) {
      console.log(`✅ AC-6.7 PASSED: DELETE /api/v1/listings/${listing3Id} transitioned status to CANCELLED`);
      passed++;
    } else {
      console.error('❌ AC-6.7 FAILED: Listing status not cancelled properly', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.7 FAILED with exception:', err.message);
    failed++;
  }

  // ── AC 8: Admin PATCH /api/v1/admin/listings/:id/suspend transitions status to SUSPENDED ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/listings/${listing1Id}/suspend`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reason: 'Suspicious account credential claims reported',
      }),
    });
    const body = await res.json();

    // Verify detail reflects SUSPENDED
    const checkRes = await fetch(`${BASE_URL}/api/v1/listings/${listing1Id}`);
    const checkBody = await checkRes.json();

    // Verify suspended listing is hidden from public browse listings
    const browseRes = await fetch(`${BASE_URL}/api/v1/listings`);
    const browseBody = await browseRes.json();
    const isHiddenFromBrowse = !browseBody.data.some((l) => l.id === listing1Id);

    if (
      res.status === 200 &&
      body.success === true &&
      body.data.listing.status === 'SUSPENDED' &&
      checkBody.data.listing.status === 'SUSPENDED' &&
      isHiddenFromBrowse
    ) {
      console.log(`✅ AC-6.8 PASSED: Admin suspended listing ${listing1Id} -> status is SUSPENDED & hidden from public browse`);
      passed++;
    } else {
      console.error('❌ AC-6.8 FAILED: Admin suspend failed or still visible in browse', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-6.8 FAILED with exception:', err.message);
    failed++;
  }

  // ── Extra Quality Check: Master Data Player Catalog Endpoints ──
  try {
    const [tiersRes, posRes, gamesRes, playersRes] = await Promise.all([
      fetch(`${BASE_URL}/api/v1/players/tiers`),
      fetch(`${BASE_URL}/api/v1/players/positions`),
      fetch(`${BASE_URL}/api/v1/players/games`),
      fetch(`${BASE_URL}/api/v1/players?limit=5`),
    ]);

    const tiersBody = await tiersRes.json();
    const posBody = await posRes.json();
    const gamesBody = await gamesRes.json();
    const playersBody = await playersRes.json();

    if (
      tiersRes.status === 200 &&
      posRes.status === 200 &&
      gamesRes.status === 200 &&
      playersRes.status === 200 &&
      tiersBody.data.tiers.length > 0 &&
      posBody.data.positions.length > 0 &&
      gamesBody.data.games.length > 0 &&
      playersBody.data.length > 0
    ) {
      console.log('✅ EXTRA PASSED: Player catalog & master metadata endpoints fully functional');
      passed++;
    } else {
      console.error('❌ EXTRA FAILED: Master data catalog returned unexpected structure');
      failed++;
    }
  } catch (err) {
    console.error('❌ EXTRA FAILED with exception:', err.message);
    failed++;
  }

  // ── Summary ──
  console.log('\n====================================================');
  console.log(`📊 Phase 6 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
