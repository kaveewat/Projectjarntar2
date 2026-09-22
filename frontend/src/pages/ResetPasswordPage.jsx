import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({ token, new_password: password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ โทเค็นอาจไม่ถูกต้องหรือหมดอายุแล้ว');
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
            <LockResetIcon sx={{ color: 'primary.main', fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              ตั้งรหัสผ่านใหม่
            </Typography>
            <Typography variant="body2" color="text.secondary">
              กำหนดรหัสผ่านใหม่สำหรับเข้าใช้งานระบบ
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              เปลี่ยนรหัสผ่านสำเร็จแล้ว! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </Alert>
          )}

          <Box component="form" onSubmit={handleReset} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="รหัสผ่านใหม่"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
              helperText="ความยาวอย่างน้อย 6 ตัวอักษร"
            />
            <TextField
              label="ยืนยันรหัสผ่านใหม่"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              size="small"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading || success}
              fullWidth
            >
              {loading ? 'กำลังอัปเดตรหัสผ่าน...' : 'บันทึกรหัสผ่านใหม่'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              กลับไปหน้า{' '}
              <Link to="/login" style={{ color: '#58A6FF', fontWeight: 600 }}>
                เข้าสู่ระบบ
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
