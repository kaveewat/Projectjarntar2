import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import authApi from '../services/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await authApi.forgotPassword({ email });
      setMessage(res.message || 'หากมีบัญชีนี้ในระบบ คำแนะนำในการรีเซ็ตรหัสผ่านได้ถูกส่งไปยังอีเมลของคุณแล้ว');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งคำขอรีเซ็ตรหัสผ่าน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', p: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <LockResetIcon sx={{ color: 'warning.main', fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              ลืมรหัสผ่าน
            </Typography>
            <Typography variant="body2" color="text.secondary">
              กรอกอีเมลที่คุณใช้ลงทะเบียนเพื่อรับคำแนะนำในการตั้งรหัสผ่านใหม่
            </Typography>
          </Box>

          {message && <Alert severity="info">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="อีเมล (Email Address)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="name@example.com"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              fullWidth
            >
              {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอรีเซ็ตรหัสผ่าน'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              จำรหัสผ่านได้แล้ว?{' '}
              <Link to="/login" style={{ color: '#58A6FF', fontWeight: 600 }}>
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
