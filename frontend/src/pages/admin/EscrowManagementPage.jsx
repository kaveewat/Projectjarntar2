import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import VisibilityIcon from '@mui/icons-material/Visibility';
import adminApi from '../../services/admin.api';

export default function EscrowManagementPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEscrowOverview();
  }, []);

  const fetchEscrowOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getEscrowOverview();
      setData(res.data?.data || res.data || {});
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load escrow overview');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'HELD':
        return (
          <Chip
            icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
            label="HELD IN VAULT"
            size="small"
            sx={{ bgcolor: 'rgba(210, 153, 34, 0.2)', color: '#D29922', fontWeight: 800 }}
          />
        );
      case 'RELEASED':
        return (
          <Chip
            icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
            label="RELEASED TO SELLER"
            size="small"
            sx={{ bgcolor: 'rgba(63, 185, 80, 0.2)', color: '#3FB950', fontWeight: 800 }}
          />
        );
      case 'REFUNDED':
        return (
          <Chip
            icon={<ReplayIcon sx={{ fontSize: '14px !important' }} />}
            label="REFUNDED TO BUYER"
            size="small"
            sx={{ bgcolor: 'rgba(56, 139, 253, 0.2)', color: '#58A6FF', fontWeight: 800 }}
          />
        );
      case 'FROZEN':
        return (
          <Chip
            label="FROZEN (DISPUTE)"
            size="small"
            sx={{ bgcolor: 'rgba(248, 81, 73, 0.2)', color: '#F85149', fontWeight: 800 }}
          />
        );
      default:
        return <Chip label={status || 'UNKNOWN'} size="small" />;
    }
  };

  const totalHeld = data?.total_held || 0;
  const totalReleased = data?.total_released || 0;
  const totalRefunded = data?.total_refunded || 0;
  const records = data?.records || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              Escrow Vault Operations & Liquidity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supervise platform locked collateral, released seller funds, and buyer protection pools
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchEscrowOverview} sx={{ borderColor: '#30363D' }}>
          Refresh Vault
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Currently Locked in Escrow
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#D29922" sx={{ my: 0.5 }}>
                ฿{Number(totalHeld).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Protected transactions in transit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Total Released to Sellers
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#3FB950" sx={{ my: 0.5 }}>
                ฿{Number(totalReleased).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Settled upon buyer confirmation
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Total Refunded to Buyers
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#58A6FF" sx={{ my: 0.5 }}>
                ฿{Number(totalRefunded).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Returned from resolved dispute claims
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Records Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading escrow contracts...
          </Typography>
        </Box>
      ) : records.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            No escrow contracts active
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Escrow records are initialized when buyers submit payment slips.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ESCROW ID</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ORDER NUMBER</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>AMOUNT HELD</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>PLATFORM FEE</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>SELLER PAYOUT</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>HELD AT</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#58A6FF', fontWeight: 700 }}>
                    #ESC-{r.id}
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC', fontWeight: 600 }}>
                    #{r.order_number || r.order_id}
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC', fontWeight: 800 }}>
                    ฿{Number(r.amount_held).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    ฿{Number(r.platform_fee).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: '#3FB950', fontWeight: 700 }}>
                    ฿{Number(r.seller_payout).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusChip(r.status)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {new Date(r.held_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {r.order_id && (
                      <Button
                        component={Link}
                        to={`/admin/orders/${r.order_id}`}
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        sx={{ borderColor: '#30363D', color: '#58A6FF' }}
                      >
                        Inspect Order
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
