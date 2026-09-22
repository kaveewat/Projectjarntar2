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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [role, setRole] = useState('BUYER');
  const [isVerified, setIsVerified] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUserDetail(id);
      const u = res.data?.data?.user || res.data?.data || null;
      setUser(u);
      if (u) {
        setRole(u.role || 'BUYER');
        setIsVerified(Boolean(u.is_verified));
        setIsSuspended(Boolean(u.is_suspended));
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      await adminApi.updateUserStatus(id, {
        role,
        is_verified: isVerified ? 1 : 0,
        is_suspended: isSuspended ? 1 : 0,
      });
      setSuccessMsg('อัปเดตสถานะบัญชีผู้ใช้งานเรียบร้อยแล้ว');
      fetchUser();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'ไม่สามารถอัปเดตสถานะผู้ใช้งานได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดข้อมูลผู้ใช้งาน #{id}...
        </Typography>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'ไม่พบข้อมูลผู้ใช้งาน'}
        </Alert>
        <Button component={Link} to="/admin/users" startIcon={<ArrowBackIcon />}>
          กลับไปหน้ารายชื่อผู้ใช้งาน
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button component={Link} to="/admin/users" startIcon={<ArrowBackIcon />} sx={{ mb: 1, color: 'text.secondary' }}>
          กลับไปหน้ารายชื่อผู้ใช้งาน
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              โปรไฟล์ผู้ใช้งาน #{user.id} — {user.display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ลงทะเบียนเมื่อ {formatThaiDateTime(user.created_at)} • อีเมล: {user.email}
            </Typography>
          </Box>
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      {/* Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Account Details */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                ข้อมูลระบุตัวตนและการติดต่อ
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ชื่อที่แสดง
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="#F0F6FC">
                    {user.display_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    อีเมล
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="#58A6FF">
                    {user.email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    เบอร์โทรศัพท์
                  </Typography>
                  <Typography variant="body2" color="#C9D1D9">
                    {user.phone || 'ไม่ได้ระบุ'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    LINE ID
                  </Typography>
                  <Typography variant="body2" color="#C9D1D9">
                    {user.line_id ? `@${user.line_id}` : 'ไม่ได้ระบุ'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    เข้าสู่ระบบล่าสุด
                  </Typography>
                  <Typography variant="body2" color="#C9D1D9">
                    {user.last_login_at ? formatThaiDateTime(user.last_login_at) : 'ยังไม่เคยเข้าสู่ระบบ'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    การยืนยันตัวตน
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color={user.is_verified ? '#3FB950' : '#8B949E'}>
                    {user.is_verified ? 'ผู้ขายยืนยันตัวตนแล้ว (VERIFIED)' : 'ยังไม่ยืนยันตัวตน'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Roles & Privileges */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                การกำหนดบทบาทและการกำกับดูแล
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                ปรับเปลี่ยนสิทธิ์การใช้งาน หรือระงับบัญชีจากการทำธุรกรรมในตลาด
              </Typography>

              <Stack spacing={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>บทบาทบัญชี</InputLabel>
                  <Select value={role} label="บทบาทบัญชี" onChange={(e) => setRole(e.target.value)}>
                    <MenuItem value="BUYER">ผู้ซื้อ (BUYER)</MenuItem>
                    <MenuItem value="SELLER">ผู้ขาย (SELLER)</MenuItem>
                    <MenuItem value="VERIFIED_SELLER">ผู้ขายยืนยันแล้ว (VERIFIED_SELLER)</MenuItem>
                    <MenuItem value="ADMIN">ผู้ดูแลระบบ (ADMIN)</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#F0F6FC">
                        ตราสัญลักษณ์ผู้ขายยืนยันตัวตน
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        มอบตราสีเขียวและโควตาลงขาย 10 รายการ
                      </Typography>
                    </Box>
                  }
                />

                <Divider sx={{ borderColor: '#30363D' }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isSuspended}
                      onChange={(e) => setIsSuspended(e.target.checked)}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={700} color={isSuspended ? '#F85149' : '#F0F6FC'}>
                        ระงับความปลอดภัยของบัญชี
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ระงับการซื้อ การขาย และการเข้าห้องส่งมอบนิรภัย
                      </Typography>
                    </Box>
                  }
                />

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveStatus}
                  disabled={saving}
                  sx={{ fontWeight: 800, py: 1.5 }}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
