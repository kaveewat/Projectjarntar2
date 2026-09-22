import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  Alert,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from '../contexts/AuthContext';
import authApi from '../services/auth.api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState(0);

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    displayName: user?.display_name || '',
    phone: user?.phone || '',
    lineId: user?.line_id || '',
  });

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // KYC Status State
  const [kycData, setKycData] = useState(null);

  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.display_name || '',
        phone: user.phone || '',
        lineId: user.line_id || '',
      });
    }

    // Fetch user KYC status
    authApi
      .getKycStatus()
      .then((res) => {
        setKycData(res.data?.kyc || null);
      })
      .catch(() => {});
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setSavingProfile(true);

    try {
      const res = await authApi.updateProfile({
        display_name: profileForm.displayName,
        phone: profileForm.phone || null,
        line_id: profileForm.lineId || null,
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setProfileMessage('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch (err) {
      setProfileError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setSavingPassword(true);

    try {
      await authApi.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setPasswordMessage('เปลี่ยนรหัสผ่านสำเร็จแล้ว');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาตรวจสอบรหัสผ่านปัจจุบัน'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const getKycChip = () => {
    if (!kycData) {
      return <Chip label="ยังไม่ได้ยืนยัน" size="small" variant="outlined" />;
    }
    if (kycData.status === 'APPROVED') {
      return <Chip label="ยืนยันตัวตนแล้ว (อนุมัติ)" color="success" size="small" icon={<VerifiedUserIcon />} />;
    }
    if (kycData.status === 'PENDING') {
      return <Chip label="รอการตรวจสอบ" color="warning" size="small" />;
    }
    if (kycData.status === 'REJECTED') {
      return <Chip label="ปฏิเสธ" color="error" size="small" />;
    }
    return <Chip label={kycData.status} size="small" />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        โปรไฟล์และการตั้งค่าบัญชี
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        จัดการข้อมูลส่วนตัว ช่องทางการติดต่อ และการตั้งค่าความปลอดภัยของบัญชี
      </Typography>

      <Grid container spacing={3}>
        {/* Left Side: Summary Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3, mb: 3 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: user?.role === 'ADMIN' ? 'error.main' : 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
              </Avatar>

              <Typography variant="h6" fontWeight={700}>
                {user?.display_name || 'ผู้ใช้งาน'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : user?.role?.includes('SELLER') ? 'ผู้ขาย (Seller)' : 'ผู้ซื้อ (Buyer)'}
                  color={user?.role === 'ADMIN' ? 'error' : user?.role?.includes('SELLER') ? 'secondary' : 'primary'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                {user?.is_verified ? (
                  <Chip label="ยืนยันอีเมลแล้ว" color="success" size="small" variant="outlined" />
                ) : (
                  <Chip label="ยังไม่ยืนยันอีเมล" color="default" size="small" variant="outlined" />
                )}
              </Stack>
            </CardContent>

            <Divider sx={{ my: 1.5 }} />

            {/* KYC Status Section */}
            <Box sx={{ p: 1, textAlign: 'left' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  สถานะการยืนยันตัวตน KYC:
                </Typography>
                {getKycChip()}
              </Box>

              <Button
                component={Link}
                to="/seller/kyc"
                variant="outlined"
                color="secondary"
                size="small"
                fullWidth
                startIcon={<VerifiedUserIcon />}
                sx={{ mt: 1 }}
              >
                ไปยังศูนย์ยืนยันตัวตน (KYC Center)
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Right Side: Tabbed Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab icon={<PersonIcon />} iconPosition="start" label="ข้อมูลส่วนตัว" />
                <Tab icon={<VpnKeyIcon />} iconPosition="start" label="ความปลอดภัยและรหัสผ่าน" />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Tab 0: Personal Info Form */}
              {activeTab === 0 && (
                <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {profileMessage && <Alert severity="success">{profileMessage}</Alert>}
                  {profileError && <Alert severity="error">{profileError}</Alert>}

                  <TextField
                    label="อีเมลบัญชีผู้ใช้"
                    value={user?.email || ''}
                    disabled
                    fullWidth
                    size="small"
                    helperText="อีเมลไม่สามารถเปลี่ยนแปลงได้"
                  />

                  <TextField
                    label="ชื่อแสดงในระบบ (Display Name)"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />

                  <TextField
                    label="เบอร์โทรศัพท์"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    fullWidth
                    size="small"
                    placeholder="08xxxxxxxx"
                  />

                  <TextField
                    label="LINE ID"
                    value={profileForm.lineId}
                    onChange={(e) => setProfileForm({ ...profileForm, lineId: e.target.value })}
                    fullWidth
                    size="small"
                    placeholder="efootball_trader"
                    helperText="ใช้สำหรับการติดต่อสื่อสารระหว่างผู้ซื้อและผู้ขายหลังชำระเงินเข้า Escrow"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={savingProfile}
                    startIcon={<SaveIcon />}
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    {savingProfile ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลโปรไฟล์'}
                  </Button>
                </Box>
              )}

              {/* Tab 1: Password Change Form */}
              {activeTab === 1 && (
                <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {passwordMessage && <Alert severity="success">{passwordMessage}</Alert>}
                  {passwordError && <Alert severity="error">{passwordError}</Alert>}

                  <TextField
                    label="รหัสผ่านปัจจุบัน"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />

                  <TextField
                    label="รหัสผ่านใหม่"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    fullWidth
                    size="small"
                    helperText="ความยาวอย่างน้อย 6 ตัวอักษร"
                  />

                  <TextField
                    label="ยืนยันรหัสผ่านใหม่"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    disabled={savingPassword}
                    startIcon={<SecurityIcon />}
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    {savingPassword ? 'กำลังอัปเดตรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
