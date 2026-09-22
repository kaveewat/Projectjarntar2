import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Chip,
  Button,
  Container,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';

export default function HandoverLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0D1117',
        color: '#F0F6FC',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Handover Security Header */}
      <AppBar position="static" sx={{ bgcolor: '#161B22', borderBottom: '1px solid #30363D' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={Link}
              to="/orders"
              startIcon={<ArrowBackIcon />}
              color="inherit"
              size="small"
            >
              Back to Orders
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700}>
                Secure Handover Vault
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<SecurityIcon />}
              label="AES-256-GCM Encrypted"
              color="secondary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Security Banner */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Container maxWidth="md">
          <Alert
            severity="info"
            variant="outlined"
            icon={<SecurityIcon fontSize="inherit" />}
            sx={{
              borderColor: 'info.main',
              bgcolor: 'rgba(31, 111, 235, 0.08)',
              color: 'text.primary',
              '& .MuiAlert-icon': { color: 'info.main' },
            }}
          >
            <strong>Zero-Trust Secure Room:</strong> Account credentials are encrypted with AES-256-GCM in memory and database. All sensitive data will be permanently wiped upon buyer confirmation.
          </Alert>
        </Container>
      </Box>

      {/* Vault Main Viewport */}
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="md">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
