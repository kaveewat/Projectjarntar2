import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import GavelIcon from '@mui/icons-material/Gavel';
import disputesApi from '../../services/disputes.api';
import ordersApi from '../../services/orders.api';

export default function OpenDisputePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdParam = searchParams.get('order_id') || '';

  const [orderId, setOrderId] = useState(orderIdParam);
  const [reasons, setReasons] = useState([]);
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  const [loadingReasons, setLoadingReasons] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    try {
      setLoadingReasons(true);
      const res = await disputesApi.getReasons();
      const reasonsList = res.data?.reasons || res.data || [];
      setReasons(reasonsList);
      if (reasonsList.length > 0) {
        setSelectedReasonId(reasonsList[0].id);
      }
    } catch {
      // Fallback reasons if catalog empty
      setReasons([
        { id: 1, title: 'ข้อมูลบัญชีไม่ถูกต้อง / ไม่สามารถเข้าสู่ระบบ Konami ID ได้' },
        { id: 2, title: 'นักเตะในทีมไม่ตรงกับข้อมูลและรูปภาพในประกาศขาย' },
        { id: 3, title: 'บัญชีถูกดึงคืน / ผู้ขายเปลี่ยนรหัสผ่านกลับ' },
        { id: 4, title: 'การละเมิดเงื่อนไขอื่นๆ หรือข้อมูลไม่ตรงตามจริง' },
      ]);
      setSelectedReasonId(1);
    } finally {
      setLoadingReasons(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        setEvidenceFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId) {
      setError('กรุณาระบุเลขที่คำสั่งซื้อ (Order ID) สำหรับข้อพิพาทนี้');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('กรุณาระบุรายละเอียดปัญหาอย่างชัดเจน (ความยาวอย่างน้อย 10 ตัวอักษร)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await disputesApi.openDispute({
        order_id: Number(orderId),
        dispute_reason_id: Number(selectedReasonId),
        description: description.trim(),
      });

      const disputeId = res.data?.dispute?.id;

      // If evidence image is attached, upload it
      if (disputeId && evidenceFile) {
        try {
          const formData = new FormData();
          formData.append('evidence', evidenceFile);
          formData.append('description', 'Initial dispute filing screenshot');
          await disputesApi.uploadEvidence(disputeId, formData);
        } catch (uploadErr) {
          console.warn('Evidence upload error:', uploadErr);
        }
      }

      navigate(`/disputes/${disputeId || orderId}`);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'เปิดข้อพิพาทไม่สำเร็จ กรุณาตรวจสอบสถานะคำสั่งซื้อ'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          to={orderIdParam ? `/handover/${orderIdParam}` : '/orders'}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, color: 'text.secondary' }}
        >
          {orderIdParam ? `กลับไปยังห้องส่งมอบ #${orderIdParam}` : 'กลับไปหน้ารายการคำสั่งซื้อ'}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningAmberIcon sx={{ color: '#F85149', fontSize: 32 }} />
          <Typography variant="h4" fontWeight={800} color="#F0F6FC">
            แจ้งข้อพิพาทคำสั่งซื้อ Escrow
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          เปิดเคสข้อพิพาทอย่างเป็นทางการ ยอดเงิน Escrow จะถูกระงับชั่วคราวเพื่อรอการตัดสินจากเจ้าหน้าที่ดูแลระบบ
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Escrow Dispute Notice */}
      <Alert
        severity="info"
        sx={{ mb: 3, bgcolor: 'rgba(56, 139, 253, 0.12)', border: '1px solid #1F6FEB' }}
      >
        <strong>การคุ้มครองผู้ซื้อ (Buyer Protection Guarantee):</strong> การส่งรายงานข้อพิพาทนี้จะหยุดการนับถอยหลังปล่อยเงินอัตโนมัติ (48 ชม.) ทันที เจ้าหน้าที่คนกลางของแพลตฟอร์มจะเข้าตรวจสอบและตัดสินตามหลักฐานที่แนบมา
      </Alert>

      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
        <CardContent sx={{ p: 3.5 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Order ID */}
              <TextField
                label="เลขที่คำสั่งซื้อ (Order ID) *"
                fullWidth
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="เช่น 84"
                disabled={Boolean(orderIdParam)}
                helperText={orderIdParam ? 'เชื่อมโยงกับห้องส่งมอบปัจจุบันของคุณ' : 'ระบุ ID ของคำสั่งซื้อที่มีปัญหา'}
              />

              {/* Dispute Reason */}
              <TextField
                select
                label="สาเหตุของข้อพิพาท *"
                fullWidth
                value={selectedReasonId}
                onChange={(e) => setSelectedReasonId(e.target.value)}
                disabled={loadingReasons}
              >
                {reasons.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.title || r.reason_code}
                  </MenuItem>
                ))}
              </TextField>

              {/* Description */}
              <TextField
                label="รายละเอียดของปัญหาที่พบ *"
                multiline
                rows={4}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายสิ่งที่เกิดขึ้น เช่น ข้อมูลรหัสผ่านไม่ถูกต้อง, บัญชี Konami โดนระงับ, หรือนักเตะในทีมไม่ตรงกับภาพในประกาศ..."
              />

              {/* Evidence Screenshot Dropzone */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC" gutterBottom>
                  หลักฐานประกอบ (ภาพถ่ายหน้าจอ Screenshot)
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  แนบภาพถ่ายหน้าจอแสดงข้อความผิดพลาดหรือทีมนักเตะในเกม (ขนาดไม่เกิน 10MB)
                </Typography>

                {evidenceFile ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#0D1117',
                      border: '1px solid #1F6FEB',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                      <Box
                        component="img"
                        src={URL.createObjectURL(evidenceFile)}
                        alt="ภาพตัวอย่างหลักฐาน"
                        sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} color="#F0F6FC" noWrap>
                          {evidenceFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton color="error" size="small" onClick={() => setEvidenceFile(null)}>
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ) : (
                  <Paper
                    {...getRootProps()}
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderStyle: 'dashed',
                      borderColor: isDragActive ? '#F85149' : '#30363D',
                      bgcolor: isDragActive ? 'rgba(248, 81, 73, 0.08)' : '#0D1117',
                      borderRadius: 2,
                      '&:hover': { borderColor: '#F85149' },
                    }}
                  >
                    <input {...getInputProps()} />
                    <CloudUploadIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" fontWeight={600} color="#F0F6FC">
                      {isDragActive ? 'วางภาพถ่ายหลักฐานที่นี่...' : 'คลิกหรือลากภาพถ่ายหลักฐานมาวางที่นี่'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      รองรับไฟล์ภาพ PNG, JPG หรือ WEBP
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="large"
                fullWidth
                disabled={submitting || !orderId || !description}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <GavelIcon />}
                sx={{ fontWeight: 800, py: 1.5, mt: 1 }}
              >
                {submitting ? 'กำลังส่งข้อมูลข้อพิพาท...' : 'ยืนยันเปิดข้อพิพาทอย่างเป็นทางการ'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
