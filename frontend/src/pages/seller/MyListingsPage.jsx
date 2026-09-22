import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';

import listingsApi from '../../services/listings.api';
import ValueBadge from '../../components/common/ValueBadge';
import StatusChip from '../../components/common/StatusChip';

import { formatThaiDateTime } from '../../utils/date';

export default function MyListingsPage() {
  const [currentTab, setCurrentTab] = useState('ALL');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchMyListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listingsApi.getMyListings();
      if (res?.success && Array.isArray(res.data)) {
        setListings(res.data);
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error('Failed to load seller listings:', err);
      setError('ไม่สามารถดึงข้อมูลรายการไอดีของคุณได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  // Filter listings by active tab
  const filteredListings = listings.filter((item) => {
    if (currentTab === 'ALL') return true;
    return item.status === currentTab;
  });

  const handleCancelClick = (listing) => {
    setSelectedListing(listing);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedListing) return;
    setCancelling(true);
    try {
      const res = await listingsApi.cancelListing(selectedListing.id);
      if (res?.success) {
        setCancelDialogOpen(false);
        fetchMyListings(); // Refresh list
      }
    } catch (err) {
      console.error('Cancel listing error:', err);
      alert(err.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการยกเลิกประกาศ');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #F0F6FC 0%, #8B949E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            รายการไอดีที่ลงขาย
          </Typography>
          <Typography variant="body1" color="text.secondary">
            จัดการรายการไอดี eFootball ของคุณ ตรวจสอบสถานะการขาย และดูผลการประเมินราคา
          </Typography>
        </Box>

        <Button
          component={Link}
          to="/seller/listings/new"
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ fontWeight: 700 }}
        >
          ลงขายไอดีใหม่ (สแกน AI)
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #30363D', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label={`ทั้งหมด (${listings.length})`} value="ALL" sx={{ fontWeight: 700 }} />
          <Tab
            label={`กำลังวางขาย (${listings.filter((l) => l.status === 'ACTIVE').length})`}
            value="ACTIVE"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            label={`จองแล้ว (${listings.filter((l) => l.status === 'RESERVED').length})`}
            value="RESERVED"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            label={`ขายแล้ว (${listings.filter((l) => l.status === 'SOLD').length})`}
            value="SOLD"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            label={`ยกเลิกแล้ว (${listings.filter((l) => l.status === 'CANCELLED').length})`}
            value="CANCELLED"
            sx={{ fontWeight: 700 }}
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', p: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={48} sx={{ my: 1 }} />
          ))}
        </Card>
      ) : filteredListings.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px dashed #30363D', p: 5, textAlign: 'center' }}>
          <StorefrontIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
            ไม่พบรายการไอดีในหมวดหมู่นี้
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            คุณยังไม่มีรายการไอดีที่ลงขายในสถานะนี้
          </Typography>
          <Button
            component={Link}
            to="/seller/listings/new"
            variant="outlined"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
          >
            ลงขายไอดีรายการแรกของคุณ
          </Button>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: '#161B22',
            border: '1px solid #30363D',
            borderRadius: 2,
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700 }}>ชื่อรายการไอดี</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700 }}>แพลตฟอร์ม</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700 }}>Team Strength</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700 }}>ความคุ้มค่า</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700 }}>ราคาตั้งขาย</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700 }}>สถานะ</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700 }}>วันที่ลงขาย</TableCell>
                <TableCell align="center" sx={{ color: '#8B949E', fontWeight: 700 }}>
                  การจัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredListings.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                    borderBottom: '1px solid #21262D',
                  }}
                >
                  {/* Title */}
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC">
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: #{item.id} • เข้าชม: {item.view_count || 0} ครั้ง
                    </Typography>
                  </TableCell>

                  {/* Platform */}
                  <TableCell>
                    <Chip
                      label={item.platform_name || 'ทั้งหมด'}
                      size="small"
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>

                  {/* Team Strength */}
                  <TableCell sx={{ fontWeight: 700, color: 'primary.light' }}>
                    {item.team_strength ? item.team_strength.toLocaleString() : '—'}
                  </TableCell>

                  {/* Value Badge */}
                  <TableCell>
                    <ValueBadge badge={item.value_badge} size="small" />
                  </TableCell>

                  {/* Asking Price */}
                  <TableCell sx={{ fontWeight: 800, color: '#58A6FF', fontSize: '0.95rem' }}>
                    ฿{Number(item.asking_price).toLocaleString()}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusChip status={item.status} size="small" />
                  </TableCell>

                  {/* Created At */}
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {formatThaiDateTime(item.created_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="ดูในตลาดซื้อขาย" arrow>
                        <IconButton
                          component={Link}
                          to={`/marketplace/${item.id}`}
                          size="small"
                          color="primary"
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>

                      {item.status === 'ACTIVE' && (
                        <Tooltip title="ยกเลิกประกาศขาย" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelClick(item)}
                          >
                            <CancelOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#161B22',
            border: '1px solid #30363D',
            borderRadius: 2,
            maxWidth: 420,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#F0F6FC' }}>
          ยืนยันการยกเลิกประกาศขายไอดี?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            คุณแน่ใจหรือไม่ว่าต้องการยกเลิกประกาศขาย <strong>"{selectedListing?.title}"</strong>? รายการนี้จะถูกนำออกจากตลาดซื้อขายทันที
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCancelDialogOpen(false)} color="inherit">
            คงไว้ตามเดิม
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelling}
            sx={{ fontWeight: 700 }}
          >
            {cancelling ? 'กำลังยกเลิก...' : 'ยืนยันการยกเลิก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
