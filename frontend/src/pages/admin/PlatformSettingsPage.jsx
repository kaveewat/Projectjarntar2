import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  // Form values map: { key: value }
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPlatformSettings();
      const list = res.data?.data?.settings || res.data?.data || [];
      setSettings(Array.isArray(list) ? list : []);

      const valMap = {};
      list.forEach((s) => {
        valMap[s.setting_key] = s.setting_value;
      });
      setFormValues(valMap);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดการตั้งค่าระบบได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSetting = async (key) => {
    setSavingKey(key);
    setSaveSuccess(null);
    try {
      const val = formValues[key];
      await adminApi.updatePlatformSetting(key, val);
      setSaveSuccess(`บันทึกการตั้งค่า '${key}' เป็น '${val}' เรียบร้อยแล้ว`);
      fetchSettings();
    } catch (err) {
      alert(err.response?.data?.error?.message || `ไม่สามารถอัปเดต ${key} ได้`);
    } finally {
      setSavingKey(null);
    }
  };

  const formatKeyTitle = (key) => {
    return key
      .replace(/_/g, ' ')
      .toUpperCase();
  };

  const SETTING_DESCRIPTIONS = {
    platform_fee_rate: 'อัตราค่าธรรมเนียมคนกลาง Platform (5%)',
    payment_deadline_hours: 'ระยะเวลาที่ผู้ซื้อต้องชำระเงินก่อนคำสั่งซื้อหมดอายุ (ชั่วโมง)',
    handover_timeout_hours: 'ระยะเวลาสูงสุดที่ผู้ขายต้องส่งมอบรหัสก่อนระบบยกเลิกและคืนเงิน (ชั่วโมง)',
    buyer_confirm_deadline_hours: 'ระยะเวลาที่ผู้ซื้อต้องเข้าตรวจสอบบัญชีก่อนเริ่มแจ้งเตือน (ชั่วโมง)',
    auto_release_hours: 'ระยะเวลาที่ระบบจะปล่อยเงินอัตโนมัติหากผู้ซื้อไม่ดำเนินการใดๆ (ชั่วโมง)',
    dispute_sla_hours: 'ระยะเวลา SLA ในการตัดสินข้อพิพาทของทีมงาน (ชั่วโมง)',
    badge_great_value_threshold: 'เกณฑ์ป้ายคุ้มค่ามาก: ราคาขาย <= 85% ของ Fair Price',
    badge_overpriced_threshold: 'เกณฑ์ป้ายแพงเกิน: ราคาขาย > 115% ของ Fair Price',
  };

  const getSettingDescription = (s) => {
    if (s.description && !s.description.includes('?')) {
      return s.description;
    }
    return SETTING_DESCRIPTIONS[s.setting_key] || s.description || 'พารามิเตอร์กำหนดค่าการทำงานของระบบ';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SettingsIcon sx={{ fontSize: 32, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ตั้งค่าระบบและกำหนดเวลา SLA
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ปรับอัตราค่าธรรมเนียม Escrow, กรอบเวลาหมดอายุการส่งมอบ และเกณฑ์คำนวณป้ายความคุ้มค่า AI
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshIcon />}
          onClick={fetchSettings}
          sx={{ borderColor: '#30363D' }}
        >
          โหลดการตั้งค่าใหม่
        </Button>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {saveSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดการตั้งค่าระบบ...
          </Typography>
        </Box>
      ) : settings.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ไม่พบการตั้งค่าในฐานข้อมูล
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {settings.map((s) => {
            const isSaving = savingKey === s.setting_key;
            return (
              <Grid item xs={12} md={6} key={s.id || s.setting_key}>
                <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, height: '100%' }}>
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#58A6FF">
                          {formatKeyTitle(s.setting_key)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Key: {s.setting_key}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {getSettingDescription(s)}
                      </Typography>

                      <TextField
                        fullWidth
                        size="small"
                        label="ค่ากำหนด"
                        value={formValues[s.setting_key] ?? ''}
                        onChange={(e) => handleChange(s.setting_key, e.target.value)}
                        helperText={`ค่าปัจจุบันในระบบ: ${s.setting_value}`}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        อัปเดตล่าสุด: {s.updated_at ? formatThaiDateTime(s.updated_at) : 'ค่าเริ่มต้นของระบบ'}
                      </Typography>

                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSaveSetting(s.setting_key)}
                        disabled={isSaving || formValues[s.setting_key] === s.setting_value}
                        sx={{ fontWeight: 700 }}
                      >
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกค่า'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
