import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ValueBadge from '../common/ValueBadge';

export default function ValuationDisplay({ valuation, askingPrice = 0, teamStrength = 3050 }) {
  if (!valuation) return null;

  const {
    fair_price_min = 0,
    fair_price_max = 0,
    algorithm_version = 'v1.2.0',
    factors_used = {},
  } = valuation;

  const numPrice = Number(askingPrice) || 0;

  // Real-time Value Badge verdict calculation
  let currentBadge = 'FAIR_PRICE';
  if (numPrice > 0 && fair_price_min > 0) {
    if (numPrice < fair_price_min) {
      currentBadge = 'GREAT_VALUE';
    } else if (numPrice > fair_price_max) {
      currentBadge = 'OVERPRICED';
    } else {
      currentBadge = 'FAIR_PRICE';
    }
  }

  // Linear position percentage
  let positionPercent = 50;
  if (fair_price_min && fair_price_max && fair_price_max > fair_price_min) {
    positionPercent = Math.min(
      100,
      Math.max(0, ((numPrice - fair_price_min) / (fair_price_max - fair_price_min)) * 100)
    );
  }

  return (
    <Card
      sx={{
        bgcolor: '#0D1117',
        border: '1px solid #30363D',
        borderRadius: 2,
        p: 2.5,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.light', fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
            AI Squad Valuation Verdict
          </Typography>
        </Box>
        <Chip
          label={`AI Engine ${algorithm_version}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem', color: '#8B949E' }}
        />
      </Box>

      {/* Fair Price Range Banner */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          bgcolor: '#161B22',
          border: '1px solid #30363D',
          mb: 2.5,
        }}
      >
        <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
          Calculated Fair Price Range
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, my: 0.5 }}>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#58A6FF' }}>
            ฿{Number(fair_price_min).toLocaleString()} – ฿{Number(fair_price_max).toLocaleString()}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Based on card tiers, base values, team strength ({teamStrength ? teamStrength.toLocaleString() : 'N/A'}), and rarity multipliers.
        </Typography>
      </Box>

      {/* Real-time Badge Preview */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          bgcolor: '#161B22',
          border: '1px solid #30363D',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight={600} color="#F0F6FC">
            Marketplace Badge Preview:
          </Typography>
          <ValueBadge badge={currentBadge} size="medium" />
        </Box>

        {numPrice > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="#3FB950" fontWeight={600}>
                Min: ฿{Number(fair_price_min).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your Price: ฿{numPrice.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="#F85149" fontWeight={600}>
                Max: ฿{Number(fair_price_max).toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={positionPercent}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor:
                    currentBadge === 'GREAT_VALUE'
                      ? '#3FB950'
                      : currentBadge === 'OVERPRICED'
                      ? '#F85149'
                      : '#D29922',
                },
              }}
            />
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Enter your asking price to preview your live Value-for-Money badge.
          </Typography>
        )}
      </Box>

      {/* Advisory hint */}
      {currentBadge === 'GREAT_VALUE' && numPrice > 0 && (
        <Alert severity="success" sx={{ py: 0.5, bgcolor: 'rgba(35, 134, 54, 0.1)', color: '#3FB950' }}>
          <strong>Great Value!</strong> Priced below market estimate. Accounts with this badge sell 3x faster on average.
        </Alert>
      )}

      {currentBadge === 'OVERPRICED' && numPrice > 0 && (
        <Alert severity="warning" sx={{ py: 0.5, bgcolor: 'rgba(210, 153, 34, 0.1)', color: '#D29922' }}>
          <strong>Overpriced:</strong> Your asking price exceeds the estimated fair value. Consider lowering to within the Fair Range to attract more buyers.
        </Alert>
      )}
    </Card>
  );
}
