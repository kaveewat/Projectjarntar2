import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { label: 'หน้าแรก', path: '/' },
    { label: 'ตลาดซื้อขายไอดี', path: '/marketplace' },
    { label: 'ทำเนียบนักเตะ', path: '/players' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navigation Bar */}
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Brand Logo */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <SportsSoccerIcon sx={{ color: 'secondary.main', fontSize: 32 }} />
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                eFootball <Box component="span" sx={{ color: 'primary.main' }}>Market</Box>
              </Typography>
            </Box>

            {/* Desktop Navigation Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.path}
                  color={location.pathname === item.path ? 'primary' : 'inherit'}
                  sx={{
                    fontWeight: location.pathname === item.path ? 700 : 500,
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Auth Actions */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <Button
                    component={Link}
                    to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<DashboardIcon />}
                  >
                    แดชบอร์ด ({user?.display_name || user?.role})
                  </Button>
                  <Button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    color="inherit"
                    size="small"
                  >
                    ออกจากระบบ
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    color="inherit"
                    size="small"
                    startIcon={<LoginIcon />}
                  >
                    เข้าสู่ระบบ
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    สมัครสมาชิก
                  </Button>
                </>
              )}
            </Box>

            {/* Mobile Hamburger Menu Button */}
            <IconButton
              color="inherit"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260 },
        }}
      >
        <Box onClick={handleDrawerToggle} sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ my: 2 }}>
            eFootball Market
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {navItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton component={Link} to={item.path}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                component={Link}
                to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
                variant="outlined"
                fullWidth
              >
                แดชบอร์ด
              </Button>
              <Button onClick={logout} color="error" fullWidth>
                ออกจากระบบ
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button component={Link} to="/login" variant="outlined" fullWidth>
                เข้าสู่ระบบ
              </Button>
              <Button component={Link} to="/register" variant="contained" fullWidth>
                สมัครสมาชิก
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Main Page Body */}
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 } }}>
        <Outlet />
      </Box>

      {/* Public Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SportsSoccerIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
              <Typography variant="body2" color="text.secondary">
                © 2026 eFootball Smart Marketplace & Squad Valuation. All rights reserved.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography component={Link} to="/marketplace" variant="body2" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>
                ตลาดซื้อขายไอดี
              </Typography>
              <Typography component={Link} to="/players" variant="body2" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>
                ทำเนียบนักเตะ
              </Typography>
              <Typography component={Link} to="/login" variant="body2" color="text.secondary" sx={{ textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>
                เข้าสู่ระบบ
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
