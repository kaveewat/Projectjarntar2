import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BalanceIcon from '@mui/icons-material/Balance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const BADGE_CONFIG = {
  GREAT_VALUE: {
    label: 'Great Value',
    symbol: '🟢',
    icon: TrendingDownIcon,
    bg: 'rgba(35, 134, 54, 0.15)',
    border: '1px solid rgba(46, 160, 67, 0.4)',
    color: '#3FB950',
    tooltip: 'Asking price is BELOW the algorithmic fair price range. High savings potential!',
  },
  FAIR_PRICE: {
    label: 'Fair Price',
    symbol: '🟡',
    icon: BalanceIcon,
    bg: 'rgba(210, 153, 34, 0.15)',
    border: '1px solid rgba(210, 153, 34, 0.4)',
    color: '#D29922',
    tooltip: 'Asking price is within the algorithmic estimated market range.',
  },
  OVERPRICED: {
    label: 'Overpriced',
    symbol: '🔴',
    icon: TrendingUpIcon,
    bg: 'rgba(248, 81, 73, 0.15)',
    border: '1px solid rgba(248, 81, 73, 0.4)',
    color: '#F85149',
    tooltip: 'Asking price exceeds the estimated fair value for the cards in this squad.',
  },
};

// Aliases
BADGE_CONFIG['GREAT'] = BADGE_CONFIG['GREAT_VALUE'];
BADGE_CONFIG['FAIR'] = BADGE_CONFIG['FAIR_PRICE'];
BADGE_CONFIG['OVER'] = BADGE_CONFIG['OVERPRICED'];

export default function ValueBadge({ badge, size = 'small', showTooltip = true, sx = {} }) {
  if (!badge) return null;

  const key = String(badge).toUpperCase().replace(/\s+/g, '_');
  const config = BADGE_CONFIG[key] || {
    label: badge,
    symbol: '⚪',
    icon: null,
    bg: 'rgba(139, 148, 158, 0.15)',
    border: '1px solid rgba(139, 148, 158, 0.3)',
    color: '#8B949E',
    tooltip: 'Standard valuation',
  };

  const IconComponent = config.icon;

  const chipElement = (
    <Chip
      size={size}
      icon={
        IconComponent ? (
          <IconComponent sx={{ fontSize: size === 'small' ? '14px !important' : '18px !important', color: `${config.color} !important` }} />
        ) : undefined
      }
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <span>{config.symbol}</span>
          <span>{config.label}</span>
        </Box>
      }
      sx={{
        bgcolor: config.bg,
        border: config.border,
        color: config.color,
        fontWeight: 700,
        letterSpacing: '0.02em',
        borderRadius: '6px',
        px: 0.5,
        '& .MuiChip-label': {
          px: 0.75,
        },
        ...sx,
      }}
    />
  );

  if (!showTooltip) return chipElement;

  return (
    <Tooltip title={config.tooltip} arrow placement="top">
      {chipElement}
    </Tooltip>
  );
}
