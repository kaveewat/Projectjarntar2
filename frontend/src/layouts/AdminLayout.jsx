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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GavelIcon from '@mui/icons-material/Gavel';
import PaymentsIcon from '@mui/icons-material/Payments';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_DRAWER_WIDTH = 270;

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navGroups = [
    {
      title: 'การดำเนินงาน (Operations)',
      items: [
        { label: 'แดชบอร์ดผู้บริหาร', path: '/admin', icon: <DashboardIcon /> },
        { label: 'จัดการรายชื่อผู้ใช้', path: '/admin/users', icon: <PeopleIcon /> },
        { label: 'ตรวจสอบยืนยันตัวตน KYC', path: '/admin/kyc', icon: <VerifiedUserIcon /> },
        { label: 'ตรวจสอบรายการประกาศ', path: '/admin/listings', icon: <FormatListBulletedIcon /> },
      ],
    },
    {
      title: 'การเงินและ Escrow (Finance)',
      items: [
        { label: 'คำสั่งซื้อและสลิปชำระเงิน', path: '/admin/orders', icon: <ShoppingCartIcon /> },
        { label: 'ตู้นิรภัย Escrow Vault', path: '/admin/escrow', icon: <AccountBalanceIcon /> },
        { label: 'ศูนย์ไกล่เกลี่ยข้อพิพาท', path: '/admin/disputes', icon: <GavelIcon /> },
        { label: 'รายการโอนเงินผู้ขาย', path: '/admin/payouts', icon: <PaymentsIcon /> },
      ],
    },
    {
      title: 'ระบบและข้อมูลวิเคราะห์ (System)',
      items: [
        { label: 'ฐานข้อมูลการ์ดนักเตะ', path: '/admin/players', icon: <SportsSoccerIcon /> },
        { label: 'สถิติและภาพรวมระบบ', path: '/admin/analytics', icon: <BarChartIcon /> },
        { label: 'บันทึกประวัติ Audit Logs', path: '/admin/audit-logs', icon: <HistoryIcon /> },
        { label: 'ตั้งค่าระบบแพลตฟอร์ม', path: '/admin/settings', icon: <SettingsIcon /> },
      ],
    },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
        <AdminPanelSettingsIcon sx={{ color: 'error.main', fontSize: 28 }} />
        <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1, letterSpacing: -0.5 }}>
          Admin Console
        </Typography>
        <Chip label="ADMIN" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
      </Toolbar>
      <Divider />

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {navGroups.map((group) => (
          <List
            key={group.title}
            subheader={
              <ListSubheader sx={{ bgcolor: 'transparent', color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                {group.title}
              </ListSubheader>
            }
          >
            {group.items.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ px: 1, my: 0.2 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={active}
                    sx={{
                      borderRadius: 1.5,
                      bgcolor: active ? 'rgba(248, 81, 73, 0.15) !important' : 'transparent',
                      color: active ? 'error.light' : 'text.primary',
                    }}
                  >
                    <ListItemIcon sx={{ color: active ? 'error.light' : 'text.secondary', minWidth: 38 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 600 : 500 }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ))}
      </Box>

      {/* Admin User Footer */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.default' }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'error.dark', fontWeight: 700 }}>
          {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'A'}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {user?.display_name || 'Super Admin'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email || 'admin@efootball-market.com'}
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
          width: { md: `calc(100% - ${ADMIN_DRAWER_WIDTH}px)` },
          ml: { md: `${ADMIN_DRAWER_WIDTH}px` },
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
              to="/"
              size="small"
              startIcon={<StorefrontIcon />}
              color="inherit"
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              กลับหน้าร้านค้าหลัก
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label="ระบบตรวจสอบ Audit ทำงานปกติ"
              color="success"
              size="small"
              variant="outlined"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            />
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
        sx={{ width: { md: ADMIN_DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: ADMIN_DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: ADMIN_DRAWER_WIDTH },
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
          width: { md: `calc(100% - ${ADMIN_DRAWER_WIDTH}px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
