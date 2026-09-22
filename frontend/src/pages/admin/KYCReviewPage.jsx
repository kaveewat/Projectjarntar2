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
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function KYCReviewPage() {
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchKycList();
  }, [statusFilter]);

  const fetchKycList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await adminApi.getKycList(params);
      const items = res.data?.data?.kycList || res.data?.data || [];
      setKycList(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดรายการคำขอยืนยันตัวตนได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <Chip
            label="รอดำเนินการ (PENDING)"
            size="small"
            sx={{ bgcolor: 'rgba(210, 153, 34, 0.2)', color: '#D29922', fontWeight: 800 }}
          />
        );
      case 'APPROVED':
        return (
          <Chip
            label="ผู้ขายยืนยันแล้ว (VERIFIED)"
            size="small"
            sx={{ bgcolor: 'rgba(63, 185, 80, 0.2)', color: '#3FB950', fontWeight: 800 }}
          />
        );
      case 'REJECTED':
        return (
          <Chip
            label="ปฏิเสธ (REJECTED)"
            size="small"
            sx={{ bgcolor: 'rgba(248, 81, 73, 0.2)', color: '#F85149', fontWeight: 800 }}
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VerifiedUserIcon sx={{ fontSize: 32, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              รายการตรวจสอบยืนยันตัวตนผู้ขาย (KYC)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ตรวจสอบเอกสารประจำตัวของผู้ขายเพื่ออนุมัติตราสัญลักษณ์ผู้ขายยืนยันตัวตนและปลดล็อกวงเงินการลงขาย
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchKycList} sx={{ borderColor: '#30363D' }}>
          รีเฟรชรายการ
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter Tabs */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, val) => setStatusFilter(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': { color: 'text.secondary', fontWeight: 600 },
            '& .Mui-selected': { color: '#58A6FF' },
            '& .MuiTabs-indicator': { backgroundColor: '#58A6FF' },
          }}
        >
          <Tab value="ALL" label="คำขอทั้งหมด" />
          <Tab value="PENDING" label="รอดำเนินการ" />
          <Tab value="APPROVED" label="อนุมัติแล้ว" />
          <Tab value="REJECTED" label="ปฏิเสธแล้ว" />
        </Tabs>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดรายการคำขอยืนยันตัวตน...
          </Typography>
        </Box>
      ) : kycList.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ไม่พบข้อมูลการยื่น KYC
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ไม่มีรายการคำขอในตัวกรอง "{statusFilter}"
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัส KYC</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ชื่อ-นามสกุลจริง</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>บัญชีผู้ใช้งาน</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>เลขบัตรประชาชน</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>สถานะ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>วันที่ยื่นเรื่อง</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>ดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kycList.map((k) => (
                <TableRow key={k.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#58A6FF', fontWeight: 700 }}>
                    #KYC-{k.id}
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC', fontWeight: 600 }}>
                    {k.real_name}
                  </TableCell>
                  <TableCell sx={{ color: '#C9D1D9' }}>
                    {k.display_name || k.email} (ID: #{k.user_id})
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', letterSpacing: 1 }}>
                    {k.id_card_number}
                  </TableCell>
                  <TableCell>{getStatusChip(k.status)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {formatThaiDateTime(k.submitted_at)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      component={Link}
                      to={`/admin/kyc/${k.id}`}
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      sx={{ fontWeight: 700 }}
                    >
                      ตรวจสอบเอกสาร
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
