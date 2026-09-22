import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

export default function PagePlaceholder({
  title = 'Page Placeholder',
  category = 'General',
  description = 'This view is registered in the routing table and scheduled for implementation.',
  phase = 'Phase 10 Foundation',
}) {
  const location = useLocation();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Card sx={{ p: 2, textAlign: 'center' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip label={category} color="primary" size="small" variant="outlined" />
            <Chip label={phase} color="secondary" size="small" />
          </Box>

          <Typography variant="h4" component="h1" fontWeight={700} color="text.primary">
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
            {description}
          </Typography>

          <Box
            sx={{
              p: 1.5,
              bgcolor: 'background.default',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              width: '100%',
              maxWidth: 480,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              Route Path: {location.pathname}
            </Typography>
          </Box>

          <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
            <Button component={Link} to="/" variant="outlined" size="small">
              Back to Home
            </Button>
            <Button component={Link} to="/marketplace" variant="contained" size="small">
              Explore Marketplace
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
