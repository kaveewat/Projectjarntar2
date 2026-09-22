import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingOverlay({ message = 'Loading...', fullScreen = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        ...(fullScreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              bgcolor: 'rgba(13, 17, 23, 0.85)',
              zIndex: 9999,
            }
          : {
              minHeight: '200px',
              width: '100%',
            }),
      }}
    >
      <CircularProgress color="primary" size={48} thickness={4} />
      {message && (
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
