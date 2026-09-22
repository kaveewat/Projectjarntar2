import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await adminApi.getOrders(params);
      const items = res.data?.data?.orders || res.data?.data || [];
      setOrders(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดรายการคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PAYMENT_SUBMITTED':
        return (
          <Chip
            label="รอตรวจสลิป (PENDING SLIP)"
            size="small"
            sx={{ bgcolor: 'rgba(210, 153, 34, 0.2)', color: '#D29922', fontWeight: 700 }}
          />
        );
      case 'PAYMENT_APPROVED':
      case 'HANDOVER_OPEN':
        return (
          <Chip
            label="อยู่ใน Escrow (ESCROW ACTIVE)"
            size="small"
            sx={{ bgcolor: 'rgba(56, 139, 253, 0.2)', color: '#58A6FF', fontWeight: 700 }}
          />
        );
      case 'COMPLETED':
        return (
          <Chip
            label="เสร็จสมบูรณ์ (COMPLETED)"
            size="small"
            sx={{ bgcolor: 'rgba(63, 185, 80, 0.2)', color: '#3FB950', fontWeight: 700 }}
          />
        );
      case 'DISPUTED':
        return (
          <Chip
            label="มีข้อพิพาท (DISPUTED)"
            size="small"
            sx={{ bgcolor: 'rgba(248, 81, 73, 0.2)', color: '#F85149', fontWeight: 700 }}
          />
        );
      case 'CANCELLED':
        return <Chip label="ยกเลิกแล้ว (CANCELLED)" size="small" sx={{ bgcolor: '#21262D', color: '#8B949E' }} />;
      default:
        return <Chip label={status || 'PENDING'} size="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCartIcon sx={{ fontSize: 32, color: '#F85149' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              การจัดการคำสั่งซื้อและตรวจสลิปชำระเงิน
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ตรวจสอบภาพสลิปโอนเงิน ยืนยันยอดเงินเข้า และอนุมัติการส่งมอบไอดีผ่านระบบ Escrow
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchOrders} sx={{ borderColor: '#30363D' }}>
          รีเฟรชรายการ
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
            '& .Mui-selected': { color: '#58A6FF' },
            '& .MuiTabs-indicator': { backgroundColor: '#58A6FF' },
          }}
        >
          <Tab value="ALL" label="ทั้งหมด" />
          <Tab value="PAYMENT_SUBMITTED" label="รอตรวจสลิปโอน" />
          <Tab value="PAYMENT_APPROVED" label="อนุมัติการชำระแล้ว" />
          <Tab value="COMPLETED" label="เสร็จสิ้น" />
          <Tab value="DISPUTED" label="มีข้อพิพาท" />
          <Tab value="CANCELLED" label="ยกเลิกแล้ว" />
        </Tabs>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดรายการคำสั่งซื้อ...
          </Typography>
        </Box>
      ) : orders.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ไม่พบคำสั่งซื้อ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ไม่มีรายการคำสั่งซื้อในตัวกรอง "{statusFilter}"
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสคำสั่งซื้อ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>บัญชีทีมที่ลงขาย</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ยอดเงิน (฿)</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ผู้ซื้อ / ผู้ขาย</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>สถานะ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>วันที่</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>ดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#F0F6FC', fontWeight: 700 }}>
                    #{order.order_number || order.id}
                  </TableCell>
                  <TableCell sx={{ color: '#C9D1D9' }}>
                    {order.listing_title || `Listing #${order.listing_id}`}
                  </TableCell>
                  <TableCell sx={{ color: '#58A6FF', fontWeight: 800 }}>
                    ฿{Number(order.amount || order.total_amount).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    ผู้ซื้อ: #{order.buyer_id} • ผู้ขาย: #{order.seller_id}
                  </TableCell>
                  <TableCell>{getStatusChip(order.status)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {formatThaiDateTime(order.created_at)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      component={Link}
                      to={`/admin/orders/${order.id}`}
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      sx={{ borderColor: '#30363D', color: '#58A6FF', '&:hover': { borderColor: '#58A6FF' } }}
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
    </Container>
  );
}
