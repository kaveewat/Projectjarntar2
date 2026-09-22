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
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

const REASON_LABELS = {
  WRONG_ACCOUNT: 'บัญชีไม่ตรงกับที่ระบุในประกาศ (นักเตะหรือค่าพลังไม่ตรง)',
  LOGIN_FAILED: 'ข้อมูลบัญชีไม่ถูกต้อง (ไม่สามารถเข้าสู่ระบบ Konami ID ได้)',
  ACCOUNT_RECOVERED: 'บัญชีถูกดึงคืนหลังการรับมอบ (ผู้ขายกู้คืนบัญชี)',
  OTHER: 'ปัญหาอื่นๆ (ระบุในรายละเอียดเพิ่มเติม)',
};

const getReasonLabel = (d) => {
  if (!d) return 'ข้อมูลไอดีไม่ตรงกับที่ตกลงไว้';
  if (d.reason_title && !d.reason_title.includes('?')) {
    return d.reason_title;
  }
  const code = d.reason_code || d.code || d.reason;
  if (code && REASON_LABELS[code]) {
    return REASON_LABELS[code];
  }
  return d.reason_title || d.reason || 'ข้อมูลไอดีไม่ตรงกับที่ตกลงไว้';
};

export default function DisputeDetailAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Arbitration modals
  const [resolveBuyerOpen, setResolveBuyerOpen] = useState(false);
  const [resolveSellerOpen, setResolveSellerOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Internal comment
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetchDisputeDetail();
  }, [id]);

  const fetchDisputeDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDisputeDetail(id);
      setData(res.data?.data || res.data || {});
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลข้อพิพาทได้');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveBuyer = async () => {
    if (!resolutionNote.trim()) {
      alert('กรุณาระบุบันทึกเหตุผลในการตัดสินคืนเงินให้ผู้ซื้อ');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.resolveForBuyer(id, resolutionNote.trim());
      setResolveBuyerOpen(false);
      setResolutionNote('');
      fetchDisputeDetail();
    } catch (err) {
      const detailMsg = err.response?.data?.error?.details?.[0]?.message;
      alert(detailMsg || err.response?.data?.error?.message || 'ไม่สามารถตัดสินข้อพิพาทให้ผู้ซื้อได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSeller = async () => {
    if (!resolutionNote.trim()) {
      alert('กรุณาระบุบันทึกเหตุผลในการตัดสินปล่อยเงินให้ผู้ขาย');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.resolveForSeller(id, resolutionNote.trim());
      setResolveSellerOpen(false);
      setResolutionNote('');
      fetchDisputeDetail();
    } catch (err) {
      const detailMsg = err.response?.data?.error?.details?.[0]?.message;
      alert(detailMsg || err.response?.data?.error?.message || 'ไม่สามารถตัดสินข้อพิพาทให้ผู้ขายได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      await adminApi.addDisputeComment(id, newComment.trim());
      setNewComment('');
      fetchDisputeDetail();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'ไม่สามารถบันทึกข้อความได้');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดเคสการตัดสินข้อพิพาท #{id}...
        </Typography>
      </Container>
    );
  }

  const dispute = data?.dispute || data;
  const order = data?.order || {};
  const evidence = data?.evidence || [];
  const comments = data?.comments || [];

  if (error || !dispute || !dispute.id) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error || `ไม่พบข้อมูลข้อพิพาท #${id}`}
        </Alert>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          เคสข้อพิพาทนี้อาจไม่มีอยู่หรือถูกปิดไปแล้ว คุณสามารถตรวจสอบรายการข้อพิพาททั้งหมดได้ที่ศูนย์จัดการข้อพิพาท
        </Typography>
        <Button component={Link} to="/admin/disputes" variant="contained" color="error" startIcon={<ArrowBackIcon />}>
          กลับไปหน้ารายการข้อพิพาท
        </Button>
      </Container>
    );
  }

  const isResolved =
    dispute.status === 'RESOLVED_BUYER' ||
    dispute.status === 'RESOLVED_SELLER' ||
    dispute.status === 'DISMISSED';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top Bar */}
      <Box sx={{ mb: 3 }}>
        <Button component={Link} to="/admin/disputes" startIcon={<ArrowBackIcon />} sx={{ mb: 1, color: 'text.secondary' }}>
          กลับไปหน้ารายการข้อพิพาท
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              เคสการระงับข้อพิพาท #DSP-{dispute.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              คำสั่งซื้อที่เกี่ยวข้อง #{order.order_number || dispute.order_id} • ยื่นเรื่องเมื่อ{' '}
              {formatThaiDateTime(dispute.created_at)}
            </Typography>
          </Box>

          <Chip
            label={dispute.status}
            sx={{
              fontWeight: 800,
              fontSize: '0.85rem',
              bgcolor: isResolved
                ? 'rgba(63, 185, 80, 0.2)'
                : 'rgba(248, 81, 73, 0.2)',
              color: isResolved ? '#3FB950' : '#F85149',
            }}
          />
        </Box>
      </Box>

      {/* Split Panel Grid (15.4 Requirement) */}
      <Grid container spacing={3}>
        {/* Left Panel: Context & Financial Summary */}
        <Grid item xs={12} md={5}>
          {/* Order & Escrow Card */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                บริบทคำสั่งซื้อและเงิน Escrow ที่ถูกระงับ
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    ยอดรวมคำสั่งซื้อ
                  </Typography>
                  <Typography variant="body1" fontWeight={800} color="#58A6FF">
                    ฿{Number(order.amount || dispute.order_amount || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    สถานะ Escrow
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#F85149">
                    ระงับชั่วคราวเนื่องจากมีข้อพิพาท
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    รหัสผู้ซื้อ
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#C9D1D9">
                    #{dispute.buyer_id || order.buyer_id} ({dispute.buyer_name || 'ผู้ซื้อ'})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    รหัสผู้ขาย
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#C9D1D9">
                    #{dispute.seller_id || order.seller_id} ({dispute.seller_name || 'ผู้ขาย'})
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2, borderColor: '#30363D' }} />

              <Button
                component={Link}
                to={`/admin/orders/${dispute.order_id}`}
                variant="outlined"
                fullWidth
                size="small"
                sx={{ borderColor: '#30363D', color: '#58A6FF' }}
              >
                ดูรายละเอียดคำสั่งซื้อแบบเต็ม
              </Button>
            </CardContent>
          </Card>

          {/* Internal Moderator Log */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                บันทึกภายในของผู้ดูแลระบบ (Internal Notes)
              </Typography>

              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  ยังไม่มีบันทึกภายใน
                </Typography>
              ) : (
                <Stack spacing={1.5} sx={{ my: 2 }}>
                  {comments.map((c) => (
                    <Box key={c.id} sx={{ p: 1.5, bgcolor: '#0D1117', borderRadius: 1, border: '1px solid #21262D' }}>
                      <Typography variant="body2" color="#C9D1D9">
                        {c.comment}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        โดยผู้ดูแล #{c.user_id} • {formatThaiDateTime(c.created_at)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="เพิ่มบันทึกภายในของผู้ดูแล..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={commentLoading || !newComment.trim()}
                  sx={{ fontWeight: 700 }}
                >
                  บันทึก
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel: Dispute Claim & Binding Decision */}
        <Grid item xs={12} md={7}>
          {/* Claim & Evidence Card */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F85149" gutterBottom>
                คำร้องและข้อร้องเรียนจากผู้ซื้อ
              </Typography>

              <Box sx={{ bgcolor: '#0D1117', p: 2.5, borderRadius: 1.5, border: '1px solid #21262D', mb: 3 }}>
                <Typography variant="subtitle2" color="#58A6FF" fontWeight={700} gutterBottom>
                  เหตุผลข้อพิพาท: {getReasonLabel(dispute)}
                </Typography>
                <Typography variant="body1" color="#F0F6FC" sx={{ whiteSpace: 'pre-wrap' }}>
                  {dispute.description || 'ผู้ซื้อไม่ได้ระบุรายละเอียดเพิ่มเติม'}
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC" gutterBottom>
                ภาพหน้าจอหลักฐานประกอบ ({evidence.length})
              </Typography>

              {evidence.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  ไม่มีการอัปโหลดภาพหน้าจอหลักฐาน
                </Typography>
              ) : (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {evidence.map((ev, idx) => (
                    <Grid item xs={6} sm={4} key={idx}>
                      <Box
                        component="img"
                        src={ev.file_url}
                        alt="Evidence"
                        onClick={() => window.open(ev.file_url, '_blank')}
                        sx={{
                          width: '100%',
                          height: 140,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid #30363D',
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Arbitration Actions */}
              {!isResolved ? (
                <Box sx={{ mt: 3, p: 2.5, bgcolor: 'rgba(248, 81, 73, 0.05)', border: '1px solid #F85149', borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={800} color="#F0F6FC" gutterBottom>
                    ดำเนินการตัดสินชี้ขาดข้อพิพาท
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    ในฐานะผู้ดูแลระบบ การตัดสินของคุณจะมีผลปลดล็อกและโอนเงินในระบบ Escrow ในทันที
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        startIcon={<ReplayIcon />}
                        onClick={() => setResolveBuyerOpen(true)}
                        sx={{ fontWeight: 800, py: 1.5 }}
                      >
                        ตัดสินให้ผู้ซื้อชนะ (คืนเงินเต็มจำนวน)
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        size="large"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setResolveSellerOpen(true)}
                        sx={{ fontWeight: 800, py: 1.5 }}
                      >
                        ตัดสินให้ผู้ขายชนะ (ปล่อยเงินให้ผู้ขาย)
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Alert severity="success" sx={{ mt: 3 }}>
                  <strong>เคสยุติแล้ว:</strong> {dispute.resolution_note || 'การตัดสินข้อพิพาทเสร็จสมบูรณ์แล้ว'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resolve for Buyer Dialog */}
      <Dialog open={resolveBuyerOpen} onClose={() => setResolveBuyerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC', fontWeight: 800 }}>
          คำตัดสิน: คืนเงินให้ผู้ซื้อ & ยกเลิกคำสั่งซื้อ
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#161B22' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            คำตัดสินนี้จะโอนเงิน <strong>฿{Number(order.amount || dispute.order_amount).toLocaleString()}</strong> คืนเข้ากระเป๋าเงินของผู้ซื้อและยกเลิกคำสั่งซื้อ โปรดระบุเหตุผลและหลักฐานอ้างอิง:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="เช่น ตรวจสอบแล้วพบว่ารหัส Konami ID ไม่ถูกต้องจริง และผู้ขายไม่ดำเนินการแก้ไขให้ภายใน 24 ชม."
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22', p: 2 }}>
          <Button onClick={() => setResolveBuyerOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button variant="contained" color="primary" onClick={handleResolveBuyer} disabled={actionLoading}>
            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการคืนเงินให้ผู้ซื้อ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve for Seller Dialog */}
      <Dialog open={resolveSellerOpen} onClose={() => setResolveSellerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC', fontWeight: 800 }}>
          คำตัดสิน: ปล่อยเงินให้ผู้ขาย
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#161B22' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            คำตัดสินนี้จะโอนเงินสุทธิ <strong>฿{Number(order.seller_payout || 0).toLocaleString()}</strong> ให้ผู้ขายและเปลี่ยนสถานะคำสั่งซื้อเป็นเสร็จสมบูรณ์ (COMPLETED) โปรดระบุเหตุผล:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="เช่น ผู้ขายได้ส่งมอบข้อมูลไอดีถูกต้อง และแสดงหลักฐานว่าผู้ซื้อสามารถล็อกอินเข้าเล่นเกมได้ตามปกติ"
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22', p: 2 }}>
          <Button onClick={() => setResolveSellerOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button variant="contained" color="success" onClick={handleResolveSeller} disabled={actionLoading}>
            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการปล่อยเงินให้ผู้ขาย'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
