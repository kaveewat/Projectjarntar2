import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

const REASON_LABELS = {
  WRONG_ACCOUNT: 'บัญชีไม่ตรงกับที่ระบุในประกาศ (นักเตะหรือค่าพลังไม่ตรง)',
  LOGIN_FAILED: 'ข้อมูลบัญชีไม่ถูกต้อง (ไม่สามารถเข้าสู่ระบบ Konami ID ได้)',
  ACCOUNT_RECOVERED: 'บัญชีถูกดึงคืนหลังการรับมอบ (ผู้ขายกู้คืนบัญชี)',
  OTHER: 'ปัญหาอื่นๆ (ระบุในรายละเอียดเพิ่มเติม)',
};

const getReasonLabel = (d) => {
  if (d.reason_title && !d.reason_title.includes('?')) {
    return d.reason_title;
  }
  const code = d.reason_code || d.code || d.reason;
  if (code && REASON_LABELS[code]) {
    return REASON_LABELS[code];
  }
  return d.reason_title || d.reason || 'ข้อมูลไอดีไม่ตรงกับที่ตกลงไว้';
};

export default function DisputeManagementPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await adminApi.getDisputes(params);
      const items = res.data?.data?.disputes || res.data?.data || [];
      setDisputes(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลข้อพิพาทได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <Chip
            label="เคสใหม่ (NEW)"
            size="small"
            sx={{ bgcolor: 'rgba(248, 81, 73, 0.2)', color: '#F85149', fontWeight: 800 }}
          />
        );
      case 'UNDER_REVIEW':
        return (
          <Chip
            label="กำลังตรวจสอบ (UNDER REVIEW)"
            size="small"
            sx={{ bgcolor: 'rgba(210, 153, 34, 0.2)', color: '#D29922', fontWeight: 800 }}
          />
        );
      case 'RESOLVED_BUYER':
        return (
          <Chip
            label="ผู้ซื้อชนะ (คืนเงิน)"
            size="small"
            sx={{ bgcolor: 'rgba(56, 139, 253, 0.2)', color: '#58A6FF', fontWeight: 700 }}
          />
        );
      case 'RESOLVED_SELLER':
        return (
          <Chip
            label="ผู้ขายชนะ (ปล่อยเงิน)"
            size="small"
            sx={{ bgcolor: 'rgba(63, 185, 80, 0.2)', color: '#3FB950', fontWeight: 700 }}
          />
        );
      case 'DISMISSED':
        return <Chip label="ยกเลิกแล้ว" size="small" sx={{ bgcolor: '#21262D', color: '#8B949E' }} />;
      default:
        return <Chip label={status || 'PENDING'} size="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <GavelIcon sx={{ fontSize: 32, color: '#F85149' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ศูนย์จัดการและระงับข้อพิพาท
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ตรวจสอบข้อพิพาท Escrow พิจารณาหลักฐานจากผู้ซื้อและผู้ขาย และดำเนินการตัดสินชี้ขาด
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchDisputes} sx={{ borderColor: '#30363D' }}>
          รีเฟรชเคส
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, val) => setStatusFilter(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': { color: 'text.secondary', fontWeight: 600 },
            '& .Mui-selected': { color: '#F85149' },
            '& .MuiTabs-indicator': { backgroundColor: '#F85149' },
          }}
        >
          <Tab value="ALL" label="ทั้งหมด" />
          <Tab value="OPEN" label="รอดำเนินการ (ด่วน)" />
          <Tab value="UNDER_REVIEW" label="อยู่ระหว่างตรวจสอบ" />
          <Tab value="RESOLVED_BUYER" label="ผู้ซื้อชนะ" />
          <Tab value="RESOLVED_SELLER" label="ผู้ขายชนะ" />
        </Tabs>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดข้อมูลข้อพิพาท...
          </Typography>
        </Box>
      ) : disputes.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ไม่พบเคสข้อพิพาท
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ไม่มีรายการเคสในตัวกรอง "{statusFilter}"
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสข้อพิพาท</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสคำสั่งซื้อ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>เหตุผล</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ยอดเงินพิพาท</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>สถานะ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>สถานะ SLA</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>วันที่ยื่นเรื่อง</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>ดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#F85149', fontWeight: 800 }}>
                    #DSP-{d.id}
                  </TableCell>
                  <TableCell sx={{ color: '#58A6FF', fontWeight: 600 }}>
                    #{d.order_number || d.order_id}
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC' }}>
                    {getReasonLabel(d)}
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC', fontWeight: 800 }}>
                    ฿{Number(d.order_amount || d.amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusChip(d.status)}</TableCell>
                  <TableCell>
                    {d.status === 'OPEN' ? (
                      <Chip
                        icon={<WarningAmberIcon sx={{ fontSize: '14px !important' }} />}
                        label="SLA: เหลือเวลา < 24 ชม."
                        size="small"
                        sx={{ bgcolor: 'rgba(210, 153, 34, 0.15)', color: '#D29922', fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        ตามเกณฑ์ SLA
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {formatThaiDateTime(d.created_at)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      component={Link}
                      to={`/admin/disputes/${d.id}`}
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      sx={{ fontWeight: 700 }}
                    >
                      พิจารณาตัดสิน
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
