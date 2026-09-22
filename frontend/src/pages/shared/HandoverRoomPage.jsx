import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import handoverApi from '../../services/handover.api';
import CountdownTimer from '../../components/handover/CountdownTimer';
import AccountInfoBox from '../../components/handover/AccountInfoBox';
import { useAuth } from '../../contexts/AuthContext';

export default function HandoverRoomPage() {
  const { order_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Seller Submission Form State
  const [konamiEmail, setKonamiEmail] = useState('');
  const [konamiPassword, setKonamiPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submittingCreds, setSubmittingCreds] = useState(false);

  // Buyer Action State
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  useEffect(() => {
    fetchRoom();
  }, [order_id]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await handoverApi.getRoomStatus(order_id);
      setRoomData(res.data?.data?.room || res.data?.room);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load handover room');
    } finally {
      setLoading(false);
    }
  };

  // Seller: Submit Credentials Handler
  const handleSellerSubmit = async () => {
    if (!konamiEmail.trim() || !konamiPassword.trim()) {
      alert('Please fill in both Konami Email and Password.');
      return;
    }
    setSubmittingCreds(true);
    try {
      await handoverApi.submitAccountInfo(order_id, {
        konami_email: konamiEmail.trim(),
        konami_password: konamiPassword.trim(),
        notes: notes.trim(),
      });
      setSubmitConfirmOpen(false);
      fetchRoom();
    } catch (err) {
      const detailsMsg = err.response?.data?.error?.details?.[0]?.message;
      alert(detailsMsg || err.response?.data?.error?.message || 'Failed to submit account credentials');
    } finally {
      setSubmittingCreds(false);
    }
  };

  // Buyer: Confirm Receipt Handler
  const handleBuyerConfirmReceipt = async () => {
    setConfirmingReceipt(true);
    try {
      await handoverApi.confirmReceipt(order_id);
      setConfirmCompleteOpen(false);
      fetchRoom();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to confirm receipt');
    } finally {
      setConfirmingReceipt(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Entering Secure Handover Vault #{order_id}...
        </Typography>
      </Container>
    );
  }

  if (error || !roomData) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {error || 'Handover room not found or unauthorized access'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Note: Handover Vaults are restricted by Zero-Trust security. You can only enter handover rooms for orders where you are the designated buyer, seller, or an authorized staff member.
          </Typography>
        </Alert>
        <Stack direction="row" spacing={2}>
          <Button component={Link} to="/orders" variant="contained" color="primary" startIcon={<ArrowBackIcon />}>
            Go to My Orders
          </Button>
          <Button component={Link} to={`/orders/${order_id}`} variant="outlined" color="inherit">
            View Order #{order_id} Details
          </Button>
        </Stack>
      </Container>
    );
  }

  const isSeller = user?.id === roomData.seller_id;
  const isBuyer = user?.id === roomData.buyer_id;
  const roomStatus = roomData.status;

  const isWaitingSeller =
    roomStatus === 'WAITING_SELLER' || roomStatus === 'WAITING_SELLER_SUBMISSION';
  const isWaitingBuyer =
    roomStatus === 'WAITING_BUYER' ||
    roomStatus === 'WAITING_BUYER_CONFIRMATION' ||
    roomStatus === 'BUYER_REVIEWING' ||
    roomStatus === 'INFO_PROVIDED';

  // Determine which deadline countdown to show
  const activeDeadline = isWaitingBuyer
    ? roomData.auto_release_at || roomData.buyer_confirm_deadline
    : roomData.expires_at || roomData.handover_deadline;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ color: '#58A6FF', fontSize: 32 }} />
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ห้องส่งมอบนิรภัย (Zero-Trust Handover Vault)
            </Typography>
            <Chip
              label={`คำสั่งซื้อ #${order_id}`}
              size="small"
              sx={{ bgcolor: '#21262D', color: '#58A6FF', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ห้องส่งมอบข้อมูลที่เข้ารหัสแบบ End-to-End • บทบาทของคุณ: <strong>{isSeller ? 'ผู้ขาย (SELLER)' : isBuyer ? 'ผู้ซื้อ (BUYER)' : 'เจ้าหน้าที่ (STAFF)'}</strong>
          </Typography>
        </Box>

        <Button component={Link} to={`/orders/${order_id}`} startIcon={<ArrowBackIcon />} color="inherit">
          รายละเอียดคำสั่งซื้อ
        </Button>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Room Interaction (Role specific) */}
        <Grid item xs={12} md={8}>
          {/* Case 1: Room Completed */}
          {roomStatus === 'COMPLETED' && (
            <Card sx={{ bgcolor: '#161B22', border: '1px solid #238636', borderRadius: 2, p: 3, mb: 3 }}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: '#3FB950', mb: 1 }} />
                <Typography variant="h5" fontWeight={800} color="#F0F6FC">
                  ส่งมอบไอดีเสร็จสมบูรณ์เรียบร้อยแล้ว!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 500, mx: 'auto' }}>
                  ผู้ซื้อได้ตรวจสอบและยืนยันความถูกต้องของบัญชีแล้ว ยอดเงิน Escrow ได้รับการโอนเข้าสู่ยอดเงินของผู้ขายเรียบร้อยแล้ว
                </Typography>
                <Button
                  component={Link}
                  to="/orders"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3, fontWeight: 700 }}
                >
                  กลับไปหน้ารายการคำสั่งซื้อ
                </Button>
              </Box>
            </Card>
          )}

          {/* Case 2: Room Disputed */}
          {roomStatus === 'DISPUTED' && (
            <Alert
              severity="error"
              sx={{ mb: 3, bgcolor: 'rgba(248, 81, 73, 0.1)', border: '1px solid #F85149' }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate(`/disputes/order/${order_id}`)}
                  sx={{ fontWeight: 700 }}
                >
                  ดูรายละเอียดข้อพิพาท
                </Button>
              }
            >
              <strong>ระงับการส่งมอบชั่วคราว:</strong> มีการเปิดเคสข้อพิพาทสำหรับคำสั่งซื้อนี้ ยอดเงิน Escrow และขั้นตอนการส่งมอบถูกระงับไว้จนกว่าเจ้าหน้าที่คนกลางจะพิจารณาตัดสิน
            </Alert>
          )}

          {/* Case 3: Waiting for Seller to Submit Credentials */}
          {isWaitingSeller && (
            <Box>
              {isSeller ? (
                <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                      ส่งมอบข้อมูลบัญชี Konami ID
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      ข้อมูลจะได้รับการเข้ารหัสด้วยอัลกอริทึม AES-256-GCM ผู้ซื้อจะเข้าถึงข้อมูลได้เฉพาะขณะที่การคุ้มครองของระบบ Escrow ทำงานอยู่
                    </Typography>

                    <Stack spacing={2.5}>
                      <TextField
                        label="Konami ID / อีเมลล็อกอิน *"
                        fullWidth
                        value={konamiEmail}
                        onChange={(e) => setKonamiEmail(e.target.value)}
                        placeholder="เช่น your_konami@gmail.com"
                      />
                      <TextField
                        label="รหัสผ่าน Konami ID *"
                        type="password"
                        fullWidth
                        value={konamiPassword}
                        onChange={(e) => setKonamiPassword(e.target.value)}
                        placeholder="••••••••••••"
                      />
                      <TextField
                        label="คำแนะนำในการล็อกอินและหมายเหตุเพิ่มเติม"
                        multiline
                        rows={3}
                        fullWidth
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="เช่น กด Data Link via Konami ID ในหน้าแรกของเกม eFootball ห้ามเปลี่ยน Region..."
                      />

                      <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        startIcon={<SendIcon />}
                        onClick={() => setSubmitConfirmOpen(true)}
                        disabled={!konamiEmail || !konamiPassword}
                        sx={{ fontWeight: 800, py: 1.5 }}
                      >
                        เข้ารหัส & ส่งมอบให้ผู้ซื้อ
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 4, textAlign: 'center', mb: 3 }}>
                  <CircularProgress size={44} sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#F0F6FC">
                    กำลังรอผู้ขายส่งมอบข้อมูลบัญชี
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 500, mx: 'auto' }}>
                    การชำระเงินของคุณได้รับการยืนยันแล้ว ระบบได้แจ้งเตือนผู้ขายให้ส่งมอบข้อมูลบัญชี Konami ID คุณจะสามารถถอดรหัสเพื่อดูข้อมูลได้ทันทีที่ผู้ขายส่งมอบ
                  </Typography>
                </Card>
              )}
            </Box>
          )}

          {/* Case 4: Waiting for Buyer Confirmation (Credentials submitted) */}
          {isWaitingBuyer && (
            <Box>
              {isBuyer ? (
                <Stack spacing={3}>
                  <AccountInfoBox
                    orderId={order_id}
                    isPurged={roomData.credentials_purged}
                  />

                  {/* Buyer Decision Controls */}
                  <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                        ตรวจสอบบัญชีและยืนยันการรับมอบ
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        กรุณาเข้าสู่ระบบเกม eFootball ด้วยข้อมูลด้านบน เพื่อตรวจสอบว่าทีมนักเตะ, ระดับพลัง (OVR) และไอเทมตรงกับประกาศขายหรือไม่
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Button
                            variant="contained"
                            color="success"
                            size="large"
                            fullWidth
                            startIcon={<CheckCircleIcon />}
                            onClick={() => setConfirmCompleteOpen(true)}
                            sx={{ fontWeight: 800, py: 1.5 }}
                          >
                            ยืนยันได้รับไอดีถูกต้อง (ปล่อยเงินให้ผู้ขาย)
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="large"
                            fullWidth
                            startIcon={<WarningAmberIcon />}
                            onClick={() => navigate(`/disputes/new?order_id=${order_id}`)}
                            sx={{ fontWeight: 700, py: 1.5 }}
                          >
                            แจ้งปัญหา / ข้อพิพาท
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              ) : (
                <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 4, mb: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="#3FB950" gutterBottom>
                    ส่งมอบข้อมูลบัญชีให้ผู้ซื้อแล้ว
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    คุณได้ส่งมอบข้อมูลบัญชี Konami ID เรียบร้อยแล้ว ขณะนี้ผู้ซื้อกำลังตรวจสอบความถูกต้องของไอดีภายในกรอบเวลา 48 ชั่วโมง
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    หากผู้ซื้อกดยืนยัน หรือหมดเวลา 48 ชั่วโมงโดยไม่มีการเปิดข้อพิพาท ยอดเงิน Escrow จะถูกปล่อยเข้าสู่บัญชีของคุณโดยอัตโนมัติ
                  </Alert>
                </Card>
              )}
            </Box>
          )}
        </Grid>

        {/* Right Column: Security Guidelines & Timer */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Live Countdown Timer */}
            {activeDeadline && roomStatus !== 'COMPLETED' && roomStatus !== 'DISPUTED' && (
              <CountdownTimer
                targetDate={activeDeadline}
                label={
                  roomStatus === 'WAITING_BUYER_CONFIRMATION'
                    ? 'ระยะเวลาตรวจสอบของผู้ซื้อ'
                    : 'กำหนดเวลาส่งมอบของผู้ขาย'
                }
                onExpire={fetchRoom}
              />
            )}

            {/* Zero-Trust Security Protocol Card */}
            <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <LockIcon sx={{ color: 'primary.light', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC">
                    โปรโตคอลความปลอดภัยของห้องนิรภัย
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    • <strong>เข้ารหัสระดับสูง:</strong> ข้อมูลล็อกอินถูกจัดเก็บด้วยการเข้ารหัส AES-256-GCM พร้อม Ephemeral Salt
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    • <strong>ล้างข้อมูลอัตโนมัติ:</strong> ข้อมูลรหัสผ่านจะถูกลบออกจากหน่วยความจำฐานข้อมูลทันทีเมื่อธุรกรรมเสร็จสิ้น
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    • <strong>บันทึกประวัติการเข้าถึง:</strong> การถอดรหัสและการเปิดดูทั้งหมดจะถูกบันทึก IP address ใน Audit Log
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Seller Confirmation Modal */}
      <Dialog
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#161B22', border: '1px solid #30363D' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#F0F6FC' }}>
          ยืนยันการส่งมอบข้อมูลบัญชี
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            คุณแน่ใจหรือไม่ว่า Konami ID และรหัสผ่านที่ระบุถูกต้อง 100%? เมื่อส่งมอบแล้วระบบจะเริ่มนับเวลาการตรวจสอบของผู้ซื้อทันที
          </Typography>
          <Alert severity="warning" sx={{ bgcolor: 'rgba(210, 153, 34, 0.1)', color: '#D29922' }}>
            กรุณาตรวจสอบให้แน่ใจว่าคุณได้ถอนเบอร์โทรศัพท์และบัตรชำระเงินที่ผูกกับ Konami ID นี้ออกเรียบร้อยแล้ว
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setSubmitConfirmOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSellerSubmit}
            disabled={submittingCreds}
            sx={{ fontWeight: 700 }}
          >
            {submittingCreds ? 'กำลังเข้ารหัส...' : 'ยืนยัน ส่งมอบให้ผู้ซื้อ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Buyer Confirmation Modal */}
      <Dialog
        open={confirmCompleteOpen}
        onClose={() => setConfirmCompleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#161B22', border: '1px solid #30363D' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#F0F6FC' }}>
          ยืนยันการรับมอบไอดี
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            การยืนยันนี้หมายความว่าคุณได้เข้าสู่ระบบบัญชี Konami และตรวจสอบทีมนักเตะเรียบร้อยแล้ว
          </Typography>
          <Alert severity="info">
            การดำเนินการนี้จะปล่อยเงิน Escrow ให้แก่ผู้ขายทันที <strong>การกระทำนี้ไม่สามารถย้อนกลับได้</strong>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfirmCompleteOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleBuyerConfirmReceipt}
            disabled={confirmingReceipt}
            sx={{ fontWeight: 700 }}
          >
            {confirmingReceipt ? 'กำลังปล่อยเงิน...' : 'ยืนยัน & ปล่อยเงิน Escrow'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
