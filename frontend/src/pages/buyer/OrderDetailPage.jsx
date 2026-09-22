import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import ordersApi from '../../services/orders.api';
import OrderTimeline from '../../components/order/OrderTimeline';
import { useAuth } from '../../contexts/AuthContext';
import { formatThaiDateTime } from '../../utils/date';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.getOrderDetail(id);
      setOrder(res.data?.data?.order || res.data?.order);
      setStatusLogs(res.data?.data?.status_logs || res.data?.status_logs || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดคำสั่งซื้อ #{id}...
        </Typography>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'ไม่พบคำสั่งซื้อ'}
        </Alert>
        <Button component={Link} to="/orders" startIcon={<ArrowBackIcon />}>
          กลับไปหน้ารายการคำสั่งซื้อ
        </Button>
      </Container>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;
  const isHandoverReady =
    order.status === 'PAYMENT_APPROVED' ||
    order.status === 'HANDOVER_OPEN' ||
    order.status === 'HANDOVER_INFO_PROVIDED' ||
    order.status === 'BUYER_REVIEWING';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button & Title */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          to="/orders"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, color: 'text.secondary' }}
        >
          กลับไปคำสั่งซื้อทั้งหมด
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              คำสั่งซื้อ #{order.order_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              สร้างเมื่อ {formatThaiDateTime(order.created_at)} • คุ้มครองความปลอดภัยด้วยระบบ Escrow
            </Typography>
          </Box>
          <Box>
            <Chip
              label={
                order.status === 'CREATED' || order.status === 'PENDING_PAYMENT'
                  ? 'รอชำระเงิน'
                  : order.status === 'PAYMENT_SUBMITTED'
                  ? 'รอตรวจสอบสลิป'
                  : order.status === 'HANDOVER_OPEN'
                  ? 'รอส่งมอบไอดี'
                  : order.status === 'HANDOVER_INFO_PROVIDED' || order.status === 'BUYER_REVIEWING'
                  ? 'ผู้ซื้อกำลังตรวจสอบ'
                  : order.status === 'COMPLETED'
                  ? 'สำเร็จสมบูรณ์'
                  : order.status === 'DISPUTED'
                  ? 'มีข้อพิพาท'
                  : order.status?.replace(/_/g, ' ')
              }
              color={
                order.status === 'COMPLETED'
                  ? 'success'
                  : order.status === 'DISPUTED'
                  ? 'error'
                  : 'primary'
              }
              sx={{ fontWeight: 800, fontSize: '0.85rem', px: 1 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Progress Stepper Timeline */}
      <Box sx={{ mb: 4 }}>
        <OrderTimeline
          status={order.status}
          isDisputed={order.status === 'DISPUTED'}
          isCancelled={order.status === 'CANCELLED'}
        />
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Listing & Order Breakdown */}
        <Grid item xs={12} md={7}>
          {/* Account Listing Summary Card */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" gutterBottom>
                รายการไอดีที่สั่งซื้อ
              </Typography>
              <Typography variant="h5" fontWeight={700} color="#F0F6FC" sx={{ my: 1 }}>
                {order.listing_title || 'eFootball Account'}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    แพลตฟอร์ม
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#F0F6FC">
                    {order.platform_name || 'Mobile / PC / Console'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ยอดเงินรวม
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#58A6FF">
                    ฿{Number(order.total_amount || order.amount).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2, borderColor: '#30363D' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  ต้องการตรวจสอบรายละเอียดและข้อมูลนักเตะในทีม?
                </Typography>
                <Button
                  component={Link}
                  to={`/marketplace/${order.listing_id}`}
                  size="small"
                  startIcon={<StorefrontIcon />}
                  variant="outlined"
                  color="inherit"
                >
                  ดูหน้ารายการไอดี
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Status Audit Log */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" gutterBottom>
                บันทึกประวัติสถานะคำสั่งซื้อ (Audit Trail)
              </Typography>
              {statusLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  คำสั่งซื้อเริ่มต้น ยังไม่มีประวัติการเปลี่ยนสถานะ
                </Typography>
              ) : (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {statusLogs.map((log, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: '#0D1117',
                        border: '1px solid #21262D',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="#58A6FF">
                          {log.new_status === 'CREATED'
                            ? 'สร้างคำสั่งซื้อ'
                            : log.new_status === 'PENDING_PAYMENT'
                            ? 'รอการชำระเงิน'
                            : log.new_status === 'PAYMENT_SUBMITTED'
                            ? 'ส่งสลิปชำระเงินแล้ว'
                            : log.new_status === 'PAYMENT_APPROVED'
                            ? 'สลิปได้รับการอนุมัติ'
                            : log.new_status === 'HANDOVER_OPEN'
                            ? 'เปิดห้องส่งมอบไอดี'
                            : log.new_status === 'HANDOVER_INFO_PROVIDED'
                            ? 'ผู้ขายส่งมอบข้อมูลแล้ว'
                            : log.new_status === 'BUYER_REVIEWING'
                            ? 'ผู้ซื้อกำลังตรวจสอบ'
                            : log.new_status === 'COMPLETED'
                            ? 'คำสั่งซื้อเสร็จสมบูรณ์'
                            : log.new_status === 'DISPUTED'
                            ? 'เปิดข้อพิพาท'
                            : log.new_status === 'CANCELLED'
                            ? 'ยกเลิกคำสั่งซื้อ'
                            : log.new_status?.replace(/_/g, ' ')}
                        </Typography>
                        {log.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {log.notes}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatThaiDateTime(log.created_at)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Next Steps & Actions */}
        <Grid item xs={12} md={5}>
          {/* Action Card based on Status */}
          <Card
            sx={{
              bgcolor: '#161B22',
              border: isHandoverReady ? '2px solid #1F6FEB' : '1px solid #30363D',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" gutterBottom>
                ขั้นตอนที่ต้องดำเนินการ
              </Typography>

              {/* Status: CREATED / PENDING PAYMENT */}
              {(order.status === 'CREATED' || order.status === 'PENDING_PAYMENT') && (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    จำเป็นต้องแนบสลิปชำระเงินเพื่อล็อกยอดเงินเข้าสู่ระบบ Escrow และแจ้งเตือนผู้ขาย
                  </Alert>
                  {isBuyer ? (
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      size="large"
                      startIcon={<PaymentIcon />}
                      onClick={() => navigate(`/orders/${order.id}/payment`)}
                      sx={{ fontWeight: 800, py: 1.5 }}
                    >
                      แนบสลิปชำระเงิน
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      กำลังรอผู้ซื้อโอนเงินและแนบหลักฐานการชำระเงิน
                    </Typography>
                  )}
                </Box>
              )}

              {/* Status: PAYMENT_SUBMITTED */}
              {order.status === 'PAYMENT_SUBMITTED' && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    แนบหลักฐานชำระเงินเรียบร้อยแล้ว เจ้าหน้าที่ Escrow กำลังตรวจสอบยอดโอนของคุณ
                  </Alert>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    เมื่อตรวจสอบผ่านแล้ว ผู้ขายจะส่งมอบข้อมูลบัญชี Konami ID ในห้องส่งมอบ
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<LockIcon />}
                    onClick={() => navigate(`/handover/${order.id}`)}
                    sx={{ fontWeight: 800, py: 1.5 }}
                  >
                    ดูห้องส่งมอบ (Vault) #{order.id}
                  </Button>
                </Box>
              )}

              {/* Status: HANDOVER_OPEN / BUYER_REVIEWING */}
              {isHandoverReady && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {order.status === 'HANDOVER_OPEN'
                      ? 'เปิดห้องส่งมอบแล้ว! ผู้ขายกำลังจัดเตรียมข้อมูลบัญชี'
                      : 'ผู้ขายได้ส่งมอบข้อมูลบัญชี Konami ID เรียบร้อยแล้ว!'}
                  </Alert>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<LockIcon />}
                    onClick={() => navigate(`/handover/${order.id}`)}
                    sx={{ fontWeight: 800, py: 1.5 }}
                  >
                    เข้าสู่ห้องส่งมอบที่ปลอดภัย (Handover Vault)
                  </Button>
                </Box>
              )}

              {/* Status: DISPUTED */}
              {order.status === 'DISPUTED' && (
                <Box>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    คำสั่งซื้อนี้อยู่ระหว่างการตรวจสอบข้อพิพาท ยอดเงิน Escrow ถูกระงับชั่วคราว
                  </Alert>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<GavelIcon />}
                    onClick={() => navigate(`/disputes/order/${order.id}`)}
                    sx={{ fontWeight: 700 }}
                  >
                    ดูรายละเอียดข้อพิพาท
                  </Button>
                </Box>
              )}

              {/* Status: COMPLETED */}
              {order.status === 'COMPLETED' && (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="body1" fontWeight={700} color="#3FB950" gutterBottom>
                    ธุรกรรมเสร็จสมบูรณ์เรียบร้อยแล้ว!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ยอดเงิน Escrow ได้รับการปล่อยให้แก่ผู้ขายแล้ว ขอให้สนุกกับทีม eFootball ของคุณ!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Participant Info Card */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" gutterBottom>
                {isBuyer ? 'ข้อมูลผู้ขาย (Seller)' : 'ข้อมูลผู้ซื้อ (Buyer)'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
                      {isBuyer ? order.seller_name || 'ผู้ขาย' : order.buyer_name || 'ผู้ซื้อ'}
                    </Typography>
                    {isBuyer && order.seller_verified && (
                      <VerifiedIcon sx={{ fontSize: 18, color: '#58A6FF' }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {isBuyer ? 'ผู้ขายที่ผ่านการยืนยันตัวตนแล้ว' : 'ผู้ซื้อในระบบ'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                การติดต่อสื่อสารและการส่งมอบข้อมูลทั้งหมดต้องกระทำภายในห้องส่งมอบ Escrow เพื่อความคุ้มครองสูงสุดตามเงื่อนไขของแพลตฟอร์ม
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
