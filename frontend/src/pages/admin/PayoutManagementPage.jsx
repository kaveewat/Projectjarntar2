import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function PayoutManagementPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Complete payout dialog
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bankRef, setBankRef] = useState('');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await adminApi.getPayouts(params);
      const items = res.data?.data?.payouts || res.data?.data || [];
      setPayouts(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดรายการโอนเงินได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteDialog = (payout) => {
    setSelectedPayout(payout);
    setBankRef('');
    setNote('');
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedPayout) return;
    setActionLoading(true);
    try {
      await adminApi.updatePayoutStatus(selectedPayout.id, {
        status,
        bank_reference: bankRef.trim() || 'PromptPay-Ref',
        note: note.trim() || `โอนเงินจำนวน ฿${selectedPayout.amount} เรียบร้อยแล้ว`,
      });
      setDialogOpen(false);
      fetchPayouts();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'ไม่สามารถอัปเดตสถานะการโอนเงินได้');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <Chip
            label="รอโอนเงิน (PENDING)"
            size="small"
            sx={{ bgcolor: 'rgba(210, 153, 34, 0.2)', color: '#D29922', fontWeight: 800 }}
          />
        );
      case 'PROCESSING':
        return (
          <Chip
            label="กำลังดำเนินการ (PROCESSING)"
            size="small"
            sx={{ bgcolor: 'rgba(56, 139, 253, 0.2)', color: '#58A6FF', fontWeight: 800 }}
          />
        );
      case 'COMPLETED':
        return (
          <Chip
            label="โอนสำเร็จแล้ว (PAID)"
            size="small"
            sx={{ bgcolor: 'rgba(63, 185, 80, 0.2)', color: '#3FB950', fontWeight: 800 }}
          />
        );
      case 'FAILED':
        return (
          <Chip
            label="ล้มเหลว (FAILED)"
            size="small"
            sx={{ bgcolor: 'rgba(248, 81, 73, 0.2)', color: '#F85149', fontWeight: 800 }}
          />
        );
      default:
        return <Chip label={status || 'PENDING'} size="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PaymentsIcon sx={{ fontSize: 32, color: '#3FB950' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              การจัดการการโอนเงินรายได้ให้ผู้ขาย (Payouts)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ตรวจสอบยอดเงินที่ปลดล็อกจากการส่งมอบไอดีสำเร็จ และบันทึกหลักฐานการโอนเงินให้ผู้ขาย
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchPayouts} sx={{ borderColor: '#30363D' }}>
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
            '& .Mui-selected': { color: '#3FB950' },
            '& .MuiTabs-indicator': { backgroundColor: '#3FB950' },
          }}
        >
          <Tab value="ALL" label="ทั้งหมด" />
          <Tab value="PENDING" label="รอโอนเงิน" />
          <Tab value="PROCESSING" label="กำลังดำเนินการ" />
          <Tab value="COMPLETED" label="โอนสำเร็จแล้ว" />
          <Tab value="FAILED" label="ล้มเหลว" />
        </Tabs>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดประวัติการโอนเงิน...
          </Typography>
        </Box>
      ) : payouts.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ไม่พบรายการโอนเงิน
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ไม่มีรายการในตัวกรอง "{statusFilter}"
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสการโอน</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ผู้ขาย</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ยอดเงิน (฿)</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ธนาคาร / บัญชี</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>สถานะ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>เลขอ้างอิงธนาคาร</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>วันที่</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>ดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#58A6FF', fontWeight: 700 }}>
                    #SP-{p.id}
                  </TableCell>
                  <TableCell sx={{ color: '#C9D1D9' }}>
                    ผู้ขาย #{p.seller_id}
                  </TableCell>
                  <TableCell sx={{ color: '#3FB950', fontWeight: 800 }}>
                    ฿{Number(p.amount).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC' }}>
                    {p.bank_name ? `${p.bank_name} (${p.bank_account_number})` : 'PromptPay'}
                  </TableCell>
                  <TableCell>{getStatusChip(p.status)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                    {p.bank_reference || '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {formatThaiDateTime(p.created_at)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {p.status === 'PENDING' || p.status === 'PROCESSING' ? (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleOpenCompleteDialog(p)}
                        sx={{ fontWeight: 700 }}
                      >
                        บันทึกว่าโอนแล้ว
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        เรียบร้อย
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Mark Paid Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC', fontWeight: 800 }}>
          บันทึกหลักฐานการโอนเงินธนาคาร — รหัสโอน #SP-{selectedPayout?.id}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#161B22' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ยืนยันว่าได้โอนเงินจำนวน <strong>฿{Number(selectedPayout?.amount).toLocaleString()}</strong> ให้ผู้ขาย #{selectedPayout?.seller_id} เรียบร้อยแล้ว:
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="เลขอ้างอิงธุรกรรมธนาคาร / TxID"
              placeholder="เช่น KBANK-TRX-9821721"
              value={bankRef}
              onChange={(e) => setBankRef(e.target.value)}
              fullWidth
            />
            <TextField
              label="บันทึกเพิ่มเติม"
              placeholder="เช่น โอนเงินผ่านพอร์ทัล PromptPay ธนาคารกสิกรไทย"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleUpdateStatus('COMPLETED')}
            disabled={actionLoading}
          >
            {actionLoading ? 'กำลังบันทึก...' : 'ยืนยันการโอนเงินสำเร็จ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
