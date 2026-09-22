import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Skeleton,
  Alert,
  Divider,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HandshakeIcon from '@mui/icons-material/Handshake';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import dashboardApi from '../../services/dashboard.api';
import { useAuth } from '../../contexts/AuthContext';
import ValueBadge from '../../components/common/ValueBadge';
import StatusChip from '../../components/common/StatusChip';

import { formatThaiDateTime } from '../../utils/date';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardApi.getSellerDashboard();
        if (res?.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load seller dashboard:', err);
        setError('ไม่สามารถโหลดข้อมูลสถิติของผู้ขายได้');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const activeCount = data?.active_listings_count || data?.active_listings?.length || 0;
  const pendingOrders = data?.pending_orders || [];
  const totalEarned = data?.total_earned || 0;
  const pendingPayout = data?.pending_payout || 0;
  const completedCount = data?.completed_sales_count || 0;
  const recentListings = data?.active_listings || [];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #F0F6FC 0%, #8B949E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            ศูนย์ข้อมูลผู้ขาย (Seller Hub)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ยินดีต้อนรับคุณ <strong>{user?.display_name || user?.email}</strong> ตรวจสอบรายการไอดีที่ลงขาย, คำสั่งซื้อรอส่งมอบ และรายได้สะสมของคุณ
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            component={Link}
            to="/seller/listings/new"
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            sx={{ fontWeight: 700 }}
          >
            ลงขายไอดีใหม่ (สแกน AI)
          </Button>
          <Button
            component={Link}
            to="/seller/listings"
            variant="outlined"
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            จัดการไอดีที่ลงขาย
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 4 Summary Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 1. Active Listings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  ไอดีที่กำลังวางขาย
                </Typography>
                <StorefrontIcon sx={{ color: 'primary.light', fontSize: 24 }} />
              </Box>
              {loading ? (
                <Skeleton height={40} width="40%" />
              ) : (
                <Typography variant="h4" fontWeight={800} color="#F0F6FC">
                  {activeCount}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                แสดงอยู่ในตลาดซื้อขายสาธารณะ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 2. Pending Handovers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: '#161B22',
              border: pendingOrders.length > 0 ? '1px solid #D29922' : '1px solid #30363D',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  คำสั่งซื้อรอส่งมอบ
                </Typography>
                <HandshakeIcon sx={{ color: pendingOrders.length > 0 ? 'warning.main' : 'text.secondary', fontSize: 24 }} />
              </Box>
              {loading ? (
                <Skeleton height={40} width="40%" />
              ) : (
                <Typography variant="h4" fontWeight={800} color={pendingOrders.length > 0 ? '#D29922' : '#F0F6FC'}>
                  {pendingOrders.length}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                คำสั่งซื้อที่ต้องส่งมอบข้อมูล Konami ID
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 3. Total Earned */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  รายได้สะสมทั้งหมด
                </Typography>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
              </Box>
              {loading ? (
                <Skeleton height={40} width="60%" />
              ) : (
                <Typography variant="h4" fontWeight={800} sx={{ color: '#3FB950' }}>
                  ฿{Number(totalEarned).toLocaleString()}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                จากการขายสำเร็จ {completedCount} รายการ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. Pending Payout */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  ยอดรอโอนเงิน (Escrow)
                </Typography>
                <AccountBalanceWalletIcon sx={{ color: 'info.main', fontSize: 24 }} />
              </Box>
              {loading ? (
                <Skeleton height={40} width="60%" />
              ) : (
                <Typography variant="h4" fontWeight={800} color="#58A6FF">
                  ฿{Number(pendingPayout).toLocaleString()}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                ยอดเงินในระบบ Escrow ที่รอดำเนินการ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Required: Pending Handovers Alert */}
      {pendingOrders.length > 0 && (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #D29922', borderRadius: 2, p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HandshakeIcon sx={{ color: 'warning.main', fontSize: 24 }} />
              <Typography variant="h6" fontWeight={700} color="#F0F6FC">
                ต้องดำเนินการ: มีห้องส่งมอบไอดีที่รอส่งมอบ ({pendingOrders.length})
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ผู้ซื้อได้ชำระเงินเข้าสู่ระบบ Escrow เรียบร้อยแล้ว กรุณาเข้าสู่ห้องส่งมอบและส่งมอบข้อมูลบัญชี Konami ID ก่อนหมดเวลา 24 ชั่วโมง
          </Typography>

          <Stack spacing={1.5}>
            {pendingOrders.map((order) => (
              <Box
                key={order.id}
                sx={{
                  p: 2,
                  bgcolor: '#0D1117',
                  borderRadius: 1.5,
                  border: '1px solid #30363D',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC">
                    คำสั่งซื้อ #{order.order_number || order.id} — {order.listing_title || 'eFootball Account'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ผู้ซื้อ: <strong>{order.buyer_name || 'ผู้ซื้อ'}</strong> • ยอดเงิน: ฿{Number(order.amount || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Button
                  component={Link}
                  to={`/handover/${order.id}`}
                  variant="contained"
                  color="warning"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ fontWeight: 700 }}
                >
                  เข้าสู่ห้องส่งมอบ (Vault)
                </Button>
              </Box>
            ))}
          </Stack>
        </Card>
      )}

      {/* Recent Active Listings Table */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#F0F6FC">
              รายการไอดีล่าสุดที่วางขาย
            </Typography>
            <Typography variant="caption" color="text.secondary">
              รายการไอดี 10 อันดับล่าสุดที่เปิดขายอยู่ในตลาด
            </Typography>
          </Box>

          <Button
            component={Link}
            to="/seller/listings"
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            ดูทั้งหมด ({activeCount})
          </Button>
        </Box>

        {loading ? (
          <Box>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height={40} sx={{ my: 1 }} />
            ))}
          </Box>
        ) : recentListings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              คุณยังไม่มีรายการไอดีที่เปิดขายอยู่ในขณะนี้
            </Typography>
            <Button
              component={Link}
              to="/seller/listings/new"
              variant="outlined"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
            >
              สแกนประเมินราคา & ลงขายไอดี
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {recentListings.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  bgcolor: '#0D1117',
                  borderRadius: 1.5,
                  border: '1px solid #21262D',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC">
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    แพลตฟอร์ม: {item.platform_name || 'ทั้งหมด'} • Team Strength: {item.team_strength || 'N/A'} • วันที่ลงขาย: {formatThaiDateTime(item.created_at)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ValueBadge badge={item.value_badge} size="small" />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#58A6FF' }}>
                    ฿{Number(item.price || item.asking_price).toLocaleString()}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/marketplace/${item.id}`}
                    size="small"
                    variant="outlined"
                    color="inherit"
                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                  >
                    ดูรายละเอียด
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Container>
  );
}

