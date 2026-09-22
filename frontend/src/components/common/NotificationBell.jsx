import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Button,
  Chip,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GavelIcon from '@mui/icons-material/Gavel';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNotification } from '../../contexts/NotificationContext';
import { formatRelativeTimeThai } from '../../utils/date';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, recentNotifications, markAsRead, markAllAsRead } = useNotification();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notif) => {
    handleClose();
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    // Target navigation
    if (notif.link) {
      navigate(notif.link);
      return;
    }

    if (notif.reference_type === 'ORDER' || notif.reference_type === 'ORDER_STATUS') {
      navigate(`/orders/${notif.reference_id}`);
    } else if (notif.reference_type === 'HANDOVER') {
      navigate(`/handover/${notif.reference_id}`);
    } else if (notif.reference_type === 'DISPUTE') {
      navigate(`/disputes/order/${notif.reference_id}`);
    } else if (notif.type?.includes('DISPUTE')) {
      navigate('/disputes');
    } else if (notif.type?.includes('ORDER') || notif.type?.includes('PAYMENT')) {
      navigate('/orders');
    } else {
      navigate('/notifications');
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

  const getTypeIcon = (type) => {
    if (type?.includes('DISPUTE')) {
      return <GavelIcon sx={{ color: '#F85149', fontSize: 20 }} />;
    }
    if (type?.includes('HANDOVER') || type?.includes('CREDENTIAL')) {
      return <LockIcon sx={{ color: '#58A6FF', fontSize: 20 }} />;
    }
    if (type?.includes('ESCROW') || type?.includes('PAYMENT')) {
      return <SecurityIcon sx={{ color: '#3FB950', fontSize: 20 }} />;
    }
    if (type?.includes('ORDER')) {
      return <ShoppingCartIcon sx={{ color: '#D29922', fontSize: 20 }} />;
    }
    return <InfoOutlinedIcon sx={{ color: '#8B949E', fontSize: 20 }} />;
  };

  return (
    <Box sx={{ display: 'inline-block' }}>
      <IconButton
        id="notification-bell-btn"
        color="inherit"
        onClick={handleClick}
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          color: unreadCount > 0 ? '#58A6FF' : 'text.secondary',
          '&:hover': { color: 'text.primary', bgcolor: 'rgba(255,255,255,0.05)' },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 700,
              fontSize: '0.68rem',
              height: 18,
              minWidth: 18,
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 360,
            maxWidth: '90vw',
            maxHeight: 480,
            bgcolor: '#161B22',
            border: '1px solid #30363D',
            borderRadius: 2,
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            mt: 1,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0D1117',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#F0F6FC">
              การแจ้งเตือน
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor: '#1F6FEB',
                  color: '#FFF',
                }}
              />
            )}
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />}
              onClick={() => markAllAsRead()}
              sx={{
                fontSize: '0.72rem',
                textTransform: 'none',
                color: '#58A6FF',
                p: 0,
                minWidth: 'auto',
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              อ่านทั้งหมดแล้ว
            </Button>
          )}
        </Box>
        <Divider sx={{ borderColor: '#30363D' }} />

        {/* List of Recent Items */}
        <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {recentNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ไม่มีการแจ้งเตือนในขณะนี้
              </Typography>
            </Box>
          ) : (
            recentNotifications.map((notif) => {
              const isUnread = !notif.is_read;
              return (
                <MenuItem
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    py: 1.2,
                    px: 2,
                    bgcolor: isUnread ? 'rgba(31, 111, 235, 0.08)' : 'transparent',
                    borderBottom: '1px solid rgba(48, 54, 61, 0.5)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    whiteSpace: 'normal',
                    '&:hover': {
                      bgcolor: isUnread ? 'rgba(31, 111, 235, 0.14)' : 'rgba(255,255,255,0.04)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}>
                    {getTypeIcon(notif.type)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={isUnread ? 700 : 500}
                          color={isUnread ? '#F0F6FC' : '#C9D1D9'}
                          noWrap
                          sx={{ flex: 1 }}
                        >
                          {notif.title || notif.type?.replace(/_/g, ' ')}
                        </Typography>
                        {isUnread && (
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              bgcolor: '#58A6FF',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.2 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '0.75rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="#8B949E" sx={{ fontSize: '0.68rem', mt: 0.2, display: 'block' }}>
                          {formatRelativeTimeThai(notif.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </MenuItem>
              );
            })
          )}
        </Box>

        {/* Footer */}
        <Divider sx={{ borderColor: '#30363D' }} />
        <Box sx={{ p: 1, bgcolor: '#0D1117', textAlign: 'center' }}>
          <Button
            fullWidth
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={handleViewAll}
            sx={{
              color: '#58A6FF',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(88, 166, 255, 0.08)' },
            }}
          >
            ดูการแจ้งเตือนทั้งหมด
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}
