import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import notificationsApi from '../../services/notifications.api';
import { formatThaiDateTime, formatRelativeTimeThai } from '../../utils/date';
import { useNotification } from '../../contexts/NotificationContext';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { refetchUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0); // 0: All, 1: Unread
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [tabIndex]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (tabIndex === 1) {
        params.is_read = 'false';
      }
      const res = await notificationsApi.getNotifications(params);
      const items = res.data?.data?.notifications || res.data?.data || res.data?.notifications || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationsApi.markAllAsRead();
      fetchNotifications();
      if (refetchUnreadCount) refetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      if (refetchUnreadCount) refetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (refetchUnreadCount) refetchUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markAsRead(notif.id);
        if (refetchUnreadCount) refetchUnreadCount();
      } catch (err) {
        // ignore
      }
    }

    // Determine target link
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
    }
  };

  const getTypeIcon = (type) => {
    if (type?.includes('DISPUTE')) {
      return <GavelIcon sx={{ color: '#F85149' }} />;
    }
    if (type?.includes('HANDOVER') || type?.includes('CREDENTIAL')) {
      return <LockIcon sx={{ color: '#58A6FF' }} />;
    }
    if (type?.includes('ESCROW') || type?.includes('PAYMENT')) {
      return <SecurityIcon sx={{ color: '#3FB950' }} />;
    }
    if (type?.includes('ORDER')) {
      return <ShoppingCartIcon sx={{ color: '#D29922' }} />;
    }
    return <InfoOutlinedIcon sx={{ color: '#8B949E' }} />;
  };

  const getTypeBadgeColor = (type) => {
    if (type?.includes('DISPUTE')) return { bg: 'rgba(248,81,73,0.15)', color: '#F85149' };
    if (type?.includes('HANDOVER')) return { bg: 'rgba(56,139,253,0.15)', color: '#58A6FF' };
    if (type?.includes('ESCROW') || type?.includes('PAYMENT')) return { bg: 'rgba(63,185,80,0.15)', color: '#3FB950' };
    return { bg: '#21262D', color: '#8B949E' };
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NotificationsIcon sx={{ fontSize: 32, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ศูนย์การแจ้งเตือน
            </Typography>
            <Typography variant="body2" color="text.secondary">
              อัปเดตสถานะ Escrow, การส่งมอบไอดี, และความเคลื่อนไหวของระบบ
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<MarkEmailReadIcon />}
          onClick={handleMarkAllAsRead}
          disabled={actionLoading || notifications.length === 0}
          sx={{ borderColor: '#30363D', '&:hover': { borderColor: '#58A6FF' } }}
        >
          ทำเครื่องหมายว่าอ่านทั้งหมด
        </Button>
      </Box>

      {/* Filter Tabs */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': { color: 'text.secondary', fontWeight: 600 },
            '& .Mui-selected': { color: '#58A6FF' },
            '& .MuiTabs-indicator': { backgroundColor: '#58A6FF' },
          }}
        >
          <Tab label={`การแจ้งเตือนทั้งหมด (${notifications.length})`} />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ยังไม่ได้อ่าน
                {unreadCount > 0 && (
                  <Chip
                    label={unreadCount}
                    size="small"
                    sx={{ height: 20, bgcolor: '#1F6FEB', color: '#FFF', fontWeight: 700 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            กำลังโหลดการแจ้งเตือน...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : notifications.length === 0 ? (
        <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#3FB950', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="#F0F6FC">
            อ่านการแจ้งเตือนครบถ้วนแล้ว!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {tabIndex === 1
              ? 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่านในขณะนี้'
              : 'ยังไม่มีรายการแจ้งเตือน กิจกรรมคำสั่งซื้อและ Escrow จะแสดงที่นี่'}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((notif) => {
            const badge = getTypeBadgeColor(notif.type);
            const isUnread = !notif.is_read;

            return (
              <Card
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  bgcolor: isUnread ? '#1C2128' : '#161B22',
                  border: isUnread ? '1px solid #1F6FEB' : '1px solid #30363D',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#21262D',
                    borderColor: '#58A6FF',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Icon */}
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: '50%',
                        bgcolor: '#0D1117',
                        border: '1px solid #30363D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 0.5,
                      }}
                    >
                      {getTypeIcon(notif.type)}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={isUnread ? 800 : 600}
                          color={isUnread ? '#F0F6FC' : '#C9D1D9'}
                        >
                          {notif.title || notif.type?.replace(/_/g, ' ')}
                        </Typography>

                        {isUnread && (
                          <Chip
                            label="NEW"
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

                        <Chip
                          label={notif.type || 'SYSTEM'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: badge.bg,
                            color: badge.color,
                          }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {notif.message}
                      </Typography>

                      <Typography variant="caption" color="#8B949E">
                        {formatRelativeTimeThai(notif.created_at)} • {formatThaiDateTime(notif.created_at)}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={0.5} sx={{ alignSelf: 'center' }}>
                      {isUnread && (
                        <Tooltip title="ทำเครื่องหมายว่าอ่านแล้ว">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            sx={{ color: '#8B949E', '&:hover': { color: '#58A6FF' } }}
                          >
                            <MarkEmailReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="ลบการแจ้งเตือน">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(notif.id, e)}
                          sx={{ color: '#8B949E', '&:hover': { color: '#F85149' } }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
