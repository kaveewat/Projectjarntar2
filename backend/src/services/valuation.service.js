/**
 * Valuation Service
 * Calculates Estimated Fair Price and Value-for-Money Badges
 */

const ALGORITHM_VERSION = 'v1.2.0';

/**
 * Calculate Fair Price range based on squad attributes and detected player cards
 * @param {object} params
 * @param {number} params.teamStrength
 * @param {Array<object>} params.playerCards
 * @returns {object} { fair_price_min, fair_price_max, algorithm_version, factors_used }
 */
const calculateFairPrice = ({ teamStrength = 2800, playerCards = [] }) => {
  const parsedStrength = Math.max(1500, Math.min(3400, Number(teamStrength) || 2800));

  // 1. Base floor value for an active account
  const BASE_FLOOR = 150;

  // 2. Team strength bonus curve
  let strengthBonus = 0;
  if (parsedStrength >= 3100) {
    strengthBonus = 400 + (parsedStrength - 3100) * 4.0;
  } else if (parsedStrength >= 3000) {
    strengthBonus = 200 + (parsedStrength - 3000) * 2.0;
  } else if (parsedStrength >= 2800) {
    strengthBonus = (parsedStrength - 2800) * 1.0;
  }

  // 3. Player cards valuation
  let cardsValueSum = 0;
  let rareCardsCount = 0;

  for (const card of playerCards) {
    const baseVal = Number(card.base_value) || 0;
    const tier = (card.detected_tier || card.tier_name || '').toLowerCase();

    // Categorize rarity
    if (tier.includes('epic') || tier.includes('big time') || tier.includes('show time')) {
      rareCardsCount += 1;
    }

    if (baseVal > 0) {
      cardsValueSum += baseVal;
    } else {
      // Fallback estimate by tier if base_value is missing
      if (tier.includes('big time')) cardsValueSum += 600;
      else if (tier.includes('epic')) cardsValueSum += 450;
      else if (tier.includes('show time')) cardsValueSum += 350;
      else if (tier.includes('highlight')) cardsValueSum += 80;
      else cardsValueSum += 20;
    }
  }

  // 4. Total estimated median value
  const totalEstimate = BASE_FLOOR + strengthBonus + cardsValueSum;

  // 5. Calculate range (min ~ 90%, max ~ 115%)
  const fairPriceMin = Math.max(150, Math.round((totalEstimate * 0.9) / 10) * 10);
  const fairPriceMax = Math.max(fairPriceMin + 50, Math.round((totalEstimate * 1.15) / 10) * 10);

  return {
    fair_price_min: Number(fairPriceMin.toFixed(2)),
    fair_price_max: Number(fairPriceMax.toFixed(2)),
    algorithm_version: ALGORITHM_VERSION,
    factors_used: {
      team_strength: parsedStrength,
      strength_bonus: Math.round(strengthBonus),
      total_cards_detected: playerCards.length,
      rare_cards_count: rareCardsCount,
      cards_value_sum: Math.round(cardsValueSum),
      base_floor: BASE_FLOOR,
      estimated_median: Math.round(totalEstimate),
    },
  };
};

/**
 * Calculate Value-for-Money badge based on asking price vs fair price range
 * 🟢 GREAT_VALUE: askingPrice <= 85% of median fair price
 * 🟡 FAIR: 85% - 115% of median fair price
 * 🔴 OVERPRICED: > 115% of median fair price
 * @param {number} askingPrice 
 * @param {number} fairPriceMin 
 * @param {number} fairPriceMax 
 * @returns {'GREAT_VALUE' | 'FAIR' | 'OVERPRICED'}
 */
const calculateValueBadge = (askingPrice, fairPriceMin, fairPriceMax) => {
  const price = Number(askingPrice);
  const min = Number(fairPriceMin);
  const max = Number(fairPriceMax);

  if (!price || price <= 0 || !min || !max) {
    return 'FAIR';
  }

  const median = (min + max) / 2;

  if (price <= median * 0.85) {
    return 'GREAT_VALUE';
  }
  if (price <= median * 1.15) {
    return 'FAIR';
  }
  return 'OVERPRICED';
};

module.exports = {
  calculateFairPrice,
  calculateValueBadge,
  ALGORITHM_VERSION,
};
