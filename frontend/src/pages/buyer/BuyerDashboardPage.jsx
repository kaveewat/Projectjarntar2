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
  Alert,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GavelIcon from '@mui/icons-material/Gavel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LockIcon from '@mui/icons-material/Lock';
import dashboardApi from '../../services/dashboard.api';
import { useAuth } from '../../contexts/AuthContext';

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getBuyerDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลหน้าผู้ซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดศูนย์ข้อมูลผู้ซื้อ...
        </Typography>
      </Container>
    );
  }

  const activeOrders = data?.active_orders || [];
  const completedCount = data?.completed_orders_count ?? data?.completed_count ?? 0;
  const totalSpent = data?.total_spent || 0;
  const disputeCount = data?.pending_disputes_count ?? data?.dispute_count ?? 0;

  // Urgent orders requiring buyer action
  const pendingPaymentOrders = activeOrders.filter(
    (o) => o.status === 'CREATED' || o.status === 'PENDING_PAYMENT'
  );
  const reviewingOrders = activeOrders.filter(
    (o) => o.status === 'BUYER_REVIEWING' || o.status === 'HANDOVER_INFO_PROVIDED'
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#F0F6FC">
            ศูนย์ผู้ซื้อ (Buyer Dashboard)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ยินดีต้อนรับคุณ {user?.display_name || user?.username}! จัดการการสั่งซื้อ Escrow และการรับมอบไอดีของคุณ
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            component={Link}
            to="/orders"
            variant="outlined"
            color="primary"
            startIcon={<ShoppingBagIcon />}
          >
            คำสั่งซื้อของฉัน
          </Button>
          <Button
            component={Link}
            to="/marketplace"
            variant="contained"
            color="primary"
            startIcon={<StorefrontIcon />}
          >
            ตลาดซื้อขายไอดี
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Priority Action Alerts */}
      {pendingPaymentOrders.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, bgcolor: 'rgba(210, 153, 34, 0.15)', border: '1px solid #D29922' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate(`/orders/${pendingPaymentOrders[0].id}/payment`)}
              sx={{ fontWeight: 700 }}
            >
              แนบสลิปทันที
            </Button>
          }
        >
          คุณมี <strong>{pendingPaymentOrders.length} คำสั่งซื้อ</strong> ที่รอการแนบหลักฐานชำระเงิน กรุณาแนบสลิปโอนเงินภายใน 2 ชั่วโมงเพื่อรักษาสิทธิ์
        </Alert>
      )}

      {reviewingOrders.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3, bgcolor: 'rgba(56, 139, 253, 0.15)', border: '1px solid #1F6FEB' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate(`/handover/${reviewingOrders[0].id}`)}
              sx={{ fontWeight: 700 }}
            >
              เข้าสู่ห้องส่งมอบ
            </Button>
          }
        >
          ข้อมูล Konami ID สำหรับ <strong>คำสั่งซื้อ #{reviewingOrders[0].order_number}</strong> ถูกส่งมอบแล้ว! ตรวจสอบไอดีในห้องส่งมอบ
        </Alert>
      )}

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  คำสั่งซื้อที่ดำเนินการอยู่
                </Typography>
                <ShoppingBagIcon sx={{ color: '#58A6FF' }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#F0F6FC">
                {activeOrders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  คำสั่งซื้อที่สำเร็จแล้ว
                </Typography>
                <CheckCircleOutlineIcon sx={{ color: '#3FB950' }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#3FB950">
                {completedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  ยอดซื้อสะสมทั้งหมด
                </Typography>
                <AccountBalanceWalletIcon sx={{ color: '#D29922' }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#F0F6FC">
                ฿{Number(totalSpent).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  ข้อพิพาทที่รอดำเนินการ
                </Typography>
                <GavelIcon sx={{ color: disputeCount > 0 ? '#F85149' : '#8B949E' }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color={disputeCount > 0 ? '#F85149' : '#F0F6FC'}>
                {disputeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Orders List */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={700} color="#F0F6FC">
              คำสั่งซื้อที่กำลังดำเนินการ
            </Typography>
            <Button component={Link} to="/orders" endIcon={<ArrowForwardIcon />} size="small">
              ดูคำสั่งซื้อทั้งหมด
            </Button>
          </Box>

          {activeOrders.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <ShoppingBagIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                ไม่มีคำสั่งซื้อ Escrow ที่กำลังดำเนินการในขณะนี้
              </Typography>
              <Button
                component={Link}
                to="/marketplace"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                เลือกดูไอดีในตลาด
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: '#30363D', color: 'text.secondary', fontWeight: 700 } }}>
                    <TableCell>เลขที่คำสั่งซื้อ</TableCell>
                    <TableCell>ชื่อรายการไอดี</TableCell>
                    <TableCell>จำนวนเงิน</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell align="right">การจัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{ '& td': { borderColor: '#21262D', color: '#F0F6FC' } }}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>#{order.order_number}</TableCell>
                      <TableCell>{order.listing_title || 'eFootball Account'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#58A6FF' }}>
                        ฿{Number(order.total_amount || order.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            order.status === 'CREATED' || order.status === 'PENDING_PAYMENT'
                              ? 'รอชำระเงิน'
                              : order.status === 'PAYMENT_SUBMITTED'
                              ? 'รอตรวจสอบสลิป'
                              : order.status === 'HANDOVER_OPEN'
                              ? 'รอส่งมอบไอดี'
                              : order.status === 'HANDOVER_INFO_PROVIDED' || order.status === 'BUYER_REVIEWING'
                              ? 'กำลังตรวจสอบ'
                              : order.status === 'COMPLETED'
                              ? 'สำเร็จ'
                              : order.status === 'DISPUTED'
                              ? 'มีข้อพิพาท'
                              : order.status?.replace(/_/g, ' ')
                          }
                          size="small"
                          color={
                            order.status === 'COMPLETED'
                              ? 'success'
                              : order.status === 'DISPUTED'
                              ? 'error'
                              : 'primary'
                          }
                          sx={{ fontWeight: 700, fontSize: '0.725rem' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {(order.status === 'CREATED' || order.status === 'PENDING_PAYMENT') && (
                            <Button
                              variant="contained"
                              size="small"
                              color="warning"
                              onClick={() => navigate(`/orders/${order.id}/payment`)}
                              sx={{ fontWeight: 700 }}
                            >
                              ชำระเงิน
                            </Button>
                          )}
                          {(order.status === 'HANDOVER_OPEN' ||
                            order.status === 'HANDOVER_INFO_PROVIDED' ||
                            order.status === 'BUYER_REVIEWING') && (
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<LockIcon />}
                              onClick={() => navigate(`/handover/${order.id}`)}
                              sx={{ fontWeight: 700 }}
                            >
                              ห้องส่งมอบ (Vault)
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            color="inherit"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            รายละเอียด
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
