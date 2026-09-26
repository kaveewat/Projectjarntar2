import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Chip,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StarsIcon from '@mui/icons-material/Stars';
import api from '../../services/api';
import listingsApi from '../../services/listings.api';

export default function CreateListingPage() {
  const navigate = useNavigate();

  // Basic form fields
  const [formData, setFormData] = useState({
    title: '',
    platform_id: 1,
    asking_price: '',
    team_strength: '',
    description: '',
  });

  // Platforms
  const [platforms, setPlatforms] = useState([
    { id: 1, name: 'iOS', slug: 'ios' },
    { id: 2, name: 'Android', slug: 'android' },
    { id: 3, name: 'PlayStation', slug: 'playstation' },
    { id: 4, name: 'PC', slug: 'pc' },
  ]);

  // Image upload state
  const [images, setImages] = useState([]); // Array of File objects
  const [imagePreviews, setImagePreviews] = useState([]); // Array of Object URLs
  const fileInputRef = useRef(null);

  // Featured player picker state
  const [playerSearch, setPlayerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]); // Array of player card objects

  // Submit & dialog state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdListingId, setCreatedListingId] = useState(null);

  // Load platforms on mount
  useEffect(() => {
    listingsApi.getPlatforms().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPlatforms(data);
      }
    });
  }, []);

  // Debounced search for players directory
  const handlePlayerSearchChange = (e) => {
    const val = e.target.value;
    setPlayerSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val.trim());
    }, 300);
  };

  // Fetch players from /api/v1/players
  useEffect(() => {
    let active = true;
    const fetchPlayers = async () => {
      if (!debouncedSearch) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await api.get('/players', {
          params: { name: debouncedSearch, limit: 12 },
        });
        if (active) {
          const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.players) || [];
          setSearchResults(list);
        }
      } catch (err) {
        console.error('Error fetching player cards:', err);
      } finally {
        if (active) setSearching(false);
      }
    };

    fetchPlayers();
    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  // Image handling
  const handleFilesSelected = (filesList) => {
    const newFiles = Array.from(filesList).filter((f) => f.type.startsWith('image/'));
    if (newFiles.length === 0) return;

    const updated = [...images, ...newFiles].slice(0, 10); // Max 10 images
    setImages(updated);

    // Generate previews
    const previews = updated.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return previews;
    });
  };

  const handleRemoveImage = (index) => {
    const updatedFiles = images.filter((_, idx) => idx !== index);
    setImages(updatedFiles);

    URL.revokeObjectURL(imagePreviews[index]);
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== index);
    setImagePreviews(updatedPreviews);
  };

  // Player selection
  const handleAddPlayer = (player) => {
    if (selectedPlayers.some((p) => p.id === player.id)) return;
    setSelectedPlayers((prev) => [...prev, player]);
  };

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg('กรุณากรอกชื่อหัวข้อประกาศขายไอดี');
      return;
    }
    if (!formData.asking_price || Number(formData.asking_price) <= 0) {
      setErrorMsg('กรุณากรอกราคาตั้งขายที่ถูกต้องในหน่วยบาท (THB)');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('platform_id', Number(formData.platform_id));
      data.append('asking_price', Number(formData.asking_price));
      if (formData.team_strength) {
        data.append('team_strength', Number(formData.team_strength));
      }
      if (formData.description.trim()) {
        data.append('description', formData.description.trim());
      }
      data.append('game_id', 1);

      // Selected player IDs
      const playerIds = selectedPlayers.map((p) => p.id);
      data.append('player_ids', JSON.stringify(playerIds));

      // Images
      images.forEach((img) => {
        data.append('images', img);
      });

      const res = await listingsApi.createListing(data);
      if (res?.success && res.data?.listing) {
        setCreatedListingId(res.data.listing.id);
        setSuccessDialogOpen(true);
      } else {
        setErrorMsg(res?.message || 'ไม่สามารถลงขายไอดีได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error('Submit listing error:', err);
      const details = err.response?.data?.error?.details;
      const detailText = Array.isArray(details) && details.length > 0
        ? details.map((d) => d.message).join(', ')
        : null;
      setErrorMsg(
        detailText ||
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'เกิดข้อผิดพลาดในการลงขายไอดี กรุณาตรวจสอบข้อมูล'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
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
          ลงขายไอดี eFootball
        </Typography>
        <Typography variant="body1" color="text.secondary">
          กรอกรายละเอียดไอดี แนบรูปภาพหน้าจอทีม และเลือกนักเตะเด่นจากทำเนียบนักเตะเพื่อดึงดูดผู้ซื้อ
        </Typography>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* ── SECTION 1: ข้อมูลไอดี (ACCOUNT INFO) ── */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: { xs: 2.5, md: 3.5 } }}>
            <Typography variant="h6" fontWeight={700} color="#F0F6FC" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SportsSoccerIcon color="primary" /> 1. ข้อมูลไอดีและราคาขาย
            </Typography>

            <Grid container spacing={2.5}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  label="ชื่อหัวข้อประกาศขาย *"
                  placeholder="เช่น ฟูลทีม Epic/Showtime Gullit + Rummenigge พลัง 3150"
                  fullWidth
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  inputProps={{ maxLength: 100 }}
                  helperText={`${formData.title.length}/100 ตัวอักษร`}
                />
              </Grid>

              {/* Platform */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="platform-label">แพลตฟอร์ม *</InputLabel>
                  <Select
                    labelId="platform-label"
                    value={formData.platform_id}
                    label="แพลตฟอร์ม *"
                    onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                  >
                    {platforms.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Asking Price */}
              <Grid item xs={12} sm={4}>
                <TextField
                  label="ราคาขาย (บาท THB) *"
                  type="number"
                  fullWidth
                  placeholder="เช่น 1500"
                  value={formData.asking_price}
                  onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Team Strength */}
              <Grid item xs={12} sm={4}>
                <TextField
                  label="พลังรวมทีม (Team Strength)"
                  type="number"
                  fullWidth
                  placeholder="เช่น 3120"
                  value={formData.team_strength}
                  onChange={(e) => setFormData({ ...formData, team_strength: e.target.value })}
                  helperText="พลังรวมทีมสูงสุดในไอดี"
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  label="รายละเอียดเพิ่มเติมเกี่ยวกับไอดี"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="ระบุข้อมูลเพิ่มเติม เช่น มีเหรียญคงเหลือ, โค้ชระดับท็อป, สกิลที่ติดเพิ่ม, การผูกบัญชี Konami ID สะอาด ฯลฯ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Card>

          {/* ── SECTION 2: รูปภาพประกอบไอดี (SCREENSHOTS DROPZONE) ── */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: { xs: 2.5, md: 3.5 } }}>
            <Typography variant="h6" fontWeight={700} color="#F0F6FC" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUploadIcon color="primary" /> 2. รูปภาพประกอบไอดี (แสดงบนตลาดซื้อขาย)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              แนบรูปภาพหน้าจอทีม แผนการเล่น หรือคลังนักเตะ (สูงสุด 10 รูป) โดยรูปแรกจะแสดงเป็นภาพหน้าปกบนตลาด
            </Typography>

            {/* Dropzone Click Area */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              sx={{
                border: '2px dashed #30363D',
                borderRadius: 2,
                p: { xs: 3, md: 4 },
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'rgba(22, 27, 34, 0.6)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(31, 111, 235, 0.05)',
                },
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
                คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
              </Typography>
              <Typography variant="caption" color="text.secondary">
                รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 10 รูป)
              </Typography>
            </Box>

            {/* Image Previews Grid */}
            {imagePreviews.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} color="#F0F6FC" sx={{ mb: 1.5 }}>
                  รูปภาพที่เลือก ({imagePreviews.length}/10):
                </Typography>
                <Grid container spacing={2}>
                  {imagePreviews.map((url, idx) => (
                    <Grid item xs={6} sm={4} md={2.4} key={idx}>
                      <Box
                        sx={{
                          position: 'relative',
                          height: 120,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: idx === 0 ? '2px solid #58A6FF' : '1px solid #30363D',
                          bgcolor: '#0D1117',
                        }}
                      >
                        <img
                          src={url}
                          alt={`preview-${idx}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {idx === 0 && (
                          <Chip
                            label="รูปหน้าปก"
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              height: 20,
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: '#F85149',
                            p: 0.5,
                            '&:hover': { bgcolor: 'rgba(248,81,73,0.2)' },
                          }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Card>

          {/* ── SECTION 3: เลือกนักเตะเด่นจากทำเนียบนักเตะ ── */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: { xs: 2.5, md: 3.5 } }}>
            <Typography variant="h6" fontWeight={700} color="#F0F6FC" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarsIcon color="primary" /> 3. เพิ่มนักเตะเด่นจากทำเนียบนักเตะ
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              ค้นหาและคลิกเพื่อเลือกการ์ดนักเตะสำคัญในไอดี เพื่อให้ผู้ซื้อเห็นรายชื่อนักเตะและค้นหาเจอในตลาดได้ง่ายขึ้น
            </Typography>

            {/* Selected Players Display Area */}
            {selectedPlayers.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#0D1117', borderRadius: 2, border: '1px solid #30363D' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#58A6FF">
                    นักเตะเด่นที่เลือก ({selectedPlayers.length} คน):
                  </Typography>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setSelectedPlayers([])}
                    sx={{ fontSize: '0.75rem', color: '#8B949E' }}
                  >
                    ล้างทั้งหมด
                  </Button>
                </Box>
                <Grid container spacing={1.5}>
                  {selectedPlayers.map((player) => {
                    const img = player.image_url || (player.efhub_id ? `https://efimg.com/efootballhub22/images/player_cards/${player.efhub_id}_l.png` : null);
                    return (
                      <Grid item xs={6} sm={4} md={3} lg={2.4} key={player.id}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: '#161B22',
                            border: '1px solid #30363D',
                            position: 'relative',
                          }}
                        >
                          <Box
                            component="img"
                            src={img}
                            alt={player.player_name || player.name}
                            sx={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 1 }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              color="#F0F6FC"
                              noWrap
                              sx={{ display: 'block' }}
                            >
                              {player.player_name || player.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip
                                label={player.position_code || player.position || 'POS'}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: 'rgba(31, 111, 235, 0.2)',
                                  color: '#58A6FF',
                                  px: 0.2,
                                }}
                              />
                              <Typography variant="caption" fontWeight={800} color="#3FB950">
                                {player.overall_rating}
                              </Typography>
                              {player.is_double_booster && (
                                <Chip
                                  label="⚡ 2 Boost"
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.6rem',
                                    fontWeight: 800,
                                    bgcolor: 'rgba(245, 158, 11, 0.2)',
                                    color: '#FBBF24',
                                    border: '1px solid rgba(245, 158, 11, 0.5)',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePlayer(player.id)}
                            sx={{ color: '#8B949E', '&:hover': { color: '#F85149' }, p: 0.5 }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Quick 2-Booster meta player suggestions */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                ⚡ แนะนำ: ค้นหาการ์ด 2 บูสต์ยอดนิยม (Double Boosters) ที่ผู้ซื้อต้องการสูง:
              </Typography>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ gap: 0.8 }}>
                {[
                  { label: '⚡ การ์ด 2 บูสต์ทั้งหมด', query: '2 boost' },
                  { label: '⚡ Chiellini', query: 'Chiellini' },
                  { label: '⚡ Bonucci', query: 'Bonucci' },
                  { label: '⚡ De Rossi', query: 'De Rossi' },
                  { label: '⚡ Bale', query: 'Bale' },
                  { label: '⚡ Gullit', query: 'Gullit' },
                  { label: '⚡ Messi', query: 'Messi' },
                  { label: '⚡ Ronaldinho', query: 'Ronaldinho' },
                  { label: '⚡ Shevchenko', query: 'Shevchenko' },
                  { label: '⚡ Vieira', query: 'Vieira' },
                ].map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item.label}
                    size="small"
                    clickable
                    onClick={() => {
                      setPlayerSearch(item.query);
                      setDebouncedSearch(item.query);
                    }}
                    sx={{
                      bgcolor: item.query === '2 boost' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      border: item.query === '2 boost' ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: item.query === '2 boost' ? '#FBBF24' : '#F0F6FC',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      '&:hover': {
                        bgcolor: 'rgba(245, 158, 11, 0.3)',
                        borderColor: '#F59E0B',
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Search Input */}
            <TextField
              fullWidth
              placeholder="พิมพ์ชื่อนักเตะเพื่อค้นหา (เช่น Chiellini, Bale, Gullit, Messi) หรือ '2 boost'..."
              value={playerSearch}
              onChange={handlePlayerSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searching && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Search Results Grid */}
            {searchResults.length > 0 && (
              <Box sx={{ p: 2, bgcolor: '#0D1117', borderRadius: 2, border: '1px solid #30363D' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  ผลการค้นหา — คลิกที่การ์ดเพื่อเพิ่มเป็นนักเตะเด่น:
                </Typography>
                <Grid container spacing={1.5}>
                  {searchResults.map((player) => {
                    const isSelected = selectedPlayers.some((p) => p.id === player.id);
                    const img = player.image_url || (player.efhub_id ? `https://efimg.com/efootballhub22/images/player_cards/${player.efhub_id}_l.png` : null);

                    return (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={player.id}>
                        <Box
                          onClick={() => (!isSelected ? handleAddPlayer(player) : handleRemovePlayer(player.id))}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            p: 1.2,
                            borderRadius: 1.5,
                            bgcolor: isSelected ? 'rgba(31, 111, 235, 0.15)' : '#161B22',
                            border: isSelected ? '1.5px solid #1F6FEB' : '1px solid #30363D',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: '#58A6FF',
                            },
                          }}
                        >
                          <Box sx={{ position: 'relative', width: 64, height: 80, mb: 0.5 }}>
                            <Box
                              component="img"
                              src={img}
                              alt={player.player_name || player.name}
                              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                e.target.style.opacity = '0.3';
                              }}
                            />
                            {isSelected && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  bgcolor: '#1F6FEB',
                                  borderRadius: '50%',
                                  width: 20,
                                  height: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#FFF' }} />
                              </Box>
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="#F0F6FC"
                            align="center"
                            noWrap
                            sx={{ width: '100%', display: 'block' }}
                          >
                            {player.player_name || player.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.3, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Chip
                              label={player.position_code || player.position || 'POS'}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(255,255,255,0.08)',
                                color: '#58A6FF',
                              }}
                            />
                            <Typography variant="caption" fontWeight={800} color="#3FB950">
                              {player.overall_rating}
                            </Typography>
                            {player.is_double_booster && (
                              <Chip
                                label="⚡ 2 Boost"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  bgcolor: 'rgba(245, 158, 11, 0.2)',
                                  color: '#FBBF24',
                                  border: '1px solid rgba(245, 158, 11, 0.5)',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {debouncedSearch && !searching && searchResults.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                ไม่พบการ์ดนักเตะที่ตรงกับ "{debouncedSearch}"
              </Typography>
            )}
          </Card>

          {/* ── SUBMIT BUTTON & ACTIONS ── */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
            <Button
              component={Link}
              to="/marketplace"
              variant="outlined"
              color="inherit"
              size="large"
              sx={{ px: 4, fontWeight: 600 }}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
              sx={{
                px: 5,
                py: 1.5,
                fontWeight: 700,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #1F6FEB 0%, #1158C7 100%)',
                boxShadow: '0 4px 14px rgba(31, 111, 235, 0.4)',
              }}
            >
              {submitting ? 'กำลังเผยแพร่...' : 'เผยแพร่ประกาศขายทันที'}
            </Button>
          </Box>
        </Stack>
      </form>

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        PaperProps={{
          sx: { bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 2 },
        }}
      >
        <DialogTitle sx={{ color: '#F0F6FC', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 32 }} />
          ลงขายไอดีสำเร็จเรียบร้อย!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            ประกาศขายไอดีของคุณได้รับการเผยแพร่ขึ้นสู่ตลาดซื้อขาย eFootball Smart Marketplace เรียบร้อยแล้ว
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            component={Link}
            to="/marketplace"
            variant="outlined"
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            ดูตลาดซื้อขายทั้งหมด
          </Button>
          <Button
            component={Link}
            to={`/marketplace/${createdListingId}`}
            variant="contained"
            color="primary"
            sx={{ fontWeight: 700 }}
          >
            ไปยังหน้ารายละเอียดไอดี
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
