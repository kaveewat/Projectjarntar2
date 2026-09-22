import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  // Listing & Order Statuses
  ACTIVE: { label: 'Active', color: 'success' },
  RESERVED: { label: 'Reserved', color: 'warning' },
  SOLD: { label: 'Sold', color: 'default' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
  COMPLETED: { label: 'Completed', color: 'success' },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'warning' },
  PAYMENT_SUBMITTED: { label: 'Slip Submitted', color: 'info' },
  PAYMENT_VERIFIED: { label: 'Payment Approved', color: 'success' },
  PAYMENT_REJECTED: { label: 'Payment Rejected', color: 'error' },
  IN_HANDOVER: { label: 'In Handover', color: 'primary' },
  HANDOVER_COMPLETED: { label: 'Handover Done', color: 'success' },
  DISPUTED: { label: 'Disputed', color: 'error' },
  REFUNDED: { label: 'Refunded', color: 'default' },
  AUTO_RELEASED: { label: 'Auto-Released', color: 'success' },

  // Valuation Badges
  GREAT_VALUE: { label: '🟢 Great Value', color: 'success' },
  FAIR_PRICE: { label: '🟡 Fair Price', color: 'warning' },
  OVERPRICED: { label: '🔴 Overpriced', color: 'error' },

  // KYC & Dispute Statuses
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  OPEN: { label: 'Open', color: 'error' },
  RESOLVED_BUYER: { label: 'Refunded to Buyer', color: 'info' },
  RESOLVED_SELLER: { label: 'Released to Seller', color: 'success' },
  FROZEN: { label: 'Escrow Frozen', color: 'warning' },
};

export default function StatusChip({ status, size = 'small', sx = {} }) {
  if (!status) return null;
  const config = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' '),
    color: 'default',
  };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant={config.color === 'default' ? 'outlined' : 'filled'}
      sx={{
        fontWeight: 600,
        textTransform: 'none',
        ...sx,
      }}
    />
  );
}
