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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs();
      const items = res.data?.data?.logs || res.data?.data || [];
      setLogs(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดประวัติการทำงานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const getActionColor = (action) => {
    if (action?.includes('APPROVE') || action?.includes('RELEASE')) return '#3FB950';
    if (action?.includes('REJECT') || action?.includes('CANCEL') || action?.includes('BAN')) return '#F85149';
    if (action?.includes('DISPUTE')) return '#D29922';
    return '#58A6FF';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon sx={{ fontSize: 32, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ประวัติบันทึกการทำงานของระบบและความปลอดภัย (Audit Logs)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              บันทึกการกระทำของผู้ดูแลระบบ การปรับค่าธรรมเนียม และการเปลี่ยนแปลงสถานะคำสั่งซื้อที่ไม่สามารถแก้ไขได้
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchLogs} sx={{ borderColor: '#30363D' }}>
          รีเฟรชประวัติ
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดประวัติการทำงาน...
          </Typography>
        </Box>
      ) : logs.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ยังไม่มีบันทึกประวัติการทำงาน
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสบันทึก</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>การกระทำ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ผู้ดำเนินการ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ประเภทเป้าหมาย</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสเป้าหมาย</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ไอพีแอดเดรส</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>วันที่และเวลา</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>รายละเอียด</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#58A6FF', fontWeight: 700 }}>
                    #{l.id}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={l.action}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        color: getActionColor(l.action),
                        border: `1px solid ${getActionColor(l.action)}`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC' }}>
                    User #{l.actor_id || l.user_id || 'ระบบ'}
                  </TableCell>
                  <TableCell sx={{ color: '#C9D1D9' }}>
                    {l.target_type || '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                    #{l.target_id || '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {l.ip_address || '127.0.0.1'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {formatThaiDateTime(l.created_at)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenDetail(l)}
                      sx={{ borderColor: '#30363D', color: '#58A6FF' }}
                    >
                      ตรวจสอบ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Payload Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#161B22', color: '#F0F6FC' }}>
          รายละเอียดบันทึกการทำงาน #{selectedLog?.id} — {selectedLog?.action}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0D1117', p: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            ข้อมูลโครงสร้างก่อนและหลังการเปลี่ยนแปลง (Raw Payload)
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: '#161B22',
              color: '#3FB950',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              overflowX: 'auto',
              border: '1px solid #30363D',
            }}
          >
            {JSON.stringify(selectedLog, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#161B22' }}>
          <Button onClick={() => setDetailModalOpen(false)} color="inherit">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
