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
  Chip,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import BlockIcon from '@mui/icons-material/Block';
import adminApi from '../../services/admin.api';
import { formatThaiDateTime } from '../../utils/date';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminApi.getUsers(params);
      const items = res.data?.data?.users || res.data?.data || [];
      setUsers(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดรายชื่อผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const getRoleChip = (role, isVerified) => {
    if (role === 'ADMIN') {
      return <Chip label="ผู้ดูแล (ADMIN)" size="small" color="error" sx={{ fontWeight: 800 }} />;
    }
    if (role === 'VERIFIED_SELLER' || isVerified) {
      return (
        <Chip
          icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />}
          label="ผู้ขายยืนยันตัวตน"
          size="small"
          sx={{ bgcolor: 'rgba(63, 185, 80, 0.2)', color: '#3FB950', fontWeight: 700 }}
        />
      );
    }
    if (role === 'SELLER') {
      return <Chip label="ผู้ขาย (SELLER)" size="small" sx={{ bgcolor: '#21262D', color: '#58A6FF', fontWeight: 700 }} />;
    }
    return <Chip label="ผู้ซื้อ (BUYER)" size="small" sx={{ bgcolor: '#21262D', color: '#8B949E' }} />;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PeopleIcon sx={{ fontSize: 32, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              จัดการผู้ใช้งานและการกำกับดูแลบัญชี
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ตรวจสอบบัญชีผู้ใช้งาน กำหนดสิทธิ์ จัดการตราสัญลักษณ์ยืนยันตัวตน และระงับบัญชีที่มีความเสี่ยง
            </Typography>
          </Box>
        </Box>

        <Button variant="outlined" color="inherit" onClick={fetchUsers} sx={{ borderColor: '#30363D' }}>
          รีเฟรชรายชื่อ
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Tabs
            value={roleFilter}
            onChange={(e, val) => setRoleFilter(val)}
            sx={{
              '& .MuiTab-root': { color: 'text.secondary', fontWeight: 600 },
              '& .Mui-selected': { color: '#58A6FF' },
              '& .MuiTabs-indicator': { backgroundColor: '#58A6FF' },
            }}
          >
            <Tab value="ALL" label="ทุกบทบาท" />
            <Tab value="BUYER" label="ผู้ซื้อ" />
            <Tab value="SELLER" label="ผู้ขาย" />
            <Tab value="VERIFIED_SELLER" label="ผู้ขายยืนยันแล้ว" />
            <Tab value="ADMIN" label="ผู้ดูแลระบบ" />
          </Tabs>

          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="ค้นหาด้วยชื่อ หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 260 }}
            />
            <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>
              ค้นหา
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดรายชื่อผู้ใช้งาน...
          </Typography>
        </Box>
      ) : users.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            ไม่พบผู้ใช้งาน
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ไม่มีบัญชีที่ตรงกับคำค้นหาหรือตัวกรองบทบาท
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>รหัสผู้ใช้</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ชื่อที่แสดง</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>อีเมล</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>บทบาท / ยืนยันตัวตน</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>สถานะ</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>วันที่สมัคร</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>ดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#21262D' } }}>
                  <TableCell sx={{ color: '#58A6FF', fontWeight: 700 }}>
                    #{u.id}
                  </TableCell>
                  <TableCell sx={{ color: '#F0F6FC', fontWeight: 600 }}>
                    {u.display_name || 'ไม่ระบุชื่อ'}
                  </TableCell>
                  <TableCell sx={{ color: '#C9D1D9' }}>
                    {u.email}
                  </TableCell>
                  <TableCell>{getRoleChip(u.role, u.is_verified)}</TableCell>
                  <TableCell>
                    {u.is_suspended || u.is_banned ? (
                      <Chip
                        icon={<BlockIcon sx={{ fontSize: '14px !important' }} />}
                        label="ถูกระงับ (SUSPENDED)"
                        size="small"
                        color="error"
                        sx={{ fontWeight: 800 }}
                      />
                    ) : (
                      <Chip label="ปกติ (ACTIVE)" size="small" sx={{ bgcolor: 'rgba(63, 185, 80, 0.15)', color: '#3FB950', fontWeight: 700 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {formatThaiDateTime(u.created_at)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      component={Link}
                      to={`/admin/users/${u.id}`}
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      sx={{ borderColor: '#30363D', color: '#58A6FF' }}
                    >
                      จัดการ
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
