import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
  Stack,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export default function ListingFilterPanel({
  filters,
  onFilterChange,
  onResetFilters,
  platforms = [],
}) {
  const [localPlayerName, setLocalPlayerName] = useState(filters.player_name || '');
  const [priceRange, setPriceRange] = useState([
    filters.min_price ? Number(filters.min_price) : 0,
    filters.max_price ? Number(filters.max_price) : 50000,
  ]);

  // Sync state if external filters change
  useEffect(() => {
    setLocalPlayerName(filters.player_name || '');
    setPriceRange([
      filters.min_price ? Number(filters.min_price) : 0,
      filters.max_price ? Number(filters.max_price) : 50000,
    ]);
  }, [filters]);

  const handlePlayerNameSubmit = (e) => {
    if (e.key === 'Enter') {
      onFilterChange({ player_name: localPlayerName });
    }
  };

  const handlePriceSliderChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handlePriceSliderCommitted = (event, newValue) => {
    onFilterChange({
      min_price: newValue[0] > 0 ? newValue[0] : undefined,
      max_price: newValue[1] < 50000 ? newValue[1] : undefined,
    });
  };

  const setPricePreset = (min, max) => {
    setPriceRange([min, max]);
    onFilterChange({ min_price: min, max_price: max });
  };

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: '#161B22',
        borderRadius: 2,
        border: '1px solid #30363D',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterAltIcon sx={{ color: 'primary.light', fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
            ตัวกรองรายการไอดี
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={onResetFilters}
          sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}
        >
          ล้างค่า
        </Button>
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: '#30363D' }} />

      {/* 1. Search by Player Name */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
          ค้นหาตามชื่อนักเตะ
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="เช่น Messi, Mbappe, Gullit"
          value={localPlayerName}
          onChange={(e) => setLocalPlayerName(e.target.value)}
          onKeyDown={handlePlayerNameSubmit}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: localPlayerName ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    setLocalPlayerName('');
                    onFilterChange({ player_name: undefined });
                  }}
                >
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          fullWidth
          onClick={() => onFilterChange({ player_name: localPlayerName })}
          sx={{ mt: 1, textTransform: 'none', fontSize: '0.75rem' }}
        >
          ค้นหา
        </Button>

        {/* 2-Booster Quick Filter */}
        <Box sx={{ mt: 1.5 }}>
          <Chip
            label="⚡ มีการ์ด 2 บูสต์ (Double Booster)"
            size="small"
            clickable
            variant={filters.has_double_booster ? 'filled' : 'outlined'}
            onClick={() =>
              onFilterChange({
                has_double_booster: filters.has_double_booster ? undefined : 'true',
              })
            }
            sx={{
              width: '100%',
              justifyContent: 'center',
              py: 2,
              fontWeight: 700,
              fontSize: '0.78rem',
              bgcolor: filters.has_double_booster ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: filters.has_double_booster ? '#F59E0B' : 'rgba(245, 158, 11, 0.45)',
              color: filters.has_double_booster ? '#FBBF24' : '#F59E0B',
              boxShadow: filters.has_double_booster ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
              '&:hover': {
                bgcolor: 'rgba(245, 158, 11, 0.2)',
                borderColor: '#F59E0B',
              },
            }}
          />
        </Box>
      </Box>

      {/* 2. Value-for-Money Badges */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
          ระดับความคุ้มค่า AI
        </Typography>
        <RadioGroup
          value={filters.badge || ''}
          onChange={(e) => onFilterChange({ badge: e.target.value || undefined })}
        >
          <FormControlLabel
            value=""
            control={<Radio size="small" />}
            label={<Typography variant="body2">ทั้งหมด</Typography>}
          />
          <FormControlLabel
            value="GREAT_VALUE"
            control={<Radio size="small" color="success" />}
            label={<Typography variant="body2">🟢 คุ้มค่ามาก (Great Value)</Typography>}
          />
          <FormControlLabel
            value="FAIR_PRICE"
            control={<Radio size="small" color="warning" />}
            label={<Typography variant="body2">🟡 ราคาสมเหตุสมผล (Fair Price)</Typography>}
          />
          <FormControlLabel
            value="OVERPRICED"
            control={<Radio size="small" color="error" />}
            label={<Typography variant="body2">🔴 สูงกว่าราคาประเมิน (Overpriced)</Typography>}
          />
        </RadioGroup>
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: '#30363D' }} />

      {/* 3. Price Range (THB) */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            ช่วงราคา (บาท)
          </Typography>
          <Typography variant="caption" color="primary.light" fontWeight={700}>
            ฿{priceRange[0].toLocaleString()} – ฿{priceRange[1] >= 50000 ? '50,000+' : priceRange[1].toLocaleString()}
          </Typography>
        </Box>

        <Slider
          value={priceRange}
          min={0}
          max={50000}
          step={500}
          onChange={handlePriceSliderChange}
          onChangeCommitted={handlePriceSliderCommitted}
          valueLabelDisplay="auto"
          sx={{ color: 'primary.main', mb: 1 }}
        />

        {/* Quick Presets */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
          <Chip
            label="ต่ำกว่า ฿1k"
            size="small"
            clickable
            variant="outlined"
            onClick={() => setPricePreset(0, 1000)}
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip
            label="฿500–฿2,000"
            size="small"
            clickable
            variant="outlined"
            color="primary"
            onClick={() => setPricePreset(500, 2000)}
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip
            label="฿2k–฿5k"
            size="small"
            clickable
            variant="outlined"
            onClick={() => setPricePreset(2000, 5000)}
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip
            label="฿5k+"
            size="small"
            clickable
            variant="outlined"
            onClick={() => setPricePreset(5000, 50000)}
            sx={{ fontSize: '0.7rem' }}
          />
        </Stack>
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: '#30363D' }} />

      {/* 4. Gaming Platform */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="platform-filter-label">แพลตฟอร์มเกม</InputLabel>
          <Select
            labelId="platform-filter-label"
            value={filters.platform_id || ''}
            label="แพลตฟอร์มเกม"
            onChange={(e) => onFilterChange({ platform_id: e.target.value || undefined })}
          >
            <MenuItem value="">
              <em>ทุกแพลตฟอร์ม</em>
            </MenuItem>
            <MenuItem value="1">iOS (Apple iPhone / iPad)</MenuItem>
            <MenuItem value="2">Android</MenuItem>
            <MenuItem value="3">PlayStation 4 / 5</MenuItem>
            <MenuItem value="4">PC (Steam)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 5. Team Strength Minimum */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            พลังทีมขั้นต่ำ (Team Strength)
          </Typography>
          <Typography variant="caption" color="primary.light" fontWeight={700}>
            {filters.min_strength ? `${filters.min_strength}+` : 'ไม่จำกัด'}
          </Typography>
        </Box>

        <Slider
          value={filters.min_strength ? Number(filters.min_strength) : 2400}
          min={2400}
          max={3200}
          step={50}
          onChange={(e, val) => onFilterChange({ min_strength: val > 2400 ? val : undefined })}
          valueLabelDisplay="auto"
          sx={{ color: 'secondary.main' }}
        />

        <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
          {[2800, 3000, 3100].map((val) => (
            <Chip
              key={val}
              label={`${val}+`}
              size="small"
              clickable
              variant={filters.min_strength === val ? 'filled' : 'outlined'}
              color="secondary"
              onClick={() =>
                onFilterChange({
                  min_strength: filters.min_strength === val ? undefined : val,
                })
              }
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
