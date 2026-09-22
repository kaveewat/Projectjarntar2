import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, access_token } = res.data.data;
      login(user, access_token);

      if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo account switcher for seamless testing
  const handleQuickLogin = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
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
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <SportsSoccerIcon sx={{ color: 'secondary.main', fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              เข้าสู่ระบบ eFootball Market
            </Typography>
            <Typography variant="body2" color="text.secondary">
              กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานตลาดและแดชบอร์ด
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {/* Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="อีเมล"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
              autoComplete="email"
            />
            <TextField
              label="รหัสผ่าน"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              size="small"
              autoComplete="current-password"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
              <Link to="/forgot-password" style={{ color: '#58A6FF', fontSize: '0.8rem', textDecoration: 'none' }}>
                ลืมรหัสผ่าน?
              </Link>
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={<LockOpenIcon />}
              fullWidth
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </Box>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">
              บัญชีทดสอบด่วน (DEMO TESTING)
            </Typography>
          </Divider>

          {/* Quick Demo Buttons for QA & Reviewer Testing */}
          <Stack spacing={1}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => handleQuickLogin('admin@efootball-market.com', 'Admin@123456')}
              sx={{ justifyContent: 'space-between' }}
            >
              <span>👑 ผู้ดูแลระบบสูงสุด (Super Admin)</span>
              <Chip label="ADMIN" size="small" color="error" sx={{ height: 20 }} />
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={() => handleQuickLogin('bugko@gmail.com', '123456')}
              sx={{ justifyContent: 'space-between' }}
            >
              <span>🏪 ผู้ขายยืนยันตัวตน (Verified Seller)</span>
              <Chip label="SELLER" size="small" color="secondary" sx={{ height: 20 }} />
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => handleQuickLogin('bugboy@gmail.com', '123456')}
              sx={{ justifyContent: 'space-between' }}
            >
              <span>🛒 ผู้ซื้อทั่วไป (Active Buyer)</span>
              <Chip label="BUYER" size="small" color="primary" sx={{ height: 20 }} />
            </Button>
          </Stack>

          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ยังไม่มีบัญชีผู้ใช้งาน?{' '}
              <Link to="/register" style={{ color: '#58A6FF', fontWeight: 600 }}>
                สมัครสมาชิกที่นี่
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
