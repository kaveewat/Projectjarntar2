import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Paper,
  IconButton,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import authApi from '../services/auth.api';

// Dropzone Sub-Component for individual KYC images
function KycDropzone({ title, subtitle, file, onDrop, onClear }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        onDrop(acceptedFiles[0]);
      }
    },
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>

      {file ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            borderColor: 'secondary.main',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
            <Box
              component="img"
              src={URL.createObjectURL(file)}
              alt={title}
              sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            </Box>
          </Box>
          <IconButton color="error" size="small" onClick={onClear} title="ลบรูปภาพ">
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
            borderColor: isDragActive ? 'primary.main' : 'divider',
            bgcolor: isDragActive ? 'rgba(31, 111, 235, 0.08)' : 'background.default',
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(31, 111, 235, 0.04)' },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" fontWeight={600}>
            {isDragActive ? 'วางไฟล์รูปภาพที่นี่...' : 'คลิกหรือลากไฟล์รูปภาพมาวางที่นี่เพื่ออัปโหลด'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            รองรับ PNG, JPG หรือ WEBP (ขนาดไม่เกิน 10MB)
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default function KYCPage() {
  const [kycData, setKycData] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [realName, setRealName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardFile, setIdCardFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await authApi.getKycStatus();
      if (res.data?.kyc) {
        setKycData(res.data.kyc);
        setRealName(res.data.kyc.real_name || '');
        setIdCardNumber(res.data.kyc.id_card_number || '');
      }
    } catch {
      // Not yet submitted or endpoint empty
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!realName.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุลจริงตามบัตรประชาชน');
      return;
    }

    if (!idCardNumber.trim() || idCardNumber.trim().length < 8) {
      setError('กรุณากรอกเลขบัตรประชาชนหรือหนังสือเดินทางที่ถูกต้อง (อย่างน้อย 8 หลัก)');
      return;
    }

    if (!idCardFile || !selfieFile) {
      setError('กรุณาอัปโหลดรูปภาพให้ครบทั้ง 2 รายการ: ภาพถ่ายบัตรประชาชน และภาพถ่ายเซลฟี่คู่กับบัตร');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('real_name', realName.trim());
      formData.append('id_card_number', idCardNumber.trim());
      formData.append('id_card_image', idCardFile);
      formData.append('selfie_image', selfieFile);

      const res = await authApi.submitKyc(formData);
      setSuccessMsg('ส่งเอกสารยืนยันตัวตน (KYC) เรียบร้อยแล้ว! สถานะขณะนี้อยู่ระหว่างการตรวจสอบ (PENDING)');
      setKycData(res.data?.kyc || { status: 'PENDING', real_name: realName, id_card_number: idCardNumber });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'เกิดข้อผิดพลาดในการส่งเอกสาร KYC กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <VerifiedUserIcon sx={{ color: 'secondary.main', fontSize: 32 }} />
          <Typography variant="h4" fontWeight={800}>
            ยืนยันตัวตนผู้ขาย (KYC Verification)
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          จำเป็นสำหรับผู้ขายเพื่อลงประกาศขายไอดี และถอนเงินค่าขายได้อย่างปลอดภัย
        </Typography>
      </Box>

      {/* KYC Status Banner */}
      {kycData?.status === 'APPROVED' && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <strong>ยืนยันตัวตน KYC อนุมัติแล้ว!</strong> บัญชีผู้ขายของคุณได้รับการตรวจสอบเรียบร้อยแล้ว คุณสามารถลงขายไอดีและรับเงินโอนได้โดยไม่มีข้อจำกัด
        </Alert>
      )}

      {kycData?.status === 'PENDING' && (
        <Alert
          severity="warning"
          icon={<HourglassEmptyIcon fontSize="inherit" />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <strong>กำลังดำเนินการตรวจสอบ (PENDING):</strong> เอกสารของคุณถูกส่งเรียบร้อยแล้ว และอยู่ในคิวการตรวจสอบของเจ้าหน้าที่ โดยทั่วไปจะเสร็จสิ้นภายใน 24 ชั่วโมง
        </Alert>
      )}

      {kycData?.status === 'REJECTED' && (
        <Alert
          severity="error"
          icon={<HighlightOffIcon fontSize="inherit" />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <strong>การยืนยันตัวตนไม่ผ่านการอนุมัติ:</strong> {kycData.reject_reason || 'ภาพถ่ายเอกสารไม่ชัดเจนหรือไม่ตรงกับข้อมูล'} กรุณาอัปโหลดรูปภาพใหม่ที่ชัดเจนด้านล่าง
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Form Card */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              แบบฟอร์มยืนยันตัวตน
            </Typography>
            <Chip
              label={
                kycData?.status === 'APPROVED'
                  ? 'สถานะ: อนุมัติแล้ว (APPROVED)'
                  : kycData?.status === 'PENDING'
                  ? 'สถานะ: รอการตรวจสอบ (PENDING)'
                  : kycData?.status === 'REJECTED'
                  ? 'สถานะ: ปฏิเสธ (REJECTED)'
                  : 'สถานะ: ยังไม่ได้ส่งเอกสาร'
              }
              color={
                kycData?.status === 'APPROVED'
                  ? 'success'
                  : kycData?.status === 'PENDING'
                  ? 'warning'
                  : kycData?.status === 'REJECTED'
                  ? 'error'
                  : 'default'
              }
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
          <Divider />

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ชื่อ-นามสกุลจริง (ตรงตามบัตรประชาชน)"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  required
                  fullWidth
                  size="small"
                  placeholder="เช่น สมชาย ใจดี"
                  disabled={kycData?.status === 'PENDING' || kycData?.status === 'APPROVED'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="เลขบัตรประชาชน / หนังสือเดินทาง"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  required
                  fullWidth
                  size="small"
                  placeholder="เช่น 1100200300400"
                  disabled={kycData?.status === 'PENDING' || kycData?.status === 'APPROVED'}
                />
              </Grid>
            </Grid>

            {/* Document Upload Dropzones (2 Images) */}
            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
              รูปถ่ายเอกสาร (จำเป็นต้องอัปโหลดทั้ง 2 รูป):
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <KycDropzone
                  title="1. ภาพถ่ายบัตรประชาชน (ด้านหน้า)"
                  subtitle="ภาพถ่ายด้านหน้าบัตรประจำตัวประชาชนที่ชัดเจน ไม่มีการแก้ไขตกแต่ง"
                  file={idCardFile}
                  onDrop={(f) => setIdCardFile(f)}
                  onClear={() => setIdCardFile(null)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KycDropzone
                  title="2. ภาพถ่ายเซลฟี่คู่กับบัตรประชาชน"
                  subtitle="ภาพถ่ายหน้าตรงถือบัตรประชาชนแนบระดับคาง มองเห็นข้อมูลบนบัตรชัดเจน"
                  file={selfieFile}
                  onDrop={(f) => setSelfieFile(f)}
                  onClear={() => setSelfieFile(null)}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                disabled={submitting || kycData?.status === 'APPROVED'}
                startIcon={<VerifiedUserIcon />}
              >
                {submitting
                  ? 'กำลังอัปโหลดเอกสาร...'
                  : kycData?.status === 'PENDING'
                  ? 'ส่งเอกสารใหม่อีกครั้ง'
                  : 'ส่งข้อมูลยืนยันตัวตน'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
