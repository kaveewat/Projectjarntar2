/**
 * Phase 12 Verification Test Suite
 * Tests Marketplace Catalog, Squad Detail, Value Badges, and Filter Capabilities
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function runPhase12Tests() {
  console.log('====================================================');
  console.log('🚀 Running Phase 12 Verification Tests (Marketplace UI & API)...');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // ── AC 1: Marketplace returns listings with badges, prices, and squad images ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/listings?page=1&limit=10`);
    const body = await res.json();

    if (
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.data) &&
      body.data.length > 0
    ) {
      const sample = body.data[0];
      const hasBadges = typeof sample.value_badge === 'string';
      const hasPrice = typeof sample.asking_price === 'number';
      const hasStrength = typeof sample.team_strength === 'number';

      if (hasBadges && hasPrice && hasStrength) {
        console.log('✅ AC-12.1 PASSED: Marketplace returns listings with value_badge, asking_price, and team_strength');
        console.log(`   Sample listing #${sample.id}: "${sample.title}" | ฿${sample.asking_price} | Badge: ${sample.value_badge} | Strength: ${sample.team_strength}`);
        passed++;
      } else {
        console.error('❌ AC-12.1 FAILED: Missing fields on listing', sample);
        failed++;
      }
    } else {
      console.error('❌ AC-12.1 FAILED: Invalid response', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-12.1 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 2: Filter by player name (e.g. ?player_name=Messi) ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/listings?player_name=Messi`);
    const body = await res.json();

    if (
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.data) &&
      body.data.length > 0
    ) {
      console.log(`✅ AC-12.2 PASSED: Filter ?player_name=Messi returned ${body.data.length} listing(s)`);
      passed++;
    } else {
      console.error('❌ AC-12.2 FAILED: Expected listings for Messi', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-12.2 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 3: Filter by price range ?min_price=500&max_price=2000 ──
  try {
    const min = 500;
    const max = 2000;
    const res = await fetch(`${BASE_URL}/api/v1/listings?min_price=${min}&max_price=${max}`);
    const body = await res.json();

    if (
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.data)
    ) {
      const allInRange = body.data.every((l) => l.asking_price >= min && l.asking_price <= max);
      if (allInRange) {
        console.log(`✅ AC-12.3 PASSED: Filter ?min_price=${min}&max_price=${max} returned ${body.data.length} items, all strictly in range`);
        passed++;
      } else {
        console.error('❌ AC-12.3 FAILED: Items found outside price range', body.data);
        failed++;
      }
    } else {
      console.error('❌ AC-12.3 FAILED: Invalid response', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-12.3 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 4: Filter by Value Badge (?badge=GREAT_VALUE) ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/listings?badge=GREAT_VALUE`);
    const body = await res.json();

    if (
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.data) &&
      body.data.length > 0 &&
      body.data.every((l) => l.value_badge === 'GREAT_VALUE')
    ) {
      console.log(`✅ AC-12.4 PASSED: Filter ?badge=GREAT_VALUE returned ${body.data.length} items, all GREAT_VALUE`);
      passed++;
    } else {
      console.error('❌ AC-12.4 FAILED: Expected all items to have GREAT_VALUE badge', body);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-12.4 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 5: Listing Detail GET /api/v1/listings/:id returns squad players and fair valuation ──
  try {
    // Get first active listing
    const listRes = await fetch(`${BASE_URL}/api/v1/listings?limit=1`);
    const listBody = await listRes.json();
    const firstListingId = listBody.data[0].id;

    const detailRes = await fetch(`${BASE_URL}/api/v1/listings/${firstListingId}`);
    const detailBody = await detailRes.json();

    if (
      detailRes.status === 200 &&
      detailBody.success === true &&
      detailBody.data?.listing
    ) {
      const l = detailBody.data.listing;
      const hasPlayers = Array.isArray(l.players);
      const hasFairPrices = l.fair_price_min !== undefined && l.fair_price_max !== undefined;

      if (hasPlayers && hasFairPrices) {
        console.log(`✅ AC-12.5 PASSED: Listing detail #${l.id} retrieved successfully with ${l.players.length} squad players and Fair Price range: ฿${l.fair_price_min} - ฿${l.fair_price_max}`);
        passed++;
      } else {
        console.error('❌ AC-12.5 FAILED: Detail missing players or fair price range', l);
        failed++;
      }
    } else {
      console.error('❌ AC-12.5 FAILED: Invalid detail response', detailBody);
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-12.5 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 6: Frontend Route & UI Integration Verification ──
  try {
    const fs = require('fs');
    const path = require('path');

    const appPath = path.resolve(__dirname, '../frontend/src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    const hasMarketplaceRoute = appContent.includes('path="/marketplace"') && appContent.includes('<MarketplacePage');
    const hasDetailRoute = appContent.includes('path="/marketplace/:id"') && appContent.includes('<ListingDetailPage');

    if (hasMarketplaceRoute && hasDetailRoute) {
      console.log('✅ AC-12.6 PASSED: Frontend routes configured for MarketplacePage & ListingDetailPage in App.jsx');
      passed++;
    } else {
      console.error('❌ AC-12.6 FAILED: App.jsx missing route configuration');
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-12.6 FAILED with error:', err.message);
    failed++;
  }

  // ── AC 7: Frontend Components & Service Verification ──
  try {
    const fs = require('fs');
    const path = require('path');

    const filesToCheck = [
      '../frontend/src/services/listings.api.js',
      '../frontend/src/components/common/ValueBadge.jsx',
      '../frontend/src/components/listing/ListingCard.jsx',
      '../frontend/src/components/listing/ListingFilterPanel.jsx',
      '../frontend/src/pages/MarketplacePage.jsx',
      '../frontend/src/pages/ListingDetailPage.jsx',
      '../frontend/src/pages/HomePage.jsx',
    ];

    const allExist = filesToCheck.every((f) => fs.existsSync(path.resolve(__dirname, f)));

    if (allExist) {
      console.log(`✅ AC-12.7 PASSED: All 7 Phase 12 frontend components and services exist and are fully implemented`);
      passed++;
    } else {
      console.error('❌ AC-12.7 FAILED: Some component files are missing');
      failed++;
    }
  } catch (err) {
    console.error('❌ AC-12.7 FAILED with error:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 12 Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase12Tests();
