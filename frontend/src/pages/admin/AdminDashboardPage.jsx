import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GavelIcon from '@mui/icons-material/Gavel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import adminApi from '../../services/admin.api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingActions, setPendingActions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, pendingRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getPendingActions(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data || {});
      }
      if (pendingRes.status === 'fulfilled') {
        setPendingActions(pendingRes.value.data?.data || pendingRes.value.data || {});
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดแผงควบคุมผู้ดูแลระบบ...
        </Typography>
      </Container>
    );
  }

  const gmv = stats?.total_gmv ?? stats?.gmv_mtd ?? stats?.gmv ?? 0;
  const escrowHeld = stats?.escrow_held ?? stats?.total_escrow_held ?? stats?.escrow_locked ?? 0;
  const completedOrders = stats?.completed_orders ?? stats?.orders_mtd ?? 0;
  const openDisputes = stats?.open_disputes ?? pendingActions?.disputes_count ?? 0;
  const pendingPayments = pendingActions?.pending_payments_count ?? stats?.pending_payments ?? 0;
  const pendingKyc = pendingActions?.pending_kyc_count ?? stats?.pending_kyc ?? 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon sx={{ color: '#F85149', fontSize: 32 }} />
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              แผงควบคุมผู้ดูแลระบบ
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ภาพรวมสถานะการเงิน Escrow แบบเรียลไทม์ ตรวจสอบสลิป และการระงับข้อพิพาท
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={fetchDashboardData}
            sx={{ borderColor: '#30363D' }}
          >
            รีเฟรชข้อมูล
          </Button>
          <Button
            component={Link}
            to="/admin/orders"
            variant="contained"
            color="error"
            startIcon={<ShoppingCartIcon />}
            sx={{ fontWeight: 700 }}
          >
            คำสั่งซื้อและสลิปโอน ({pendingPayments})
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* GMV */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  มูลค่าธุรกรรมรวม (GMV)
                </Typography>
                <AttachMoneyIcon sx={{ color: '#3FB950', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#3FB950">
                ฿{Number(gmv).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ยอดรวมธุรกรรมทั้งหมดในระบบ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Escrow Held */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  เงินใน Escrow ที่คุ้มครองอยู่
                </Typography>
                <AccountBalanceIcon sx={{ color: '#58A6FF', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#58A6FF">
                ฿{Number(escrowHeld).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                เงินคุ้มครองระหว่างการส่งมอบ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  คำสั่งซื้อที่เสร็จสมบูรณ์
                </Typography>
                <ShoppingCartIcon sx={{ color: '#D29922', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#F0F6FC">
                {Number(completedOrders).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ส่งมอบไอดีและปิดการขายเรียบร้อย
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Disputes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: '#161B22',
              border: Number(openDisputes) > 0 ? '1px solid #F85149' : '1px solid #30363D',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  ข้อพิพาทที่ยังเปิดอยู่
                </Typography>
                <GavelIcon sx={{ color: '#F85149', fontSize: 22 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color={Number(openDisputes) > 0 ? '#F85149' : '#3FB950'}>
                {openDisputes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                เคสที่ต้องการการตัดสินจากแอดมิน
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Priority Action Queue */}
      <Typography variant="h6" fontWeight={800} color="#F0F6FC" sx={{ mb: 2 }}>
        รายการงานด่วนที่ต้องดำเนินการ (Priority Queue)
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Queue 1: Pending Slips */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: '#161B22',
              border: '1px solid #30363D',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
                  ตรวจสอบการชำระเงิน
                </Typography>
                <Chip
                  label={`${pendingPayments} รอดำเนินการ`}
                  size="small"
                  color={pendingPayments > 0 ? 'warning' : 'default'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ผู้ซื้ออัปโหลดสลิปโอนเงินแล้ว ตรวจสอบรายการเดินบัญชีและอนุมัติการชำระเงินเพื่อปลดล็อกห้องส่งมอบไอดี
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/admin/orders"
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              fullWidth
              sx={{ fontWeight: 700 }}
            >
              ตรวจสอบการชำระเงิน
            </Button>
          </Paper>
        </Grid>

        {/* Queue 2: Disputes */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: '#161B22',
              border: '1px solid #30363D',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
                  การระงับข้อพิพาท
                </Typography>
                <Chip
                  label={`${openDisputes} กำลังเปิดอยู่`}
                  size="small"
                  color={openDisputes > 0 ? 'error' : 'default'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                คำสั่งซื้อที่ผู้ซื้อแจ้งปัญหาเรื่องรหัสผ่านไม่ถูกต้อง หรือข้อมูลนักเตะไม่ตรงตามประกาศ ตรวจสอบหลักฐานและตัดสินชี้ขาด
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/admin/disputes"
              variant="contained"
              color="error"
              endIcon={<ArrowForwardIcon />}
              fullWidth
              sx={{ fontWeight: 700 }}
            >
              พิจารณาข้อพิพาท
            </Button>
          </Paper>
        </Grid>

        {/* Queue 3: KYC Queue */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: '#161B22',
              border: '1px solid #30363D',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
                  ตรวจสอบยืนยันตัวตนผู้ขาย (KYC)
                </Typography>
                <Chip
                  label={`${pendingKyc} รอดำเนินการ`}
                  size="small"
                  color={pendingKyc > 0 ? 'info' : 'default'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ผู้ขายที่รอการอนุมัติบัตรประชาชนและรูปถ่ายเซลฟี่เพื่อปลดล็อกสิทธิ์การลงขายแบบยืนยันตัวตนแล้ว
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/admin/kyc"
              variant="contained"
              color="inherit"
              endIcon={<ArrowForwardIcon />}
              fullWidth
              sx={{ bgcolor: '#21262D', color: '#58A6FF', fontWeight: 700, '&:hover': { bgcolor: '#30363D' } }}
            >
              ตรวจสอบเอกสาร KYC
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Access Grid */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
          ระบบย่อยสำหรับการจัดการของผู้ดูแลระบบ
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              component={Link}
              to="/admin/users"
              variant="outlined"
              fullWidth
              sx={{ py: 1.5, borderColor: '#30363D', color: '#C9D1D9', '&:hover': { borderColor: '#58A6FF' } }}
            >
              จัดการผู้ใช้งาน
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              component={Link}
              to="/admin/escrow"
              variant="outlined"
              fullWidth
              sx={{ py: 1.5, borderColor: '#30363D', color: '#C9D1D9', '&:hover': { borderColor: '#58A6FF' } }}
            >
              การควบคุม Escrow
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              component={Link}
              to="/admin/payouts"
              variant="outlined"
              fullWidth
              sx={{ py: 1.5, borderColor: '#30363D', color: '#C9D1D9', '&:hover': { borderColor: '#58A6FF' } }}
            >
              การโอนเงินให้ผู้ขาย
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              component={Link}
              to="/admin/analytics"
              variant="outlined"
              fullWidth
              sx={{ py: 1.5, borderColor: '#30363D', color: '#C9D1D9', '&:hover': { borderColor: '#58A6FF' } }}
            >
              สถิติและรายงาน
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              component={Link}
              to="/admin/settings"
              variant="outlined"
              fullWidth
              sx={{ py: 1.5, borderColor: '#30363D', color: '#C9D1D9', '&:hover': { borderColor: '#58A6FF' } }}
            >
              ตั้งค่าแพลตฟอร์ม
            </Button>
          </Grid>
        </Grid>
      </Card>
    </Container>
  );
}
