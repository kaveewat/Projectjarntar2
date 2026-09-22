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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function KYCDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getKycDetail(id);
      setKyc(res.data?.data?.kyc || res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลคำขอ KYC ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKyc = async () => {
    setActionLoading(true);
    try {
      await adminApi.approveKyc(id);
      setApproveConfirmOpen(false);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'ไม่สามารถอนุมัติ KYC ได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKyc = async () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธการยืนยันตัวตน KYC');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.rejectKyc(id, rejectReason.trim());
      setRejectDialogOpen(false);
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'ไม่สามารถปฏิเสธ KYC ได้');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดเอกสารยืนยันตัวตน...
        </Typography>
      </Container>
    );
  }

  if (error || !kyc) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'ไม่พบข้อมูลคำขอยืนยันตัวตน KYC'}
        </Alert>
        <Button component={Link} to="/admin/kyc" startIcon={<ArrowBackIcon />}>
          กลับไปหน้ารายการ KYC
        </Button>
      </Container>
    );
  }

  const isPending = kyc.status === 'PENDING';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button component={Link} to="/admin/kyc" startIcon={<ArrowBackIcon />} sx={{ mb: 1, color: 'text.secondary' }}>
          กลับไปหน้ารายการ KYC
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ตรวจสอบยืนยันตัวตนผู้ขาย (KYC) #{kyc.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ยื่นเรื่องโดยผู้ใช้งาน #{kyc.user_id} ({kyc.display_name || kyc.email}) เมื่อ {formatThaiDateTime(kyc.submitted_at)}
            </Typography>
          </Box>

          <Chip
            label={kyc.status}
            sx={{
              fontWeight: 800,
              fontSize: '0.85rem',
              bgcolor: isPending
                ? 'rgba(210, 153, 34, 0.2)'
                : kyc.status === 'APPROVED'
                ? 'rgba(63, 185, 80, 0.2)'
                : 'rgba(248, 81, 73, 0.2)',
              color: isPending
                ? '#D29922'
                : kyc.status === 'APPROVED'
                ? '#3FB950'
                : '#F85149',
            }}
          />
        </Box>
      </Box>

      {/* Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Applicant Information & Documents */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                ข้อมูลระบุตัวตนของผู้สมัคร
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ชื่อ-นามสกุลจริงตามบัตร
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="#F0F6FC">
                    {kyc.real_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    เลขประจำตัวประชาชน
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="#58A6FF">
                    {kyc.id_card_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    อีเมลที่ลงทะเบียน
                  </Typography>
                  <Typography variant="body2" color="#C9D1D9">
                    {kyc.email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    เบอร์โทรศัพท์ / LINE ID
                  </Typography>
                  <Typography variant="body2" color="#C9D1D9">
                    {kyc.phone || '-'} • {kyc.line_id ? `@${kyc.line_id}` : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Uploaded Documents Preview */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                เอกสารหลักฐานที่อัปโหลด
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* ID Card */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    1. รูปถ่ายบัตรประชาชน / หนังสือเดินทาง
                  </Typography>
                  <Box
                    component="img"
                    src={kyc.id_card_image_url}
                    alt="ID Card"
                    onClick={() => window.open(kyc.id_card_image_url, '_blank')}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'contain',
                      borderRadius: 1.5,
                      bgcolor: '#0D1117',
                      border: '1px solid #30363D',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#58A6FF' },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                    คลิกเพื่อดูภาพขนาดเต็ม
                  </Typography>
                </Grid>

                {/* Selfie */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    2. ภาพถ่ายเซลฟี่คู่กับบัตรประชาชน
                  </Typography>
                  <Box
                    component="img"
                    src={kyc.selfie_image_url || kyc.id_card_image_url}
                    alt="Selfie"
                    onClick={() => window.open(kyc.selfie_image_url || kyc.id_card_image_url, '_blank')}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'contain',
                      borderRadius: 1.5,
                      bgcolor: '#0D1117',
                      border: '1px solid #30363D',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#58A6FF' },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                    คลิกเพื่อดูภาพขนาดเต็ม
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Moderation Decision */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                การตัดสินผลการตรวจสอบ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                การอนุมัติจะตั้งค่าสถานะผู้ขายเป็นยืนยันตัวตนแล้วทันที พร้อมรับสัญลักษณ์ Verified และปลดล็อกโควตาลงขายสูงสุด (10 รายการ)
              </Typography>

              {isPending ? (
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setApproveConfirmOpen(true)}
                    disabled={actionLoading}
                    sx={{ fontWeight: 800, py: 1.5 }}
                  >
                    อนุมัติการยืนยันตัวตน (KYC)
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<CancelIcon />}
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={actionLoading}
                    sx={{ fontWeight: 700 }}
                  >
                    ปฏิเสธคำขอ
                  </Button>
                </Stack>
              ) : kyc.status === 'APPROVED' ? (
                <Alert severity="success">
                  <strong>ยืนยันแล้ว:</strong> ผู้ขายรายนี้ได้รับการอนุมัติโดยผู้ดูแล #{kyc.reviewed_by} เมื่อ {formatThaiDateTime(kyc.reviewed_at)}
                </Alert>
              ) : (
                <Alert severity="error">
                  <strong>ปฏิเสธแล้ว:</strong> {kyc.reject_reason || 'คำขอถูกปฏิเสธ'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve Dialog */}
      <Dialog open={approveConfirmOpen} onClose={() => setApproveConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC', fontWeight: 800 }}>
          ยืนยันการอนุมัติ KYC
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#161B22' }}>
          <Typography variant="body2" color="text.secondary">
            คุณแน่ใจหรือไม่ว่าต้องการอนุมัติการยืนยันตัวตนให้ <strong>{kyc.real_name}</strong>? ผู้ใช้งานจะได้รับสถานะผู้ขายยืนยันตัวตนทันที
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22', p: 2 }}>
          <Button onClick={() => setApproveConfirmOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button variant="contained" color="success" onClick={handleApproveKyc} disabled={actionLoading}>
            {actionLoading ? 'กำลังอนุมัติ...' : 'ยืนยันอนุมัติ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC', fontWeight: 800 }}>
          ปฏิเสธคำขอยืนยันตัวตน KYC
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#161B22' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            โปรดระบุเหตุผลที่ไม่อนุมัติคำขอนี้:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="เช่น ภาพบัตรประชาชนไม่ชัดเจน หรือภาพถ่ายเซลฟี่ใบหน้าไม่ตรงกับบัตร"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22', p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button variant="contained" color="error" onClick={handleRejectKyc} disabled={actionLoading}>
            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
