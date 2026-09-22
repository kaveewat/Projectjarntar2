import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Alert,
  Tooltip,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import CheckIcon from '@mui/icons-material/Check';
import handoverApi from '../../services/handover.api';

export default function AccountInfoBox({ orderId, initialCredentials = null, isPurged = false }) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleDecrypt = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await handoverApi.getAccountInfo(orderId);
      setCredentials(res.data?.credentials || res.data);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'ถอดรหัสข้อมูลไม่สำเร็จ คุณอาจไม่มีสิทธิ์เข้าถึงหรือข้อมูลหมดอายุแล้ว'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isPurged) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: '#161B22',
          border: '1px solid #30363D',
          textAlign: 'center',
        }}
      >
        <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" fontWeight={700} color="#F0F6FC">
          ข้อมูลถูกล้างอย่างถาวรแล้ว (Zero-Trust Security)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          ข้อมูลรหัสผ่านสำหรับคำสั่งซื้อนี้ถูกลบออกจากฐานข้อมูลหน่วยความจำเรียบร้อยแล้วหลังจากคำสั่งซื้อเสร็จสิ้น เพื่อความปลอดภัยสูงสุดของคุณ
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: '#161B22',
        border: '1px solid #1F6FEB',
        boxShadow: '0 4px 20px rgba(31, 111, 235, 0.15)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <SecurityIcon sx={{ color: '#58A6FF', fontSize: 28 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ห้องนิรภัยข้อมูลบัญชี Konami ID (เข้ารหัส AES-256)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ส่งมอบข้อมูลปลอดภัยด้วยระบบ Zero-Trust และการเข้ารหัส AES-256-GCM
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!credentials ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            ผู้ขายได้อัปโหลดข้อมูลบัญชีอย่างปลอดภัยเรียบร้อยแล้ว คลิกปุ่มด้านล่างเพื่อถอดรหัสและดูข้อมูลเข้าสู่ระบบ
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />}
            onClick={handleDecrypt}
            disabled={loading}
            sx={{ fontWeight: 700, px: 4, py: 1.2 }}
          >
            {loading ? 'กำลังถอดรหัส...' : 'คลิกเพื่อถอดรหัสและดูข้อมูลบัญชี'}
          </Button>
        </Box>
      ) : (
        <Box>
          <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(210, 153, 34, 0.1)', color: '#D29922' }}>
            <strong>ข้อควรระวังเพื่อความปลอดภัย:</strong> เข้าสู่ระบบเกม eFootball ทันทีเพื่อตรวจสอบทีมนักเตะ และเปลี่ยนรหัสผ่าน Konami ID รวมถึงยกเลิกการเชื่อมต่อบัญชีบุคคลที่สามออกทันที
          </Alert>

          <Stack spacing={2.5}>
            {/* Konami Email / ID */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: '#0D1117',
                border: '1px solid #30363D',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ minWidth: 0, mr: 2 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  Konami ID / อีเมลล็อกอิน
                </Typography>
                <Typography variant="body1" fontWeight={700} color="#58A6FF" sx={{ wordBreak: 'break-all' }}>
                  {credentials.konami_email || credentials.login_id || '—'}
                </Typography>
              </Box>
              <Tooltip title={copiedField === 'email' ? 'คัดลอกแล้ว!' : 'คัดลอกอีเมล'}>
                <IconButton
                  size="small"
                  color={copiedField === 'email' ? 'success' : 'inherit'}
                  onClick={() => handleCopy(credentials.konami_email || credentials.login_id, 'email')}
                >
                  {copiedField === 'email' ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            {/* Konami Password */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: '#0D1117',
                border: '1px solid #30363D',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ minWidth: 0, mr: 2 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  รหัสผ่าน (Password)
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  color="#F0F6FC"
                  sx={{
                    fontFamily: showPassword ? 'inherit' : 'monospace',
                    letterSpacing: showPassword ? 'normal' : '0.15em',
                  }}
                >
                  {showPassword ? credentials.konami_password || credentials.password : '••••••••••••'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
                <Tooltip title={copiedField === 'password' ? 'คัดลอกแล้ว!' : 'คัดลอกรหัสผ่าน'}>
                  <IconButton
                    size="small"
                    color={copiedField === 'password' ? 'success' : 'inherit'}
                    onClick={() => handleCopy(credentials.konami_password || credentials.password, 'password')}
                  >
                    {copiedField === 'password' ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Security Notes / Instructions if provided */}
            {(credentials.notes || credentials.transfer_instructions) && (
              <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#0D1117', border: '1px solid #30363D' }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  คำแนะนำในการโอนย้ายไอดีจากผู้ขาย
                </Typography>
                <Typography variant="body2" color="#C9D1D9" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                  {credentials.notes || credentials.transfer_instructions}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
