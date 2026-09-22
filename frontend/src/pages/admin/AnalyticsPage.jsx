import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RefreshIcon from '@mui/icons-material/Refresh';
import adminApi from '../../services/admin.api';

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSalesAnalytics();
      setSalesData(res.data?.data || res.data || {});
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังประมวลผลสถิติและข้อมูลมูลค่าธุรกรรมรวม (GMV)...
        </Typography>
      </Container>
    );
  }

  const totalVolume = salesData?.total_volume || 0;
  const totalRevenue = salesData?.platform_revenue || 0;
  const totalOrders = salesData?.total_orders || 0;
  const avgOrderValue = salesData?.avg_order_value || 0;
  const timeline = salesData?.timeline || [];

  // Find max volume for scaling chart
  const maxVolume = Math.max(...timeline.map((t) => t.volume || 0), 1000);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BarChartIcon sx={{ fontSize: 32, color: '#58A6FF' }} />
          <Box>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              สถิติแพลตฟอร์มและการวิเคราะห์ธุรกรรม (Analytics & GMV)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ผลประกอบการรายได้แบบเรียลไทม์ แนวโน้มมูลค่าธุรกรรมรายวัน และยอดเฉลี่ยต่อคำสั่งซื้อ
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshIcon />}
          onClick={fetchAnalytics}
          sx={{ borderColor: '#30363D' }}
        >
          รีเฟรชข้อมูลสถิติ
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  มูลค่าธุรกรรมรวม (GMV)
                </Typography>
                <TrendingUpIcon sx={{ color: '#3FB950', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#3FB950">
                ฿{Number(totalVolume).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ยอดขายคำสั่งซื้อที่เสร็จสมบูรณ์ทั้งหมด
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  รายได้ค่าธรรมเนียมระบบ (Net)
                </Typography>
                <AttachMoneyIcon sx={{ color: '#58A6FF', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#58A6FF">
                ฿{Number(totalRevenue).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                รายได้จากค่าบริการ Escrow 5%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  ธุรกรรมที่สำเร็จ
                </Typography>
                <ShoppingBagIcon sx={{ color: '#D29922', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#F0F6FC">
                {Number(totalOrders).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ส่งมอบไอดีและปิดการขายเรียบร้อย
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                  มูลค่าเฉลี่ยต่อคำสั่งซื้อ (AOV)
                </Typography>
                <AttachMoneyIcon sx={{ color: '#8B949E', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} color="#C9D1D9">
                ฿{Number(avgOrderValue).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ราคาเฉลี่ยต่อการซื้อขายไอดี
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* GMV Trend Visual Chart (15.10 Requirement) */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 4, p: 3 }}>
        <Typography variant="h6" fontWeight={800} color="#F0F6FC" gutterBottom>
          แนวโน้มมูลค่าธุรกรรมรวม (GMV Trend)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          มูลค่าการซื้อขายที่เสร็จสมบูรณ์รายวันและอัตราการเติบโตของธุรกรรม
        </Typography>

        {timeline.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              ยังไม่มีประวัติยอดขายที่เสร็จสมบูรณ์ เมื่อมีคำสั่งซื้อที่ส่งมอบสำเร็จ กราฟแท่ง GMV รายวันจะแสดงที่นี่
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', overflowX: 'auto', pt: 2, pb: 1 }}>
            <Box sx={{ minWidth: 600, height: 260, display: 'flex', alignItems: 'flex-end', gap: 2, px: 2 }}>
              {timeline.map((item, idx) => {
                const barHeight = Math.max(12, Math.round((item.volume / maxVolume) * 200));
                return (
                  <Box
                    key={idx}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" fontWeight={700} color="#58A6FF" sx={{ fontSize: '0.72rem' }}>
                      ฿{Number(item.volume).toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: 48,
                        height: `${barHeight}px`,
                        borderRadius: '4px 4px 0 0',
                        background: 'linear-gradient(180deg, #1F6FEB 0%, #1158C7 100%)',
                        boxShadow: '0 0 10px rgba(31, 111, 235, 0.4)',
                        transition: 'height 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(180deg, #58A6FF 0%, #1F6FEB 100%)',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : `วันที่ ${idx + 1}`}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Card>
    </Container>
  );
}
