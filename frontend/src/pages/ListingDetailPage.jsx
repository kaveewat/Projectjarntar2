import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Breadcrumbs,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedIcon from '@mui/icons-material/Verified';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import listingsApi from '../services/listings.api';
import ordersApi from '../services/orders.api';
import { useAuth } from '../contexts/AuthContext';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Escrow Purchase Modal state
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listingsApi.getListingById(id);
      setListing(res.data?.listing || res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load listing details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = () => {
    setCheckoutError(null);
    if (!isAuthenticated) {
      // Guest: Redirect to login with return path
      navigate(`/login?redirect=/marketplace/${id}`);
      return;
    }

    // Authenticated user
    if (user?.id === listing?.seller_id) {
      return; // Cannot buy own listing
    }

    if (listing?.status && listing.status !== 'ACTIVE') {
      return; // Cannot buy reserved or sold listing
    }

    setCheckoutDialogOpen(true);
  };

  const handleProceedToCheckout = async () => {
    setOrdering(true);
    setCheckoutError(null);
    try {
      const res = await ordersApi.createOrder({ listing_id: Number(id) });
      const order = res.data?.data?.order || res.data?.order;
      const orderId = order?.id || res.data?.data?.id || res.data?.id;
      setCheckoutDialogOpen(false);
      if (orderId) {
        navigate(`/orders/${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create escrow order';
      setCheckoutError(msg);
      // Refresh listing detail so UI updates to RESERVED/disabled
      fetchDetail();
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Loading squad details and valuation...
        </Typography>
      </Container>
    );
  }

  if (error || !listing) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Listing not found.'}
        </Alert>
        <Button component={Link} to="/marketplace" startIcon={<ArrowBackIcon />}>
          Back to Marketplace
        </Button>
      </Container>
    );
  }

  const {
    title,
    description,
    asking_price,
    fair_price_min,
    fair_price_max,
    value_badge,
    team_strength,
    seller_id,
    seller_name,
    seller_verified,
    seller_role,
    platform_name,
    game_name,
    squad_images = [],
    players = [],
    created_at,
    algorithm_version,
    status = 'ACTIVE',
  } = listing;

  const isOwner = user?.id === seller_id;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
        sx={{ mb: 3 }}
      >
        <Link to="/" style={{ color: '#8B949E', textDecoration: 'none', fontSize: '0.875rem' }}>
          หน้าแรก
        </Link>
        <Link to="/marketplace" style={{ color: '#8B949E', textDecoration: 'none', fontSize: '0.875rem' }}>
          ตลาดซื้อขายไอดี
        </Link>
        <Typography color="#F0F6FC" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {title}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Left Column: Gallery, Details, Squad Players */}
        <Grid item xs={12} md={7.5} lg={8}>
          {/* Main Gallery */}
          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: '#161B22',
              border: '1px solid #30363D',
              mb: 3,
            }}
          >
            {squad_images.length > 0 && !imgError ? (
              <Box sx={{ position: 'relative', width: '100%', maxHeight: 440, bgcolor: '#0D1117' }}>
                <CardMedia
                  component="img"
                  image={squad_images[selectedImgIndex] || squad_images[0]}
                  alt={title}
                  onError={() => setImgError(true)}
                  sx={{
                    width: '100%',
                    maxHeight: 440,
                    objectFit: 'contain',
                    bgcolor: '#0D1117',
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  height: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(ellipse at center, #1F6FEB22 0%, #0D1117 80%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  gap: 1.5,
                }}
              >
                <SportsSoccerIcon sx={{ fontSize: 64, color: 'rgba(88, 166, 255, 0.6)' }} />
                <Typography variant="h6" color="#8B949E">
                  รายชื่อการ์ดนักเตะในไอดี
                </Typography>
              </Box>
            )}

            {/* Thumbnail selector if multiple images */}
            {squad_images.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ p: 1.5, bgcolor: '#0D1117', overflowX: 'auto' }}>
                {squad_images.map((imgUrl, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setSelectedImgIndex(idx)}
                    sx={{
                      width: 68,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border:
                        selectedImgIndex === idx
                          ? '2px solid #1F6FEB'
                          : '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* Listing Overview Title & Description */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.5 }}>
              <Chip
                label={platform_name || 'Platform'}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={game_name || 'eFootball'}
                size="small"
                variant="outlined"
                sx={{ borderColor: '#30363D' }}
              />
              {status === 'RESERVED' && (
                <Chip
                  label="RESERVED"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 800 }}
                />
              )}
              {status === 'SOLD' && (
                <Chip
                  label="SOLD"
                  size="small"
                  sx={{ bgcolor: '#30363D', color: '#8B949E', fontWeight: 800 }}
                />
              )}
            </Box>

            <Typography variant="h4" component="h1" fontWeight={800} color="#F0F6FC" gutterBottom>
              {title}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
              {description || 'ผู้ขายไม่ได้ระบุรายละเอียดเพิ่มเติม'}
            </Typography>
          </Box>

          <Divider sx={{ my: 3, borderColor: '#30363D' }} />

          {/* Featured Players in Squad */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC">
                นักเตะเด่นในไอดี ({players.length} คน)
              </Typography>
              <Chip
                label="ทำเนียบนักเตะ eFootball"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {players.length === 0 ? (
              <Alert severity="info" sx={{ bgcolor: '#161B22', color: 'text.secondary' }}>
                ผู้ขายไม่ได้เลือกนักเตะเด่นระบุไว้ในไอดีนี้
              </Alert>
            ) : (
              <Grid container spacing={1.5}>
                {players.map((p, idx) => {
                  const img = p.image_url || (p.efhub_id ? `https://efimg.com/efootballhub22/images/player_cards/${p.efhub_id}_l.png` : null);
                  return (
                    <Grid item xs={6} sm={4} md={3} key={idx}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: '#161B22',
                          border: '1px solid #30363D',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        {img && (
                          <Box
                            component="img"
                            src={img}
                            alt={p.player_name || p.detected_name}
                            sx={{ width: 44, height: 56, objectFit: 'contain', borderRadius: 1 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" fontWeight={700} color="#F0F6FC" noWrap>
                            {p.player_name || p.detected_name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={p.detected_position || p.position_code || 'POS'}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(31, 111, 235, 0.2)',
                                color: '#58A6FF',
                                height: 20,
                              }}
                            />
                            <Typography variant="caption" fontWeight={800} color="#3FB950">
                              OVR {p.overall_rating || '—'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Grid>

        {/* Right Column: Pricing, Escrow, and Action Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
            {/* Purchase Card */}
            <Card
              sx={{
                bgcolor: '#161B22',
                borderRadius: 2,
                border: '1px solid #30363D',
                p: 3,
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {/* Price */}
                <Typography variant="body2" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                  ราคาตั้งขาย
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ color: '#58A6FF', my: 1, mb: 3 }}>
                  ฿{Number(asking_price).toLocaleString()}
                </Typography>

                {/* Team Strength stat */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #21262D' }}>
                  <Typography variant="body2" color="text.secondary">
                    พลังรวมทีม (Team Strength)
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.light">
                    {team_strength ? team_strength.toLocaleString() : 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #21262D' }}>
                  <Typography variant="body2" color="text.secondary">
                    แพลตฟอร์ม
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#F0F6FC">
                    {platform_name || 'Standard'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    วันที่ลงประกาศ
                  </Typography>
                  <Typography variant="body2" color="#F0F6FC">
                    {new Date(created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Buy Button */}
                {isOwner ? (
                  <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    disabled
                    size="large"
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    นี่คือรายการประกาศของคุณ
                  </Button>
                ) : status === 'RESERVED' ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      disabled
                      size="large"
                      sx={{
                        py: 1.5,
                        fontWeight: 700,
                        bgcolor: 'rgba(210, 153, 34, 0.2) !important',
                        color: '#D29922 !important',
                        border: '1px solid #D29922',
                      }}
                    >
                      ติดจอง (อยู่ระหว่างขั้นตอน Escrow)
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      รายการนี้มีผู้ซื้อกำลังทำรายการในระบบ Escrow หากไม่มีการชำระเงินตามเวลาที่กำหนด รายการจะกลับมาเปิดขายใหม่อีกครั้ง
                    </Typography>
                    <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                      <Button
                        component={Link}
                        to="/orders"
                        size="small"
                        variant="outlined"
                        color="warning"
                        sx={{ fontWeight: 700 }}
                      >
                        ดูในคำสั่งซื้อของฉัน
                      </Button>
                    </Box>
                  </Box>
                ) : status === 'SOLD' ? (
                  <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    disabled
                    size="large"
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    รายการนี้ขายแล้ว
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<ShoppingCartCheckoutIcon />}
                    onClick={handleBuyClick}
                    sx={{
                      py: 1.5,
                      fontWeight: 800,
                      fontSize: '1rem',
                      letterSpacing: '0.02em',
                      boxShadow: '0 4px 14px rgba(31, 111, 235, 0.35)',
                    }}
                  >
                    {isAuthenticated ? 'สั่งซื้อผ่านระบบคุ้มครอง Escrow' : 'เข้าสู่ระบบเพื่อสั่งซื้อ'}
                  </Button>
                )}

                {/* Guest hint */}
                {!isAuthenticated && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    เข้าสู่ระบบหรือสมัครสมาชิกผู้ซื้อเพื่อเริ่มคำสั่งซื้อผ่านระบบ Escrow
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Seller Info Card */}
            <Card
              sx={{
                bgcolor: '#161B22',
                borderRadius: 2,
                border: '1px solid #30363D',
                p: 2.5,
                mb: 3,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ข้อมูลผู้ขาย
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
                      {seller_name || 'ผู้ขาย'}
                    </Typography>
                    {seller_verified ? (
                      <Tooltip title="ผู้ขายยืนยันตัวตนแล้ว" arrow>
                        <VerifiedIcon sx={{ fontSize: 16, color: 'primary.light' }} />
                      </Tooltip>
                    ) : null}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    สถานะ: {seller_role === 'VERIFIED_SELLER' ? 'ผู้ขายยืนยันตัวตน' : seller_role || 'SELLER'}
                  </Typography>
                </Box>
                <Chip
                  label={seller_verified ? 'ยืนยันตัวตนแล้ว' : 'ผู้ขายทั่วไป'}
                  size="small"
                  color={seller_verified ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
            </Card>

            {/* Escrow Guarantee Info Card */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(31, 111, 235, 0.08)',
                border: '1px solid rgba(31, 111, 235, 0.25)',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <SecurityIcon sx={{ color: 'primary.light', fontSize: 24, mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC">
                    ระบบคุ้มครองผู้ซื้อ Escrow
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                    เงินที่คุณชำระจะถูกล็อกไว้อย่างปลอดภัยในระบบคนกลาง Escrow ข้อมูลบัญชีจะถูกส่งมอบผ่านห้องนิรภัยที่เข้ารหัส AES-256 และระบบจะโอนเงินให้ผู้ขายหลังจากที่คุณตรวจสอบและกดยืนยันรับไอดีสำเร็จเท่านั้น
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Escrow Purchase Confirmation Dialog */}
      <Dialog
        open={checkoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#161B22',
            border: '1px solid #30363D',
            borderRadius: 2,
            maxWidth: 480,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#F0F6FC' }}>
          ยืนยันการเริ่มสั่งซื้อผ่านระบบ Escrow
        </DialogTitle>
        <DialogContent>
          {checkoutError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {checkoutError}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" paragraph>
            คุณกำลังจะสั่งซื้อ <strong>{title}</strong> ในราคา{' '}
            <strong style={{ color: '#58A6FF' }}>฿{Number(asking_price).toLocaleString()}</strong>
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: '#0D1117',
              border: '1px solid #30363D',
              mb: 2,
            }}
          >
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" color="#F0F6FC">
                  เงินถูกคุ้มครองในระบบ Escrow จนกว่าคุณจะตรวจสอบข้อมูลบัญชีเรียบร้อย
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon sx={{ fontSize: 16, color: 'primary.light' }} />
                <Typography variant="caption" color="#F0F6FC">
                  ส่งมอบ Konami ID และรหัสผ่านผ่านห้องนิรภัยเข้ารหัส AES-256
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="caption" color="#F0F6FC">
                  มีระยะเวลาตรวจสอบ 48 ชม. และสามารถเปิดข้อพิพาทได้หากข้อมูลไม่ตรงประกาศ
                </Typography>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCheckoutDialogOpen(false)} color="inherit">
            {checkoutError ? 'ปิด' : 'ยกเลิก'}
          </Button>
          {!checkoutError && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleProceedToCheckout}
              disabled={ordering}
              sx={{ fontWeight: 700 }}
            >
              {ordering ? 'กำลังสร้างคำสั่งซื้อ Escrow...' : 'ดำเนินการสั่งซื้อและชำระเงิน'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
