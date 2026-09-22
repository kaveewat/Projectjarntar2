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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LockIcon from '@mui/icons-material/Lock';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Actions state
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrderDetail(id);
      setData(res.data?.data || res.data || {});
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async () => {
    setActionLoading(true);
    try {
      await adminApi.approvePayment(id);
      setApproveConfirmOpen(false);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'ไม่สามารถอนุมัติการชำระเงินได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธการชำระเงิน');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.rejectPayment(id, rejectReason.trim());
      setRejectDialogOpen(false);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'ไม่สามารถปฏิเสธการชำระเงินได้');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดคำสั่งซื้อ #{id}...
        </Typography>
      </Container>
    );
  }

  const order = data?.order || data;
  const orderLogs = data?.order_logs || [];
  const escrowLogs = data?.escrow_logs || [];

  if (error || !order) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'ไม่พบข้อมูลคำสั่งซื้อ'}
        </Alert>
        <Button component={Link} to="/admin/orders" startIcon={<ArrowBackIcon />}>
          กลับไปยังรายการคำสั่งซื้อ
        </Button>
      </Container>
    );
  }

  const isPendingReview = order.status === 'PAYMENT_SUBMITTED';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Header */}
      <Box sx={{ mb: 3 }}>
        <Button component={Link} to="/admin/orders" startIcon={<ArrowBackIcon />} sx={{ mb: 1, color: 'text.secondary' }}>
          กลับไปยังรายการคำสั่งซื้อ
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              คำสั่งซื้อ #{order.order_number || order.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              สร้างเมื่อ {formatThaiDateTime(order.created_at)} • รหัส Escrow: #{order.escrow_id || order.id}
            </Typography>
          </Box>

          <Chip
            label={order.status}
            sx={{
              fontWeight: 800,
              fontSize: '0.85rem',
              bgcolor: isPendingReview
                ? 'rgba(210, 153, 34, 0.2)'
                : order.status === 'COMPLETED'
                ? 'rgba(63, 185, 80, 0.2)'
                : '#21262D',
              color: isPendingReview
                ? '#D29922'
                : order.status === 'COMPLETED'
                ? '#3FB950'
                : '#58A6FF',
            }}
          />
        </Box>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Order & Financial Summary */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                สรุปข้อมูลการเงินและการชำระเงิน
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ยอดรวมคำสั่งซื้อ
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#58A6FF">
                    ฿{Number(order.amount || order.total_amount).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ค่าธรรมเนียมระบบ (5%)
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#C9D1D9">
                    ฿{Number(order.platform_fee || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ยอดเงินสุทธิที่ผู้ขายจะได้รับ
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#3FB950">
                    ฿{Number(order.seller_payout || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    สถานะการคุ้มครองเงิน Escrow
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#D29922">
                    {order.escrow_status || 'HELD_IN_VAULT'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5, borderColor: '#30363D' }} />

              <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC" gutterBottom>
                คู่สัญญาในธุรกรรม
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ผู้ซื้อ
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#C9D1D9">
                    {order.buyer_name || `User #${order.buyer_id}`} ({order.buyer_email || 'ไม่มีอีเมล'})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ผู้ขาย
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#C9D1D9">
                    {order.seller_name || `User #${order.seller_id}`} ({order.seller_email || 'ไม่มีอีเมล'})
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Status Audit Trail */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                ประวัติบันทึกสถานะคำสั่งซื้อ (Audit Trail)
              </Typography>
              {orderLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีบันทึกการเปลี่ยนสถานะ
                </Typography>
              ) : (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {orderLogs.map((log, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: '#0D1117',
                        border: '1px solid #21262D',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="#58A6FF">
                          {log.new_status}
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

        {/* Right Column: Payment Slip & Admin Action */}
        <Grid item xs={12} md={5}>
          {/* Slip Verification Card */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                สลิปหลักฐานการโอนเงิน
              </Typography>

              {order.slip_image_url ? (
                <Box sx={{ mt: 2 }}>
                  <Box
                    component="img"
                    src={order.slip_image_url}
                    alt="Payment Slip"
                    onClick={() => setSlipModalOpen(true)}
                    sx={{
                      width: '100%',
                      maxHeight: 280,
                      objectFit: 'contain',
                      borderRadius: 1.5,
                      bgcolor: '#0D1117',
                      border: '1px solid #30363D',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.02)' },
                    }}
                  />
                  <Button
                    variant="text"
                    size="small"
                    fullWidth
                    onClick={() => setSlipModalOpen(true)}
                    sx={{ mt: 1, color: '#58A6FF' }}
                  >
                    คลิกเพื่อดูรูปขนาดเต็ม
                  </Button>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  ผู้ซื้อยังไม่ได้อัปโหลดสลิปโอนเงิน
                </Alert>
              )}

              {/* Admin Actions */}
              {isPendingReview && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ my: 2, borderColor: '#30363D' }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC" gutterBottom>
                    การตัดสินผลการตรวจสอบสลิป
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    กรุณาตรวจยอดเงินในสลิปว่าตรงกับ <strong>฿{Number(order.amount).toLocaleString()}</strong>
                  </Typography>

                  <Stack spacing={1.5}>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => setApproveConfirmOpen(true)}
                      disabled={actionLoading}
                      sx={{ fontWeight: 800, py: 1.5 }}
                    >
                      อนุมัติการชำระเงิน (ปลดล็อกห้องส่งมอบ)
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setRejectDialogOpen(true)}
                      disabled={actionLoading}
                      sx={{ fontWeight: 700 }}
                    >
                      ปฏิเสธสลิป (แจ้งให้อัปโหลดใหม่)
                    </Button>
                  </Stack>
                </Box>
              )}

              {order.status === 'PAYMENT_APPROVED' && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  ยืนยันและอนุมัติการชำระเงินแล้ว ห้องส่งมอบไอดี (Handover Room) เปิดใช้งานแล้ว
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Slip Modal */}
      <Dialog open={slipModalOpen} onClose={() => setSlipModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC' }}>
          สลิปโอนเงิน — คำสั่งซื้อ #{order.order_number || order.id}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0D1117', textAlign: 'center', p: 3 }}>
          <Box component="img" src={order.slip_image_url} alt="Slip" sx={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 1 }} />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22' }}>
          <Button onClick={() => setSlipModalOpen(false)} color="inherit">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Confirm Dialog */}
      <Dialog open={approveConfirmOpen} onClose={() => setApproveConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC', fontWeight: 800 }}>
          ยืนยันการอนุมัติการชำระเงิน
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#161B22' }}>
          <Typography variant="body2" color="text.secondary">
            คุณแน่ใจหรือไม่ว่าต้องการอนุมัติยอดโอนเงินจำนวน <strong>฿{Number(order.amount).toLocaleString()}</strong> นี้?
            ระบบจะเปลี่ยนสถานะคำสั่งซื้อเป็น <strong>PAYMENT_APPROVED</strong> และแจ้งเตือนให้ผู้ขายส่งมอบข้อมูลรหัสผ่านไอดี
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22', p: 2 }}>
          <Button onClick={() => setApproveConfirmOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button variant="contained" color="success" onClick={handleApprovePayment} disabled={actionLoading}>
            {actionLoading ? 'กำลังอนุมัติ...' : 'ยืนยันอนุมัติ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC', fontWeight: 800 }}>
          ปฏิเสธสลิปการโอนเงิน
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#161B22' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            โปรดระบุเหตุผลที่ปฏิเสธสลิปนี้ (เช่น ยอดเงินไม่ตรง, ภาพไม่ชัดเจน, โอนผิดบัญชี):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="เช่น ยอดเงินที่โอนไม่ตรงกับยอดคำสั่งซื้อ กรุณาตรวจสอบและอัปโหลดสลิปที่ถูกต้องใหม่อีกครั้ง"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22', p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button variant="contained" color="error" onClick={handleRejectPayment} disabled={actionLoading}>
            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
