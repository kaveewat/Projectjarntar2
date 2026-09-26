import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Pagination,
  Skeleton,
  Stack,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Button,
  Drawer,
  IconButton,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import listingsApi from '../services/listings.api';
import ListingCard from '../components/listing/ListingCard';
import ListingFilterPanel from '../components/listing/ListingFilterPanel';

export default function MarketplacePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // Mobile drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parse filters from URL search params
  const [filters, setFilters] = useState({
    player_name: searchParams.get('player_name') || '',
    has_double_booster: searchParams.get('has_double_booster') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_strength: searchParams.get('min_strength') || '',
    badge: searchParams.get('badge') || '',
    platform_id: searchParams.get('platform_id') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
  });

  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch listings from backend
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listingsApi.getListings(filters);
      if (res && res.success) {
        setListings(res.data || []);
        if (res.meta) {
          setMeta(res.meta);
        }
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error('Failed to load marketplace listings:', err);
      setError(err.response?.data?.error?.message || 'Failed to load listings. Please try again.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Update URL search parameters when filters change
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters, page: 1 };
      const nextParams = {};
      Object.entries(updated).forEach(([k, v]) => {
        if (v !== '' && v !== undefined && v !== null && k !== 'limit') {
          nextParams[k] = v;
        }
      });
      setSearchParams(nextParams);
      return updated;
    });
  };

  const handlePageChange = (event, newPage) => {
    setFilters((prev) => {
      const updated = { ...prev, page: newPage };
      const nextParams = {};
      Object.entries(updated).forEach(([k, v]) => {
        if (v !== '' && v !== undefined && v !== null && k !== 'limit') {
          nextParams[k] = v;
        }
      });
      setSearchParams(nextParams);
      return updated;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      player_name: '',
      has_double_booster: '',
      min_price: '',
      max_price: '',
      min_strength: '',
      badge: '',
      platform_id: '',
      sort: 'newest',
      page: 1,
      limit: 12,
    };
    setFilters(defaultFilters);
    setSearchParams({});
  };

  // Helper to remove individual filter chips
  const removeFilter = (key) => {
    handleFilterChange({ [key]: undefined });
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
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
          แค็ตตาล็อกตลาดซื้อขายไอดี
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ไอดี eFootball ผ่านการตรวจสอบ พร้อมการประเมินราคาที่เป็นธรรมด้วยระบบ AI และระบบคุ้มครอง Escrow ปลอดภัย 100%
        </Typography>
      </Box>

      {/* Control Bar: Mobile Filter Button, Active Chips, Sort Dropdown */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          p: 1.5,
          bgcolor: '#161B22',
          borderRadius: 2,
          border: '1px solid #30363D',
        }}
      >
        {/* Left Side: Filter button on Mobile & Active Filter summary */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {isMobile && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<FilterAltIcon />}
              onClick={() => setMobileFilterOpen(true)}
              sx={{ fontWeight: 700 }}
            >
              ตัวกรอง
            </Button>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {loading ? 'กำลังค้นหา...' : `พบ ${meta.total || 0} รายการพร้อมขาย`}
          </Typography>

          {/* Active Filter Chips */}
          {filters.player_name && (
            <Chip
              label={`นักเตะ: ${filters.player_name}`}
              size="small"
              onDelete={() => removeFilter('player_name')}
              color="primary"
              variant="outlined"
            />
          )}

          {filters.badge && (
            <Chip
              label={`ป้าย: ${filters.badge}`}
              size="small"
              onDelete={() => removeFilter('badge')}
              color="secondary"
              variant="outlined"
            />
          )}

          {(filters.min_price || filters.max_price) && (
            <Chip
              label={`ราคา: ฿${filters.min_price || 0} – ฿${filters.max_price || 'ไม่จำกัด'}`}
              size="small"
              onDelete={() => {
                removeFilter('min_price');
                removeFilter('max_price');
              }}
              variant="outlined"
            />
          )}

          {filters.platform_id && (
            <Chip
              label={`แพลตฟอร์ม: ${
                filters.platform_id === '1'
                  ? 'iOS'
                  : filters.platform_id === '2'
                  ? 'Android'
                  : filters.platform_id === '3'
                  ? 'PlayStation'
                  : 'PC'
              }`}
              size="small"
              onDelete={() => removeFilter('platform_id')}
              variant="outlined"
            />
          )}
        </Stack>

        {/* Right Side: Sort dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SortIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={filters.sort || 'newest'}
              onChange={(e) => handleFilterChange({ sort: e.target.value })}
              sx={{
                bgcolor: '#0D1117',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <MenuItem value="newest">ลงขายล่าสุด</MenuItem>
              <MenuItem value="price_asc">ราคา: ต่ำไปสูง</MenuItem>
              <MenuItem value="price_desc">ราคา: สูงไปต่ำ</MenuItem>
              <MenuItem value="strength_desc">พลังทีมสูงสุด</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Main Grid: Sidebar + Listings */}
      <Grid container spacing={3}>
        {/* Desktop Sidebar Filter Panel */}
        {!isMobile && (
          <Grid item md={3.5} lg={3}>
            <ListingFilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          </Grid>
        )}

        {/* Listings Grid */}
        <Grid item xs={12} md={8.5} lg={9}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <Grid container spacing={2.5}>
              {[...Array(6)].map((_, i) => (
                <Grid item xs={12} sm={6} lg={4} key={i}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#161B22',
                      borderRadius: 2,
                      border: '1px solid #30363D',
                    }}
                  >
                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1, mb: 2 }} />
                    <Skeleton variant="text" height={28} width="80%" sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={16} width="50%" sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : listings.length === 0 ? (
            /* Empty State */
            <Box
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: '#161B22',
                borderRadius: 2,
                border: '1px dashed #30363D',
                my: 2,
              }}
            >
              <SentimentDissatisfiedIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom color="#F0F6FC">
                ไม่พบรายการไอดีที่ค้นหา
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 3 }}>
                ไม่พบรายการประกาศที่ตรงกับเงื่อนไขตัวกรองของคุณ ลองปรับช่วงราคาหรือล้างคำค้นหาเพื่อดูรายการเพิ่มเติม
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RestartAltIcon />}
                onClick={handleResetFilters}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                ล้างตัวกรองทั้งหมด
              </Button>
            </Box>
          ) : (
            /* Real Listings Grid */
            <>
              <Grid container spacing={2.5}>
                {listings.map((listing) => (
                  <Grid item xs={12} sm={6} lg={4} key={listing.id}>
                    <ListingCard listing={listing} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 2 }}>
                  <Pagination
                    count={meta.totalPages}
                    page={meta.page}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    size={isMobile ? 'medium' : 'large'}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{
          sx: {
            width: '85%',
            maxWidth: 360,
            bgcolor: '#0D1117',
            p: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            ตัวกรองการค้นหา
          </Typography>
          <IconButton onClick={() => setMobileFilterOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <ListingFilterPanel
          filters={filters}
          onFilterChange={(newF) => {
            handleFilterChange(newF);
            setMobileFilterOpen(false);
          }}
          onResetFilters={() => {
            handleResetFilters();
            setMobileFilterOpen(false);
          }}
        />
      </Drawer>
    </Container>
  );
}
