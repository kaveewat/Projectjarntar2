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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  TablePagination,
  Snackbar,
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import adminApi from '../../services/admin.api';

export default function PlayerManagementPage() {
  // State
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total_cards: 0, active_cards: 0, max_ovr: 0, high_tier_cards: 0 });

  // Metadata
  const [tiers, setTiers] = useState([]);
  const [positions, setPositions] = useState([]);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Dialogs
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    player_name: '',
    card_tier_id: '',
    position_id: '',
    overall_rating: 90,
    base_value: 1000,
    nationality: '',
    club: '',
    season: '2024-2025',
    is_active: true,
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // CSV Import Dialog
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Notification Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load initial metadata
  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch players on filter/page change
  useEffect(() => {
    fetchPlayers();
  }, [page, rowsPerPage, tierFilter, positionFilter, statusFilter]);

  const fetchMetadata = async () => {
    try {
      const res = await adminApi.getPlayerMetadata();
      const meta = res.data?.data || {};
      setTiers(meta.tiers || []);
      setPositions(meta.positions || []);
    } catch (err) {
      console.error('Failed to load card metadata:', err);
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (searchTerm.trim()) params.name = searchTerm.trim();
      if (tierFilter !== 'all') params.tier = tierFilter;
      if (positionFilter !== 'all') params.position = positionFilter;
      if (statusFilter !== 'all') params.is_active = statusFilter;

      const res = await adminApi.getPlayers(params);
      const data = res.data?.data || [];
      setPlayers(data);
      setTotalCount(res.data?.pagination?.total || 0);
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการ์ดนักเตะได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchPlayers();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTierFilter('all');
    setPositionFilter('all');
    setStatusFilter('all');
    setPage(0);
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingPlayer(null);
    setFormData({
      player_name: '',
      card_tier_id: tiers[0]?.id || 1,
      position_id: positions[0]?.id || 1,
      overall_rating: 90,
      base_value: 1000,
      nationality: '',
      club: '',
      season: '2024-2025',
      is_active: true,
    });
    setFormError(null);
    setPlayerModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      player_name: player.player_name,
      card_tier_id: player.card_tier_id,
      position_id: player.position_id,
      overall_rating: player.overall_rating,
      base_value: player.base_value,
      nationality: player.nationality || '',
      club: player.club || '',
      season: player.season || '',
      is_active: Boolean(player.is_active),
    });
    setFormError(null);
    setPlayerModalOpen(true);
  };

  // Save Player (Create / Update)
  const handleSavePlayer = async (e) => {
    e.preventDefault();
    if (!formData.player_name.trim()) {
      setFormError('กรุณาระบุชื่อนักเตะ');
      return;
    }

    setFormSaving(true);
    setFormError(null);
    try {
      if (editingPlayer) {
        await adminApi.updatePlayer(editingPlayer.id, formData);
        setSnackbar({ open: true, message: 'อัปเดตข้อมูลการ์ดนักเตะเรียบร้อยแล้ว', severity: 'success' });
      } else {
        await adminApi.createPlayer(formData);
        setSnackbar({ open: true, message: 'เพิ่มการ์ดนักเตะใหม่สำเร็จ', severity: 'success' });
      }
      setPlayerModalOpen(false);
      fetchPlayers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setFormSaving(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (player) => {
    try {
      const newStatus = !player.is_active;
      await adminApi.togglePlayerStatus(player.id, newStatus);
      setSnackbar({
        open: true,
        message: `${newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} การ์ด ${player.player_name} สำเร็จ`,
        severity: 'info',
      });
      fetchPlayers();
    } catch (err) {
      setSnackbar({ open: true, message: 'ไม่สามารถเปลี่ยนสถานะการ์ดได้', severity: 'error' });
    }
  };

  // Bulk CSV Import
  const handleBulkImport = async () => {
    if (!csvText.trim()) return;

    setImporting(true);
    setImportResult(null);

    try {
      const lines = csvText.trim().split('\n');
      const parsedPlayers = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip CSV header line if present
        if (i === 0 && line.toLowerCase().includes('player_name')) continue;

        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 4) {
          // Format: player_name, card_tier_id, position_id, overall_rating, base_value, nationality, club, season
          parsedPlayers.push({
            player_name: parts[0],
            card_tier_id: Number(parts[1]) || 1,
            position_id: Number(parts[2]) || 1,
            overall_rating: Number(parts[3]) || 90,
            base_value: Number(parts[4]) || 0,
            nationality: parts[5] || null,
            club: parts[6] || null,
            season: parts[7] || '2024-2025',
          });
        }
      }

      if (parsedPlayers.length === 0) {
        setImportResult({ error: 'ไม่พบข้อมูลที่ถูกต้องตามรูปแบบ CSV กรุณาตรวจสอบหัวข้อหรือรูปแบบแถว' });
        return;
      }

      const res = await adminApi.bulkImportPlayers(parsedPlayers);
      setImportResult({
        success: true,
        message: `นำเข้าสำเร็จทั้งหมด ${res.data?.data?.insertedCount || parsedPlayers.length} รายการ`,
      });
      fetchPlayers();
    } catch (err) {
      setImportResult({ error: err.response?.data?.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
    } finally {
      setImporting(false);
    }
  };

  // Color helper for positions
  const getPositionGroupColor = (group) => {
    switch (group) {
      case 'FWD':
        return { bg: 'rgba(248, 81, 73, 0.15)', text: '#F85149' };
      case 'MID':
        return { bg: 'rgba(63, 185, 80, 0.15)', text: '#3FB950' };
      case 'DEF':
        return { bg: 'rgba(88, 166, 255, 0.15)', text: '#58A6FF' };
      case 'GK':
        return { bg: 'rgba(210, 153, 34, 0.15)', text: '#D29922' };
      default:
        return { bg: '#21262D', text: '#8B949E' };
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SportsSoccerIcon sx={{ fontSize: 36, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ฐานข้อมูลการ์ดนักเตะ (Player Card Catalog Master)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              จัดการรายการการ์ดนักเตะ eFootball ระบบประเมินมูลค่าพื้นฐาน และระดับความหายาก (Epic, Big Time, Show Time)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => {
              setImportResult(null);
              setCsvText('');
              setImportModalOpen(true);
            }}
            sx={{ borderColor: '#30363D', color: '#C9D1D9' }}
          >
            นำเข้า CSV
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2EA043' }, fontWeight: 700 }}
          >
            เพิ่มการ์ดนักเตะใหม่
          </Button>
        </Box>
      </Box>

      {/* ── KPI Summary Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  การ์ดทั้งหมดในระบบ
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#F0F6FC" sx={{ mt: 0.5 }}>
                  {Number(stats.total_cards).toLocaleString()}
                </Typography>
              </Box>
              <SportsSoccerIcon sx={{ fontSize: 40, color: '#58A6FF', opacity: 0.8 }} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  การ์ดระดับสูง (Epic / Show Time)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#E3B341" sx={{ mt: 0.5 }}>
                  {Number(stats.high_tier_cards).toLocaleString()}
                </Typography>
              </Box>
              <StarIcon sx={{ fontSize: 40, color: '#E3B341', opacity: 0.8 }} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  เปิดใช้งานอยู่ในระบบ (Active)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#3FB950" sx={{ mt: 0.5 }}>
                  {Number(stats.active_cards).toLocaleString()}
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#3FB950', opacity: 0.8 }} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  เรตติ้งสูงสุด (Max OVR)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#F85149" sx={{ mt: 0.5 }}>
                  {stats.max_ovr}
                </Typography>
              </Box>
              <WhatshotIcon sx={{ fontSize: 40, color: '#F85149', opacity: 0.8 }} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Search & Filters Bar ── */}
      <Card sx={{ p: 2.5, mb: 3, bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="ค้นหาชื่อนักเตะ (เช่น Lionel Messi, Haaland)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  bgcolor: '#0D1117',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363D' },
                }}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'text.secondary' }}>ระดับการ์ด</InputLabel>
                <Select
                  value={tierFilter}
                  label="ระดับการ์ด"
                  onChange={(e) => {
                    setTierFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{ bgcolor: '#0D1117', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363D' } }}
                >
                  <MenuItem value="all">ทั้งหมด (All Tiers)</MenuItem>
                  {tiers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'text.secondary' }}>ตำแหน่ง</InputLabel>
                <Select
                  value={positionFilter}
                  label="ตำแหน่ง"
                  onChange={(e) => {
                    setPositionFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{ bgcolor: '#0D1117', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363D' } }}
                >
                  <MenuItem value="all">ทั้งหมด (All Positions)</MenuItem>
                  {positions.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'text.secondary' }}>สถานะการใช้งาน</InputLabel>
                <Select
                  value={statusFilter}
                  label="สถานะการใช้งาน"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{ bgcolor: '#0D1117', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363D' } }}
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="1">เปิดใช้งาน (Active)</MenuItem>
                  <MenuItem value="0">ปิดใช้งาน (Inactive)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={2} sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{ bgcolor: '#1F6FEB', '&:hover': { bgcolor: '#388BFD' }, flex: 1 }}
              >
                ค้นหา
              </Button>
              <Tooltip title="รีเซ็ตตัวกรอง">
                <IconButton onClick={handleResetFilters} sx={{ border: '1px solid #30363D', color: '#8B949E' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </form>
      </Card>

      {/* ── Error Message ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ── Players Data Table ── */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
        <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#0D1117' }}>
              <TableRow>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D' }}>ชื่อนักเตะ</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D' }}>ตำแหน่ง</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D' }}>ระดับการ์ด</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D' }}>สโมสร / สัญชาติ</TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D', textAlign: 'center' }}>
                  OVR
                </TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D' }}>
                  มูลค่าประเมินพื้นฐาน
                </TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D', textAlign: 'center' }}>
                  สถานะ
                </TableCell>
                <TableCell sx={{ color: '#8B949E', fontWeight: 700, borderColor: '#30363D', textAlign: 'right' }}>
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, borderColor: '#30363D' }}>
                    <CircularProgress size={36} sx={{ color: '#58A6FF' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      กำลังโหลดฐานข้อมูลการ์ดนักเตะ...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, borderColor: '#30363D' }}>
                    <Typography color="text.secondary">ไม่พบการ์ดนักเตะตามเงื่อนไขที่ค้นหา</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                players.map((p) => {
                  const posColor = getPositionGroupColor(p.position_group);
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: '#21262D' },
                        opacity: p.is_active ? 1 : 0.5,
                      }}
                    >
                      {/* Name */}
                      <TableCell sx={{ borderColor: '#30363D' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: '#0D1117',
                              border: `2px solid ${p.display_color || '#30363D'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px',
                              color: p.display_color || '#F0F6FC',
                            }}
                          >
                            {p.position_code || 'P'}
                          </Box>
                          <Box>
                            <Typography variant="body1" fontWeight={700} color="#F0F6FC">
                              {p.player_name}
                            </Typography>
                            {p.season && (
                              <Typography variant="caption" color="text.secondary">
                                ฤดูกาล: {p.season}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Position */}
                      <TableCell sx={{ borderColor: '#30363D' }}>
                        <Chip
                          label={p.position_code || 'N/A'}
                          size="small"
                          sx={{
                            bgcolor: posColor.bg,
                            color: posColor.text,
                            fontWeight: 800,
                            borderRadius: '4px',
                            minWidth: 46,
                          }}
                        />
                      </TableCell>

                      {/* Tier */}
                      <TableCell sx={{ borderColor: '#30363D' }}>
                        <Chip
                          label={p.tier_name || 'Standard'}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            color: p.display_color || '#F0F6FC',
                            border: `1px solid ${p.display_color || '#30363D'}`,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>

                      {/* Club / Nationality */}
                      <TableCell sx={{ borderColor: '#30363D' }}>
                        <Typography variant="body2" color="#F0F6FC">
                          {p.club || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.nationality || '—'}
                        </Typography>
                      </TableCell>

                      {/* OVR Rating */}
                      <TableCell sx={{ borderColor: '#30363D', textAlign: 'center' }}>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          sx={{
                            color:
                              p.overall_rating >= 100
                                ? '#E3B341'
                                : p.overall_rating >= 95
                                ? '#58A6FF'
                                : p.overall_rating >= 90
                                ? '#A371F7'
                                : '#F0F6FC',
                          }}
                        >
                          {p.overall_rating}
                        </Typography>
                      </TableCell>

                      {/* Base Value */}
                      <TableCell sx={{ borderColor: '#30363D' }}>
                        <Typography variant="body2" fontWeight={700} color="#3FB950">
                          ฿{Number(p.base_value).toLocaleString()}
                        </Typography>
                      </TableCell>

                      {/* Status Toggle */}
                      <TableCell sx={{ borderColor: '#30363D', textAlign: 'center' }}>
                        <Tooltip title={p.is_active ? 'คลิกเพื่อปิดใช้งานการ์ด' : 'คลิกเพื่อเปิดใช้งานการ์ด'}>
                          <Switch
                            checked={Boolean(p.is_active)}
                            onChange={() => handleToggleStatus(p)}
                            color="success"
                            size="small"
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ borderColor: '#30363D', textAlign: 'right' }}>
                        <Tooltip title="แก้ไขข้อมูล">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(p)}
                            sx={{ color: '#58A6FF', '&:hover': { bgcolor: 'rgba(88, 166, 255, 0.1)' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Table Pagination ── */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="จำนวนต่อหน้า:"
          rowsPerPageOptions={[10, 20, 50, 100]}
          sx={{
            color: '#8B949E',
            borderTop: '1px solid #30363D',
            '& .MuiSvgIcon-root': { color: '#8B949E' },
          }}
        />
      </Card>

      {/* ── Add / Edit Player Dialog ── */}
      <Dialog
        open={playerModalOpen}
        onClose={() => !formSaving && setPlayerModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, color: '#F0F6FC' },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #30363D', fontWeight: 800 }}>
          {editingPlayer ? 'แก้ไขข้อมูลการ์ดนักเตะ' : 'เพิ่มการ์ดนักเตะใหม่ (New Player Card)'}
        </DialogTitle>

        <form onSubmit={handleSavePlayer}>
          <DialogContent sx={{ py: 3 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  required
                  label="ชื่อนักเตะ (Player Name)"
                  value={formData.player_name}
                  onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                  placeholder="เช่น Lionel Messi, Jude Bellingham"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="ฤดูกาล (Season)"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  placeholder="2024-2025"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>ระดับการ์ด (Card Tier)</InputLabel>
                  <Select
                    value={formData.card_tier_id}
                    label="ระดับการ์ด (Card Tier)"
                    onChange={(e) => setFormData({ ...formData, card_tier_id: e.target.value })}
                  >
                    {tiers.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>ตำแหน่ง (Position)</InputLabel>
                  <Select
                    value={formData.position_id}
                    label="ตำแหน่ง (Position)"
                    onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                  >
                    {positions.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.code} - {p.name} ({p.group_name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="เรตติ้งรวม (OVR Rating)"
                  value={formData.overall_rating}
                  onChange={(e) => setFormData({ ...formData, overall_rating: Number(e.target.value) })}
                  inputProps={{ min: 50, max: 110 }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="มูลค่าประเมินพื้นฐาน (Base Value THB)"
                  value={formData.base_value}
                  onChange={(e) => setFormData({ ...formData, base_value: Number(e.target.value) })}
                  inputProps={{ min: 0, step: 100 }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="สโมสร (Club)"
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  placeholder="เช่น Real Madrid, Manchester City"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="สัญชาติ (Nationality)"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="เช่น Argentina, France, England"
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      color="success"
                    />
                  }
                  label="เปิดใช้งานการ์ดนี้ในระบบค้นหาและ AI Valuation (Active)"
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ borderTop: '1px solid #30363D', px: 3, py: 2 }}>
            <Button onClick={() => setPlayerModalOpen(false)} sx={{ color: '#8B949E' }} disabled={formSaving}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formSaving}
              sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2EA043' }, fontWeight: 700 }}
            >
              {formSaving ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'บันทึกข้อมูล'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Bulk CSV Import Dialog ── */}
      <Dialog
        open={importModalOpen}
        onClose={() => !importing && setImportModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, color: '#F0F6FC' },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #30363D', fontWeight: 800 }}>
          นำเข้าฐานข้อมูลการ์ดนักเตะแบบชุดใหญ่ (Bulk CSV Import)
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            วางข้อมูล CSV เพื่อนำเข้าการ์ดนักเตะหลายรายการพร้อมกัน รูปแบบเรียงตามลำดับคอลัมน์:
            <br />
            <code>player_name, card_tier_id, position_id, overall_rating, base_value, nationality, club, season</code>
          </Typography>

          <Box sx={{ p: 1.5, mb: 2, bgcolor: '#0D1117', border: '1px dashed #30363D', borderRadius: 1 }}>
            <Typography variant="caption" color="#58A6FF" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
              ตัวอย่างข้อมูล (Copy/Paste ได้ทันที):
            </Typography>
            <Typography variant="caption" sx={{ color: '#8B949E', fontFamily: 'monospace' }}>
              Vinicius Jr., 3, 1, 102, 4500, Brazil, Real Madrid, 2024-2025
              <br />
              Rodri, 4, 7, 101, 3800, Spain, Manchester City, 2024-2025
              <br />
              Lamine Yamal, 2, 4, 99, 4200, Spain, FC Barcelona, 2024-2025
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={8}
            placeholder="วางเนื้อหาข้อมูล CSV ที่นี่..."
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            sx={{
              bgcolor: '#0D1117',
              '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '13px' },
            }}
          />

          {importResult && (
            <Alert severity={importResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
              {importResult.success ? importResult.message : importResult.error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #30363D', px: 3, py: 2 }}>
          <Button onClick={() => setImportModalOpen(false)} sx={{ color: '#8B949E' }} disabled={importing}>
            ปิดหน้าต่าง
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkImport}
            disabled={importing || !csvText.trim()}
            sx={{ bgcolor: '#1F6FEB', '&:hover': { bgcolor: '#388BFD' }, fontWeight: 700 }}
          >
            {importing ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'เริ่มนำเข้าข้อมูล (Import)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Notification Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
