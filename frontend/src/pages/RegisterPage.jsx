import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StoreIcon from '@mui/icons-material/Store';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import authApi from '../services/auth.api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'BUYER',
    phone: '',
    lineId: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณากรอกรหัสผ่านใหม่อีกครั้ง');
      return;
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        display_name: formData.displayName,
        role: formData.role,
        phone: formData.phone || undefined,
        line_id: formData.lineId || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: formData.email } });
      }, 1500);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        setError(details.map((d) => d.message).join('. '));
      } else {
        setError(
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง'
        );
      }
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
      <Card sx={{ maxWidth: 540, width: '100%', p: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <SportsSoccerIcon sx={{ color: 'secondary.main', fontSize: 36, mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              สร้างบัญชีผู้ใช้งานใหม่
            </Typography>
            <Typography variant="body2" color="text.secondary">
              เข้าร่วม eFootball Smart Marketplace เพื่อซื้อ-ขายไอดีปลอดภัย และสแกนประเมินราคาทีม
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              สมัครสมาชิกสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Role Selection Cards */}
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              เลือกบทบาทการใช้งาน:
            </Typography>
            <RadioGroup
              row
              value={formData.role}
              onChange={handleChange('role')}
              sx={{ display: 'flex', gap: 1.5 }}
            >
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  borderColor: formData.role === 'BUYER' ? 'primary.main' : 'divider',
                  bgcolor: formData.role === 'BUYER' ? 'rgba(31, 111, 235, 0.1)' : 'background.paper',
                }}
                onClick={() => setFormData((p) => ({ ...p, role: 'BUYER' }))}
              >
                <FormControlLabel
                  value="BUYER"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingBagIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>ผู้ซื้อ (Buyer)</Typography>
                        <Typography variant="caption" color="text.secondary">ซื้อไอดีปลอดภัยด้วยระบบ Escrow</Typography>
                      </Box>
                    </Box>
                  }
                />
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  borderColor: formData.role === 'SELLER' ? 'secondary.main' : 'divider',
                  bgcolor: formData.role === 'SELLER' ? 'rgba(35, 134, 54, 0.1)' : 'background.paper',
                }}
                onClick={() => setFormData((p) => ({ ...p, role: 'SELLER' }))}
              >
                <FormControlLabel
                  value="SELLER"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StoreIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>ผู้ขาย (Seller)</Typography>
                        <Typography variant="caption" color="text.secondary">ลงขายไอดีและสแกนประเมินราคา</Typography>
                      </Box>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="ชื่อแสดงในระบบ (Display Name)"
                  value={formData.displayName}
                  onChange={handleChange('displayName')}
                  required
                  fullWidth
                  size="small"
                  placeholder="เช่น MasterTactician"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="อีเมล (Email Address)"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  required
                  fullWidth
                  size="small"
                  placeholder="name@example.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="รหัสผ่าน (Password)"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  required
                  fullWidth
                  size="small"
                  helperText="ความยาวอย่างน้อย 6 ตัวอักษร"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ยืนยันรหัสผ่าน (Confirm Password)"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  required
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="เบอร์โทรศัพท์ (ไม่บังคับ)"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  fullWidth
                  size="small"
                  placeholder="08xxxxxxxx"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="LINE ID (ไม่บังคับ)"
                  value={formData.lineId}
                  onChange={handleChange('lineId')}
                  fullWidth
                  size="small"
                  placeholder="เช่น efootball_trader"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              color={formData.role === 'SELLER' ? 'secondary' : 'primary'}
              size="large"
              disabled={loading || success}
              startIcon={<PersonAddIcon />}
              fullWidth
              sx={{ mt: 1 }}
            >
              {loading ? 'กำลังสร้างบัญชี...' : `สมัครสมาชิกในฐานะ${formData.role === 'SELLER' ? 'ผู้ขาย (Seller)' : 'ผู้ซื้อ (Buyer)'}`}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
              <Link to="/login" style={{ color: '#58A6FF', fontWeight: 600 }}>
                เข้าสู่ระบบที่นี่
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
