import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
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
  Paper,
  IconButton,
  MenuItem,
  Stack,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ordersApi from '../../services/orders.api';

export default function PaymentSubmitPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [slipFile, setSlipFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PROMPTPAY');
  const [bankReference, setBankReference] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.getOrderDetail(id);
      setOrder(res.data?.data?.order || res.data?.order);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        setSlipFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slipFile) {
      setError('กรุณาอัปโหลดรูปภาพสลิปการโอนเงินก่อนส่งข้อมูล');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('payment_proof', slipFile);
      formData.append('payment_method', paymentMethod);
      if (bankReference.trim()) {
        formData.append('bank_reference', bankReference.trim());
      }

      await ordersApi.submitPayment(id, formData);
      // Redirect back to order detail upon successful submission
      navigate(`/orders/${id}`);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'ส่งหลักฐานการชำระเงินไม่สำเร็จ กรุณาตรวจสอบไฟล์รูปภาพและลองใหม่อีกครั้ง'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดข้อมูลการชำระเงิน...
        </Typography>
      </Container>
    );
  }

  if (error && !order) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'ไม่พบคำสั่งซื้อ'}
        </Alert>
        <Button component={Link} to="/orders" startIcon={<ArrowBackIcon />}>
          กลับไปคำสั่งซื้อทั้งหมด
        </Button>
      </Container>
    );
  }

  const payableAmount = order?.total_amount || order?.amount || 0;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          to={`/orders/${id}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, color: 'text.secondary' }}
        >
          กลับไปยังคำสั่งซื้อ #{order?.order_number}
        </Button>
        <Typography variant="h4" fontWeight={800} color="#F0F6FC">
          แนบสลิปชำระเงิน Escrow
        </Typography>
        <Typography variant="body2" color="text.secondary">
          โอนเงินยอดชำระที่ถูกต้องไปยังบัญชี Escrow กลางของแพลตฟอร์ม และแนบหลักฐานสลิปด้านล่าง
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Deadline Notice */}
      <Alert
        icon={<AccessTimeIcon />}
        severity="warning"
        sx={{ mb: 3, bgcolor: 'rgba(210, 153, 34, 0.12)', border: '1px solid #D29922' }}
      >
        <strong>ระยะเวลาชำระเงิน 2 ชั่วโมง:</strong> กรุณาแนบสลิปการโอนเงินภายใน 2 ชั่วโมง หากไม่ได้รับการแนบหลักฐานภายในเวลาที่กำหนด ระบบจะยกเลิกคำสั่งซื้อและนำไอดีกลับสู่ตลาดโดยอัตโนมัติ
      </Alert>

      <Grid container spacing={3}>
        {/* Left Column: Escrow Bank Details & QR */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase">
                ยอดเงินที่ต้องชำระ
              </Typography>
              <Typography variant="h3" fontWeight={800} color="#58A6FF" sx={{ my: 1 }}>
                ฿{Number(payableAmount).toLocaleString()}
              </Typography>

              {/* PromptPay QR Simulation Box */}
              <Box
                sx={{
                  mt: 2,
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#0D1117',
                  border: '1px solid #30363D',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <QrCode2Icon sx={{ fontSize: 130, color: '#F0F6FC' }} />
                <Typography variant="caption" fontWeight={700} color="#3FB950" sx={{ mt: 1 }}>
                  PROMPTPAY ESCROW QR
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  สแกนผ่านแอปพลิเคชันธนาคารทุกธนาคาร
                </Typography>
              </Box>

              <Divider sx={{ my: 2.5, borderColor: '#30363D' }} />

              {/* Bank Account Info */}
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  บัญชีธนาคารสำหรับโอนเงิน
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#F0F6FC">
                  ธนาคารกสิกรไทย (Kasikorn Bank - K-Bank)
                </Typography>
                <Typography variant="body2" color="#58A6FF" fontWeight={700}>
                  123-4-56789-0
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  ชื่อบัญชี: eFootball Escrow Vault Platform
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Slip Dropzone & Submission Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                อัปโหลดสลิปการโอนเงิน
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                รองรับไฟล์ภาพสลิป PNG, JPG หรือ WEBP (ขนาดไม่เกิน 10MB)
              </Typography>

              <form onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  {/* Dropzone */}
                  {slipFile ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: '#0D1117',
                        border: '1px solid #3FB950',
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                        <Box
                          component="img"
                          src={URL.createObjectURL(slipFile)}
                          alt="ภาพตัวอย่างสลิป"
                          sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} color="#F0F6FC" noWrap>
                            {slipFile.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(slipFile.size / (1024 * 1024)).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton color="error" size="small" onClick={() => setSlipFile(null)}>
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  ) : (
                    <Paper
                      {...getRootProps()}
                      variant="outlined"
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderStyle: 'dashed',
                        borderColor: isDragActive ? '#1F6FEB' : '#30363D',
                        bgcolor: isDragActive ? 'rgba(31, 111, 235, 0.08)' : '#0D1117',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#58A6FF', bgcolor: 'rgba(31, 111, 235, 0.04)' },
                      }}
                    >
                      <input {...getInputProps()} />
                      <CloudUploadIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1" fontWeight={600} color="#F0F6FC">
                        {isDragActive ? 'วางไฟล์รูปภาพสลิปที่นี่...' : 'คลิกหรือลากไฟล์ภาพสลิปมาวางที่นี่'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        รองรับภาพถ่ายหรือภาพถ่ายหน้าจอ (Screenshot) จากแอปธนาคาร
                      </Typography>
                    </Paper>
                  )}

                  {/* Payment Method */}
                  <TextField
                    select
                    label="วิธีการชำระเงิน"
                    fullWidth
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="PROMPTPAY">PromptPay QR Code</MenuItem>
                    <MenuItem value="BANK_TRANSFER">โอนเงินผ่านบัญชีธนาคารโดยตรง</MenuItem>
                  </TextField>

                  {/* Bank Reference */}
                  <TextField
                    label="เลขอ้างอิงการโอน / Transaction ID (ไม่บังคับ)"
                    fullWidth
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="เช่น 2026092100018938"
                    helperText="ช่วยให้เจ้าหน้าที่ตรวจสอบสลิปได้รวดเร็วยิ่งขึ้น"
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={submitting || !slipFile}
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                    sx={{ fontWeight: 800, py: 1.5, mt: 1 }}
                  >
                    {submitting ? 'กำลังส่งข้อมูลสลิป...' : 'ยืนยันและส่งหลักฐานการชำระเงิน'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
