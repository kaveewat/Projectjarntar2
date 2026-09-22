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
  Stack,
  Divider,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import payoutsApi from '../../services/payouts.api';
import dashboardApi from '../../services/dashboard.api';

import { formatThaiDateTime } from '../../utils/date';

export default function PayoutHistoryPage() {
  const [payouts, setPayouts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payoutsRes, dashRes] = await Promise.allSettled([
        payoutsApi.getMyPayouts(),
        dashboardApi.getSellerDashboard(),
      ]);

      if (payoutsRes.status === 'fulfilled') {
        const items =
          payoutsRes.value.data?.data?.payouts ||
          payoutsRes.value.data?.data ||
          payoutsRes.value.data?.payouts ||
          [];
        setPayouts(Array.isArray(items) ? items : []);
      }

      if (dashRes.status === 'fulfilled') {
        setDashboardData(dashRes.value.data?.data || dashRes.value.data || {});
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดประวัติการโอนเงินได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip
            label="โอนเงินสำเร็จ"
            size="small"
            sx={{ bgcolor: 'rgba(63, 185, 80, 0.15)', color: '#3FB950', fontWeight: 700 }}
          />
        );
      case 'PROCESSING':
        return (
          <Chip
            label="กำลังดำเนินการ"
            size="small"
            sx={{ bgcolor: 'rgba(56, 139, 253, 0.15)', color: '#58A6FF', fontWeight: 700 }}
          />
        );
      case 'PENDING':
        return (
          <Chip
            label="รอดำเนินการ"
            size="small"
            sx={{ bgcolor: 'rgba(210, 153, 34, 0.15)', color: '#D29922', fontWeight: 700 }}
          />
        );
      case 'FAILED':
      case 'REJECTED':
        return (
          <Chip
            label="ล้มเหลว / ปฏิเสธ"
            size="small"
            sx={{ bgcolor: 'rgba(248, 81, 73, 0.15)', color: '#F85149', fontWeight: 700 }}
          />
        );
      default:
        return <Chip label={status || 'รอดำเนินการ'} size="small" />;
    }
  };

  const lifetimeEarnings = dashboardData?.total_earned || 0;
  const pendingPayout = dashboardData?.pending_payout || 0;
  const completedTransfers = payouts.filter((p) => p.status === 'COMPLETED').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 32, color: '#238636' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ประวัติการรับเงินโอนผู้ขาย
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ติดตามเงินค่าขายที่ปล่อยจากระบบ Escrow, ยอดรอโอน และประวัติการโอนเงินเข้าบัญชี
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          to="/seller/dashboard"
          variant="outlined"
          color="inherit"
          startIcon={<StorefrontIcon />}
          sx={{ borderColor: '#30363D' }}
        >
          ศูนย์ข้อมูลผู้ขาย
        </Button>
      </Box>

      {/* Overview Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Earnings */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  รายได้สะสมทั้งหมด
                </Typography>
                <CheckCircleOutlineIcon sx={{ color: '#3FB950', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#3FB950">
                ฿{Number(lifetimeEarnings).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ยอดสุทธิที่ได้รับจากการขายไอดีสำเร็จ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending In Escrow */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  ยอดรอปล่อยในระบบ Escrow
                </Typography>
                <HourglassEmptyIcon sx={{ color: '#D29922', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#D29922">
                ฿{Number(pendingPayout).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                อยู่ในช่วงเวลาผู้ซื้อตรวจสอบข้อมูลไอดี
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Remittances */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  รายการโอนเงินสำเร็จ
                </Typography>
                <VerifiedUserIcon sx={{ color: '#58A6FF', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#58A6FF">
                {completedTransfers}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ยอดโอนเข้าบัญชีธนาคารสำเร็จ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table Section */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดประวัติการโอนเงิน...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : payouts.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 56, color: '#8B949E', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ยังไม่มีประวัติรายการโอนเงิน
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 500, mx: 'auto' }}>
            เมื่อผู้ซื้อตรวจสอบและกดยืนยันรับมอบไอดี ยอดเงินจะถูกปล่อยจากระบบ Escrow และบันทึกไว้ที่นี่เพื่อดำเนินการโอนเงินให้คุณ
          </Typography>
          <Button
            component={Link}
            to="/seller/listings/new"
            variant="contained"
            color="success"
            sx={{ mt: 3, fontWeight: 700 }}
          >
            ลงขายไอดีรายการแรกของคุณ
          </Button>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสรายการโอน</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>คำสั่งซื้อ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>จำนวนเงิน</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>บัญชีปลายทาง</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>สถานะ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>วันที่สร้างคำขอ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>การจัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#F0F6FC', fontWeight: 700 }}>
                    #SP-{payout.id}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="#58A6FF" fontWeight={600}>
                      {payout.order_number || `#ORD-${payout.order_id}`}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#3FB950', fontWeight: 800 }}>
                    ฿{Number(payout.amount).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: '#C9D1D9' }}>
                    {payout.bank_name ? `${payout.bank_name} (${payout.bank_account_number})` : 'PromptPay / โอนเงินผ่านธนาคาร'}
                  </TableCell>
                  <TableCell>{getStatusChip(payout.status)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {formatThaiDateTime(payout.created_at)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {payout.order_id && (
                      <Button
                        component={Link}
                        to={`/orders/${payout.order_id}`}
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ color: '#58A6FF' }}
                      >
                        ดูคำสั่งซื้อ
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

