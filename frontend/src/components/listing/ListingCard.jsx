import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AndroidIcon from '@mui/icons-material/Android';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ComputerIcon from '@mui/icons-material/Computer';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Helper for platform icon
function getPlatformIcon(platformSlug) {
  switch (platformSlug) {
    case 'ios':
      return <PhoneIphoneIcon sx={{ fontSize: 14 }} />;
    case 'android':
      return <AndroidIcon sx={{ fontSize: 14 }} />;
    case 'playstation':
      return <SportsEsportsIcon sx={{ fontSize: 14 }} />;
    case 'pc':
      return <ComputerIcon sx={{ fontSize: 14 }} />;
    default:
      return <SportsEsportsIcon sx={{ fontSize: 14 }} />;
  }
}

export default function ListingCard({ listing }) {
  if (!listing) return null;

  const {
    id,
    title,
    asking_price,
    fair_price_min,
    fair_price_max,
    value_badge,
    team_strength,
    seller_name,
    seller_verified,
    platform_name,
    platform_slug,
    squad_images,
    featured_players,
    view_count = 0,
    status = 'ACTIVE',
  } = listing;

  const [imgError, setImgError] = useState(false);

  const squadImg =
    Array.isArray(squad_images) && squad_images.length > 0 ? squad_images[0] : null;

  // Format featured players into array of chips (max 3)
  const rarePlayersList = featured_players
    ? featured_players
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const strengthPercent = team_strength
    ? Math.min(100, Math.max(0, ((team_strength - 2400) / (3250 - 2400)) * 100))
    : 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        bgcolor: '#161B22',
        border: '1px solid #30363D',
        transition: 'all 0.25s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
          boxShadow: '0 8px 24px rgba(31, 111, 235, 0.18)',
        },
      }}
    >
      {/* Squad Image / Banner */}
      <Box sx={{ position: 'relative', height: 160, bgcolor: '#0D1117', overflow: 'hidden' }}>
        {squadImg && !imgError ? (
          <CardMedia
            component="img"
            image={squadImg}
            alt={title}
            onError={() => setImgError(true)}
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.9)',
            }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(ellipse at center, #1F6FEB22 0%, #0D1117 80%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              color: 'text.secondary',
              gap: 0.75,
            }}
          >
            <SportsSoccerIcon sx={{ fontSize: 44, color: 'rgba(88, 166, 255, 0.6)' }} />
            <Typography variant="caption" sx={{ color: '#8B949E', fontWeight: 600, letterSpacing: '0.05em' }}>
              eFootball Squad Roster
            </Typography>
          </Box>
        )}

        {/* Overlay Badges */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Platform Chip */}
          <Chip
            icon={getPlatformIcon(platform_slug)}
            label={platform_name || 'All'}
            size="small"
            sx={{
              bgcolor: 'rgba(13, 17, 23, 0.85)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F0F6FC',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />

          {/* Right Badges */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {status === 'RESERVED' && (
              <Chip
                label="RESERVED"
                size="small"
                color="warning"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 22,
                }}
              />
            )}
            {status === 'SOLD' && (
              <Chip
                label="SOLD"
                size="small"
                sx={{
                  bgcolor: '#30363D',
                  color: '#8B949E',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 22,
                }}
              />
            )}
          </Box>
        </Box>

        {/* View Count Badge */}
        {view_count > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            <VisibilityIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {view_count}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Card Content */}
      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
        {/* Title */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            color: '#F0F6FC',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
            mb: 1,
          }}
          title={title}
        >
          {title}
        </Typography>

        {/* Team Strength Bar */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Team Strength
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary.light">
              {team_strength ? team_strength.toLocaleString() : 'N/A'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={strengthPercent || 50}
            sx={{
              height: 5,
              borderRadius: 3,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor:
                  team_strength >= 3100
                    ? '#00E5FF'
                    : team_strength >= 3000
                    ? 'primary.main'
                    : 'warning.main',
              },
            }}
          />
        </Box>

        {/* Rare Players Chips */}
        {rarePlayersList.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Featured Cards:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
              {rarePlayersList.map((playerName, idx) => (
                <Chip
                  key={idx}
                  label={playerName}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 22,
                    borderColor: 'rgba(31, 111, 235, 0.4)',
                    color: '#C9D1D9',
                    bgcolor: 'rgba(31, 111, 235, 0.08)',
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>

      {/* Card Footer */}
      <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
          {/* Price */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Asking Price
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#58A6FF', lineHeight: 1.1 }}>
              ฿{Number(asking_price).toLocaleString()}
            </Typography>
          </Box>

          {/* Seller Tag */}
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {seller_name || 'Seller'}
              </Typography>
              {seller_verified ? (
                <Tooltip title="Verified Seller" arrow>
                  <VerifiedIcon sx={{ fontSize: 14, color: 'primary.light' }} />
                </Tooltip>
              ) : null}
            </Box>
          </Box>
        </Box>

        {/* Action Button */}
        <Button
          component={Link}
          to={`/marketplace/${id}`}
          variant="contained"
          color="primary"
          fullWidth
          size="small"
          endIcon={<ArrowForwardIcon />}
          sx={{
            py: 0.8,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.85rem',
          }}
        >
          View Squad & Details
        </Button>
      </Box>
    </Card>
  );
}
