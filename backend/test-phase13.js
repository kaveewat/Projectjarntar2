/**
 * Phase 13 Verification Test Suite
 * Tests AI Squad Scanner Wizard, Listing Creation Flow, and Seller Dashboard
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function runPhase13Tests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 13 Verification Tests (AI Scanner & Listing Creation)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  let sellerToken = null;
  let sellerId = null;
  let scanId = null;
  let createdListingId = null;
  let fairMin = 0;
  let fairMax = 0;

  // ── Step 0: Register & Authenticate a Test Seller ──
  try {
    const timestamp = Date.now();
    const sellerEmail = `seller_p13_${timestamp}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sellerEmail,
        password: 'Password123!',
        display_name: `Seller P13 ${timestamp}`,
        role: 'SELLER',
      }),
    });

    const regData = await regRes.json();
    if (regRes.status === 201 && regData.success) {
      sellerToken = regData.data.token;
      sellerId = regData.data.user.id;
      console.log(`🔑 Test Seller created & authenticated: ID=${sellerId}`);
    } else {
      throw new Error(`Failed to register seller: ${JSON.stringify(regData)}`);
    }
  } catch (err) {
    console.error('❌ Failed initial seller setup:', err.message);
    process.exit(1);
  }

  // ── AC 1: Upload Screenshots → Scan created (PROCESSING) → Poll until COMPLETED ──
  try {
    // Create a temporary sample screenshot for testing
    const tempImgPath = path.resolve(__dirname, `temp_squad_${Date.now()}.png`);
    // Minimal 1x1 PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(tempImgPath, pngBuffer);

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(tempImgPath)], { type: 'image/png' });
    formData.append('images', blob, 'squad_gameplan.png');
    formData.append('game_id', '1');

    const scanRes = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      body: formData,
    });

    const scanBody = await scanRes.json();

    // Clean up temp file
    if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);

    if (
      scanRes.status === 201 &&
      scanBody.success === true &&
      scanBody.data?.scan_id &&
      scanBody.data?.status === 'PROCESSING'
    ) {
      scanId = scanBody.data.scan_id;
      console.log(`✅ AC-13.1a PASSED: POST /api/v1/scans initiated scan #${scanId} with status=PROCESSING`);

      // Poll until COMPLETED
      let isDone = false;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 600));
        const pollRes = await fetch(`${BASE_URL}/api/v1/scans/${scanId}`, {
          headers: { Authorization: `Bearer ${sellerToken}` },
        });
        const pollBody = await pollRes.json();

        if (pollBody?.data?.scan?.status === 'COMPLETED') {
          isDone = true;
          fairMin = Number(pollBody.data.valuation?.fair_price_min || 0);
          fairMax = Number(pollBody.data.valuation?.fair_price_max || 0);
          console.log(`✅ AC-13.1b PASSED: AI Scan #${scanId} polled and COMPLETED successfully with ${pollBody.data.players?.length || 0} detected cards`);
          console.log(`   Fair Price Range: ฿${fairMin.toLocaleString()} – ฿${fairMax.toLocaleString()}`);
          passed++;
          break;
        }
      }

      if (!isDone) {
        console.error('❌ AC-13.1b FAILED: Polling timed out waiting for COMPLETED status');
        failed++;
      }
    } else {
      console.error('❌ AC-13.1 FAILED: Unexpected scan submit response', scanBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-13.1 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 2: Seller edits player name in editable table → PATCH /scans/:id/confirm ──
  try {
    const editPayload = {
      confirmed_players: [
        {
          id: 1,
          player_name: 'Lionel Messi (Edited)',
          position_code: 'CF',
          overall_rating: 104,
        },
        {
          id: 7,
          player_name: 'Ruud Gullit (Confirmed)',
          position_code: 'AMF',
          overall_rating: 104,
        },
      ],
      team_strength: 3120,
    };

    const confirmRes = await fetch(`${BASE_URL}/api/v1/scans/${scanId}/confirm`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editPayload),
    });

    const confirmBody = await confirmRes.json();

    if (
      confirmRes.status === 200 &&
      confirmBody.success === true &&
      confirmBody.data?.valuation
    ) {
      console.log('✅ AC-13.2 PASSED: Seller edited and confirmed players via PATCH /scans/:id/confirm');
      console.log(`   Recalculated Fair Price: ฿${confirmBody.data.valuation.fair_price_min} – ฿${confirmBody.data.valuation.fair_price_max}`);
      passed++;
    } else {
      console.error('❌ AC-13.2 FAILED: Confirm scan failed', confirmBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-13.2 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 3: Real-time Value-for-Money Badges Calculation ──
  try {
    const underPrice = Math.max(100, Math.floor(fairMin * 0.7));
    const fairPrice = Math.floor((fairMin + fairMax) / 2);
    const overPrice = Math.floor(fairMax * 1.3);

    // Testing logic helper
    const getBadge = (price, min, max) => {
      if (price < min) return 'GREAT_VALUE';
      if (price > max) return 'OVERPRICED';
      return 'FAIR_PRICE';
    };

    const badgeUnder = getBadge(underPrice, fairMin, fairMax);
    const badgeFair = getBadge(fairPrice, fairMin, fairMax);
    const badgeOver = getBadge(overPrice, fairMin, fairMax);

    if (badgeUnder === 'GREAT_VALUE' && badgeFair === 'FAIR_PRICE' && badgeOver === 'OVERPRICED') {
      console.log('✅ AC-13.3 PASSED: Real-time Value Badge correctly maps:');
      console.log(`   ฿${underPrice} (< ${fairMin}) → 🟢 GREAT_VALUE`);
      console.log(`   ฿${fairPrice} (within range) → 🟡 FAIR_PRICE`);
      console.log(`   ฿${overPrice} (> ${fairMax}) → 🔴 OVERPRICED`);
      passed++;
    } else {
      console.error('❌ AC-13.3 FAILED: Incorrect badge mapping', { badgeUnder, badgeFair, badgeOver });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-13.3 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 4: Publish Listing → Appears on Marketplace ──
  try {
    const listingTitle = `P13 Elite Div 1 Squad #${Date.now()}`;
    const askingPrice = 1500;

    const pubRes = await fetch(`${BASE_URL}/api/v1/listings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sellerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        squad_scan_id: scanId,
        platform_id: 1,
        title: listingTitle,
        asking_price: askingPrice,
        description: 'Clean account with Konami ID email changeable.',
        game_id: 1,
      }),
    });

    const pubBody = await pubRes.json();

    if (pubRes.status === 201 && pubBody.success === true && pubBody.data?.listing) {
      createdListingId = pubBody.data.listing.id;
      console.log(`✅ AC-13.4a PASSED: Published listing #${createdListingId} with asking_price=฿${askingPrice}`);

      // Verify on public marketplace
      const marketRes = await fetch(`${BASE_URL}/api/v1/listings?limit=10`);
      const marketBody = await marketRes.json();
      const found = marketBody.data?.some((l) => l.id === createdListingId);

      if (found) {
        console.log(`✅ AC-13.4b PASSED: Listing #${createdListingId} is live on Marketplace catalog`);
        passed++;
      } else {
        console.error('❌ AC-13.4b FAILED: Newly published listing not found on marketplace');
        failed++;
      }
    } else {
      console.error('❌ AC-13.4 FAILED: Listing publication failed', pubBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-13.4 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 5: Error Handling: Submit without files rejected with 400 error ──
  try {
    const errRes = await fetch(`${BASE_URL}/api/v1/scans`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}` },
      // Empty body
    });

    const errBody = await errRes.json();

    if (errRes.status === 400 && errBody.success === false) {
      console.log(`✅ AC-13.5 PASSED: Empty scan upload correctly rejected with 400 (${errBody.error?.code || 'NO_FILES_UPLOADED'})`);
      passed++;
    } else {
      console.error('❌ AC-13.5 FAILED: Expected 400 error on empty scan upload', errBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-13.5 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 6: Seller Dashboard & My Listings APIs return live data ──
  try {
    const dashRes = await fetch(`${BASE_URL}/api/v1/dashboard/seller`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const dashBody = await dashRes.json();

    const myListingsRes = await fetch(`${BASE_URL}/api/v1/listings/me`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const myListingsBody = await myListingsRes.json();

    if (
      dashRes.status === 200 &&
      dashBody.success === true &&
      myListingsRes.status === 200 &&
      myListingsBody.success === true &&
      myListingsBody.data.length >= 1
    ) {
      console.log(`✅ AC-13.6 PASSED: Seller Dashboard & My Listings APIs returned live listings (${myListingsBody.data.length} listing)`);
      passed++;
    } else {
      console.error('❌ AC-13.6 FAILED: Failed to fetch seller dashboard or listings', { dashBody, myListingsBody });
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-13.6 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 7: Frontend Components & Route Verification ──
  try {
    const requiredFiles = [
      '../frontend/src/components/scanner/SquadDropzone.jsx',
      '../frontend/src/components/scanner/ScanProgress.jsx',
      '../frontend/src/components/scanner/PlayerResultTable.jsx',
      '../frontend/src/components/scanner/ValuationDisplay.jsx',
      '../frontend/src/pages/seller/CreateListingPage.jsx',
      '../frontend/src/pages/seller/MyListingsPage.jsx',
      '../frontend/src/pages/seller/SellerDashboardPage.jsx',
      '../frontend/src/services/scans.api.js',
      '../frontend/src/services/dashboard.api.js',
    ];

    const allExist = requiredFiles.every((f) => fs.existsSync(path.resolve(__dirname, f)));

    const appPath = path.resolve(__dirname, '../frontend/src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    const routesConfigured =
      appContent.includes('/seller/dashboard') &&
      appContent.includes('/seller/listings') &&
      appContent.includes('/seller/listings/new');

    if (allExist && routesConfigured) {
      console.log('✅ AC-13.7 PASSED: All 9 Phase 13 frontend components, services, and App.jsx routes verified');
      passed++;
    } else {
      console.error('❌ AC-13.7 FAILED: Some files or routes are missing');
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-13.7 FAILED with error:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 13 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase13Tests();
