import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Button,
  Chip,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StoreIcon from '@mui/icons-material/Store';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ListAltIcon from '@mui/icons-material/ListAlt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 260;

export default function UserLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const buyerNav = [
    { label: 'แดชบอร์ดผู้ซื้อ', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'คำสั่งซื้อของฉัน', path: '/orders', icon: <ShoppingBagIcon /> },
    { label: 'การแจ้งเตือน', path: '/notifications', icon: <NotificationsIcon /> },
  ];

  const sellerNav = [
    { label: 'แดชบอร์ดผู้ขาย', path: '/seller/dashboard', icon: <StoreIcon /> },
    { label: 'รายการประกาศของฉัน', path: '/seller/listings', icon: <ListAltIcon /> },
    { label: 'ลงขายไอดีใหม่', path: '/seller/listings/new', icon: <AddPhotoAlternateIcon /> },
    { label: 'คำสั่งซื้อร้านค้า', path: '/seller/orders', icon: <ShoppingBagIcon /> },
    { label: 'ยืนยันตัวตน KYC', path: '/seller/kyc', icon: <VerifiedUserIcon /> },
    { label: 'ประวัติการรับเงิน', path: '/seller/payouts', icon: <AccountBalanceWalletIcon /> },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
        <SportsSoccerIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          User Portal
        </Typography>
        <Chip
          label={user?.role || 'USER'}
          size="small"
          color={user?.role?.includes('SELLER') ? 'secondary' : 'primary'}
          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
        />
      </Toolbar>
      <Divider />

      {/* Navigation Groups */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {/* Buyer Section */}
        <List
          subheader={
            <ListSubheader sx={{ bgcolor: 'transparent', color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Buyer Hub
            </ListSubheader>
          }
        >
          {buyerNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1, my: 0.2 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={active}
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: active ? 'rgba(31, 111, 235, 0.15) !important' : 'transparent',
                    color: active ? 'primary.main' : 'text.primary',
                  }}
                >
                  <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Seller Section */}
        <List
          subheader={
            <ListSubheader sx={{ bgcolor: 'transparent', color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Seller Hub
            </ListSubheader>
          }
        >
          {sellerNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1, my: 0.2 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={active}
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: active ? 'rgba(35, 134, 54, 0.15) !important' : 'transparent',
                    color: active ? 'secondary.main' : 'text.primary',
                  }}
                >
                  <ListItemIcon sx={{ color: active ? 'secondary.main' : 'text.secondary', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Settings */}
        <List>
          <ListItem disablePadding sx={{ px: 1 }}>
            <ListItemButton
              component={Link}
              to="/profile"
              selected={location.pathname === '/profile'}
              sx={{ borderRadius: 1.5 }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Account Profile" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Bottom User Card */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.default' }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 700 }}>
          {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {user?.display_name || 'Logged In User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email || ''}
          </Typography>
        </Box>
        <IconButton
          size="small"
          color="error"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          title="Sign out"
        >
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Header */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Button
              component={Link}
              to="/marketplace"
              size="small"
              startIcon={<StorefrontIcon />}
              color="inherit"
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              เลือกซื้อไอดีในตลาด
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NotificationBell />
            <Button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              variant="outlined"
              color="inherit"
              size="small"
            >
              ออกจากระบบ
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
