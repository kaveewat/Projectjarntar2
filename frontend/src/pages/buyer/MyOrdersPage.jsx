import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StoreIcon from '@mui/icons-material/Store';
import LockIcon from '@mui/icons-material/Lock';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import ordersApi from '../../services/orders.api';

import { formatThaiDateTime } from '../../utils/date';

const STATUS_TABS = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'รอชำระเงิน', value: 'PENDING_PAYMENT' },
  { label: 'ส่งสลิปแล้ว', value: 'PAYMENT_SUBMITTED' },
  { label: 'ระหว่างส่งมอบ', value: 'HANDOVER' },
  { label: 'สำเร็จแล้ว', value: 'COMPLETED' },
  { label: 'มีข้อพิพาท', value: 'DISPUTED' },
  { label: 'ยกเลิกแล้ว', value: 'CANCELLED' },
];

export default function MyOrdersPage({ role: propRole }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if this view is for Buyer (/orders) or Seller (/seller/orders)
  const isSellerView = propRole === 'seller' || location.pathname.startsWith('/seller');
  const roleMode = isSellerView ? 'seller' : 'buyer';

  const [activeTab, setActiveTab] = useState('ALL');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancel Order Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, roleMode]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { as: roleMode };
      if (activeTab !== 'ALL') {
        if (activeTab === 'HANDOVER') {
          // Handover encompasses multiple statuses
          params.status = 'HANDOVER_OPEN';
        } else {
          params.status = activeTab;
        }
      }

      const res = await ordersApi.getMyOrders(params);
      setOrders(res.data?.data || res.data?.orders || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(orderToCancel.id, cancelReason);
      setCancelModalOpen(false);
      setOrderToCancel(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Chip label="สำเร็จสมบูรณ์" size="small" color="success" sx={{ fontWeight: 700 }} />;
      case 'DISPUTED':
        return <Chip label="มีข้อพิพาท" size="small" color="error" sx={{ fontWeight: 700 }} />;
      case 'CANCELLED':
        return <Chip label="ยกเลิกแล้ว" size="small" sx={{ bgcolor: '#30363D', color: '#8B949E', fontWeight: 700 }} />;
      case 'CREATED':
      case 'PENDING_PAYMENT':
        return <Chip label="รอชำระเงิน" size="small" color="warning" sx={{ fontWeight: 700 }} />;
      case 'PAYMENT_SUBMITTED':
        return <Chip label="ส่งสลิปแล้ว" size="small" color="info" sx={{ fontWeight: 700 }} />;
      case 'PAYMENT_APPROVED':
      case 'HANDOVER_OPEN':
        return <Chip label="เปิดห้องส่งมอบ" size="small" color="secondary" sx={{ fontWeight: 700 }} />;
      case 'HANDOVER_INFO_PROVIDED':
      case 'BUYER_REVIEWING':
        return <Chip label="ส่งมอบข้อมูลแล้ว" size="small" color="primary" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={status?.replace(/_/g, ' ')} size="small" color="default" sx={{ fontWeight: 700 }} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          {isSellerView ? (
            <StoreIcon sx={{ color: 'secondary.main', fontSize: 32 }} />
          ) : (
            <ShoppingBagIcon sx={{ color: '#58A6FF', fontSize: 32 }} />
          )}
          <Typography variant="h4" fontWeight={800} color="#F0F6FC">
            {isSellerView ? 'คำสั่งซื้อของร้านค้า' : 'คำสั่งซื้อของฉัน'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {isSellerView
            ? 'ติดตามคำสั่งซื้อจากลูกค้า ส่งมอบข้อมูลบัญชี Konami ID และรับยอดเงิน Escrow'
            : 'ติดตามคำสั่งซื้อ Escrow แนบสลิปชำระเงิน และตรวจสอบข้อมูลบัญชี Konami ID ที่ได้รับ'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter Tabs */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: '1px solid #30363D',
            '& .MuiTab-root': { fontWeight: 700, minHeight: 48, fontSize: '0.85rem' },
          }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>

        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                กำลังโหลดคำสั่งซื้อ...
              </Typography>
            </Box>
          ) : orders.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <ShoppingBagIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} color="#F0F6FC">
                ไม่พบรายการคำสั่งซื้อ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {activeTab === 'ALL'
                  ? 'คุณยังไม่มีประวัติรายการคำสั่งซื้อในส่วนนี้'
                  : `ไม่พบคำสั่งซื้อในสถานะ "${STATUS_TABS.find(t => t.value === activeTab)?.label || activeTab}"`}
              </Typography>
              {!isSellerView && (
                <Button component={Link} to="/marketplace" variant="contained" color="primary">
                  ไปที่ตลาดซื้อขายไอดี
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: '#30363D', color: 'text.secondary', fontWeight: 700 } }}>
                    <TableCell>เลขที่คำสั่งซื้อ</TableCell>
                    <TableCell>วันที่สร้าง</TableCell>
                    <TableCell>ชื่อรายการไอดี</TableCell>
                    <TableCell>จำนวนเงิน</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell align="right">การจัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const isHandoverOpen =
                      order.status === 'HANDOVER_OPEN' ||
                      order.status === 'HANDOVER_INFO_PROVIDED' ||
                      order.status === 'BUYER_REVIEWING';

                    return (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{ '& td': { borderColor: '#21262D', color: '#F0F6FC' } }}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>#{order.order_number}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          {formatThaiDateTime(order.created_at)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {order.listing_title || 'eFootball Account'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#58A6FF' }}>
                          ฿{Number(order.total_amount || order.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusChip(order.status)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {/* Buyer Action: Submit Payment */}
                            {!isSellerView &&
                              (order.status === 'CREATED' || order.status === 'PENDING_PAYMENT') && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="warning"
                                  startIcon={<PaymentIcon />}
                                  onClick={() => navigate(`/orders/${order.id}/payment`)}
                                  sx={{ fontWeight: 700 }}
                                >
                                  แนบสลิป
                                </Button>
                              )}

                            {/* Handover Action (Buyer or Seller) */}
                            {isHandoverOpen && (
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

                            {/* Cancel Order Action (Buyer before payment) */}
                            {!isSellerView &&
                              (order.status === 'CREATED' || order.status === 'PENDING_PAYMENT') && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleCancelClick(order)}
                                >
                                  ยกเลิก
                                </Button>
                              )}

                            {/* View Detail Action */}
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Cancel Order Modal */}
      <Dialog
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#161B22', border: '1px solid #30363D' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#F0F6FC' }}>
          ยกเลิกคำสั่งซื้อ #{orderToCancel?.order_number}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้? รายการไอดีจะถูกปลดล็อกและนำกลับมาวางจำหน่ายในตลาดทันที
          </Typography>
          <TextField
            label="เหตุผลในการยกเลิก (ไม่บังคับ)"
            fullWidth
            multiline
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="เช่น เปลี่ยนใจ / พบไอดีอื่นที่ถูกใจกว่า"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCancelModalOpen(false)} color="inherit">
            ย้อนกลับ
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelling}
            sx={{ fontWeight: 700 }}
          >
            {cancelling ? 'กำลังยกเลิก...' : 'ยืนยันการยกเลิก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
