import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Skeleton,
  Divider,
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockIcon from '@mui/icons-material/Lock';
import SpeedIcon from '@mui/icons-material/Speed';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import listingsApi from '../services/listings.api';
import ListingCard from '../components/listing/ListingCard';
import ValueBadge from '../components/common/ValueBadge';

export default function HomePage() {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await listingsApi.getListings({ limit: 6, sort: 'newest' });
        if (res?.success && Array.isArray(res.data)) {
          setFeaturedListings(res.data);
        }
      } catch (err) {
        console.error('Failed to load featured listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ color: 'primary.light', fontSize: 32 }} />,
      title: 'AI สแกนและประเมินราคาทีม',
      desc: 'ระบบ AI ตรวจจับการ์ดนักเตะ เกรดการ์ด และคำนวณช่วงราคาประเมินที่เป็นธรรมตามหลักคณิตศาสตร์อย่างแม่นยำ',
    },
    {
      icon: <SecurityIcon sx={{ color: 'secondary.main', fontSize: 32 }} />,
      title: 'ระบบคนกลาง Escrow ปลอดภัย 100%',
      desc: 'เงินของผู้ซื้อจะถูกเก็บรักษาอย่างปลอดภัยในระบบคนกลาง จนกว่าจะตรวจสอบและรับมอบไอดีเรียบร้อย',
    },
    {
      icon: <LockIcon sx={{ color: 'warning.main', fontSize: 32 }} />,
      title: 'ตู้นิรภัยส่งมอบรหัสผ่าน AES-256',
      desc: 'ห้องส่งมอบรหัสผ่านเข้ารหัสระดับสูง พร้อมระบบลบข้อมูลความลับอัตโนมัติทันทีที่การซื้อขายเสร็จสิ้น',
    },
    {
      icon: <SpeedIcon sx={{ color: 'info.main', fontSize: 32 }} />,
      title: 'ปลอดภัย ไร้การโกง พร้อมทีมไกล่เกลี่ย',
      desc: 'ระบบปล่อยเงินอัตโนมัติเมื่อครบ 48 ชม. พร้อมระบบไกล่เกลี่ยข้อพิพาทและประวัติ Audit Log โปร่งใส',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'สแกนทีมนักเตะด้วย AI',
      desc: 'ผู้ขายอัปโหลดภาพหน้าทีมนักเตะ ระบบ AI ตรวจจับการ์ดและประเมินราคากลางที่เหมาะสม',
    },
    {
      step: '02',
      title: 'ล็อกเงินในระบบ Escrow',
      desc: 'ผู้ซื้อสั่งซื้อและแนบสลิปโอนเงิน ยอดเงินจะถูกล็อกไว้ในระบบคนกลางอย่างปลอดภัย',
    },
    {
      step: '03',
      title: 'ส่งมอบรหัสผ่าน AES-256',
      desc: 'ผู้ขายกรอก Konami ID และรหัสผ่านในห้องส่งมอบที่เข้ารหัสปลอดภัยขั้นสูงสุด',
    },
    {
      step: '04',
      title: 'ตรวจสอบไอดีและปล่อยเงิน',
      desc: 'ผู้ซื้อตรวจสอบทีมนักเตะและเปลี่ยนรหัสผ่าน ระบบโอนเงินให้ผู้ขาย ปิดการขายโดยไร้ความเสี่ยง',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
          <Chip label="รองรับ eFootball 2025" color="primary" size="small" sx={{ fontWeight: 700 }} />
          <Chip label="ระบบ AI ประเมินราคาพร้อมใช้งาน" color="secondary" size="small" sx={{ fontWeight: 700 }} />
        </Stack>

        <Typography
          variant="h2"
          component="h1"
          fontWeight={900}
          sx={{
            background: 'linear-gradient(135deg, #F0F6FC 0%, #8B949E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            mb: 2,
            fontSize: { xs: '2.2rem', sm: '3rem', md: '3.75rem' },
          }}
        >
          ตลาดซื้อขายไอดี eFootball อัจฉริยะ & ระบบประเมินราคาทีม
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 760, mx: 'auto', mb: 4, fontWeight: 400, lineHeight: 1.6 }}
        >
          แพลตฟอร์มซื้อขายไอดี eFootball มือถือและคอนโซลที่น่าเชื่อถืออันดับ 1 ขับเคลื่อนด้วยระบบ AI ประเมินราคาทีมนักเตะ ระบบคนกลาง Escrow คุ้มครองเงิน และห้องส่งมอบรหัสผ่านเข้ารหัส AES-256 ปลอดภัย 100%
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            component={Link}
            to="/marketplace"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<StorefrontIcon />}
            sx={{ px: 4, py: 1.5, fontSize: '1rem', fontWeight: 700 }}
          >
            เลือกซื้อไอดีในตลาด
          </Button>
          <Button
            component={Link}
            to="/players"
            variant="outlined"
            color="inherit"
            size="large"
            startIcon={<SportsSoccerIcon />}
            sx={{ px: 4, py: 1.5, fontSize: '1rem', fontWeight: 600 }}
          >
            ค้นหาทำเนียบนักเตะ
          </Button>
        </Stack>
      </Box>

      {/* Featured Squad Listings Section */}
      <Box sx={{ mb: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="overline" color="primary.light" fontWeight={700} letterSpacing="0.1em">
              แค็ตตาล็อกไอดีพร้อมขาย
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              ไอดีทีมนักเตะแนะนำ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              รายการไอดีที่ผ่านการตรวจสอบ พร้อมระดับความคุ้มค่าราคาด้วยระบบ AI
            </Typography>
          </Box>

          <Button
            component={Link}
            to="/marketplace"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }}
          >
            ดูไอดีทั้งหมดในตลาด
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[...Array(3)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box sx={{ p: 2, bgcolor: '#161B22', borderRadius: 2, border: '1px solid #30363D' }}>
                  <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1, mb: 2 }} />
                  <Skeleton variant="text" height={28} width="80%" sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={16} width="50%" sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : featuredListings.length === 0 ? (
          <Card sx={{ bgcolor: '#161B22', border: '1px dashed #30363D', textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              ยังไม่มีรายการไอดีแนะนำในขณะนี้
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {featuredListings.map((listing) => (
              <Grid item xs={12} sm={6} md={4} key={listing.id}>
                <ListingCard listing={listing} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Value Badges Explanation Banner */}
      <Box
        sx={{
          p: { xs: 3, md: 5 },
          mb: 10,
          borderRadius: 3,
          bgcolor: '#161B22',
          border: '1px solid #30363D',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Typography variant="h5" fontWeight={800} color="#F0F6FC" gutterBottom>
          ระบบประเมินราคาทีมอัจฉริยะ — ป้ายบอกระดับความคุ้มค่า
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, mb: 4 }}>
          ไอดีทุกรายการในตลาดของเราผ่านการวิเคราะห์ด้วยระบบ AI Gemini Vision โดยคำนวณจากมูลค่าการ์ดนักเตะในทีมเปรียบเทียบกับราคาตั้งขาย เพื่อให้ได้ช่วงราคาประเมินที่เป็นธรรม:
        </Typography>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(35, 134, 54, 0.08)',
                border: '1px solid rgba(46, 160, 67, 0.3)',
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <ValueBadge badge="GREAT_VALUE" size="medium" showTooltip={false} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} color="#3FB950" gutterBottom>
                คุ้มค่ามาก (ต่ำกว่าราคาประเมิน)
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1.5} display="block">
                ผู้ขายตั้งราคาขายต่ำกว่ามูลค่าประเมินขั้นต่ำ เหมาะสำหรับผู้ที่มองหาไอดีราคาคุ้มค่าพิเศษ!
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(210, 153, 34, 0.08)',
                border: '1px solid rgba(210, 153, 34, 0.3)',
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <ValueBadge badge="FAIR_PRICE" size="medium" showTooltip={false} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} color="#D29922" gutterBottom>
                ราคาสมเหตุสมผล (อยู่ในช่วงราคาตลาด)
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1.5} display="block">
                ราคาตั้งขายอยู่ในช่วงราคากลางที่เหมาะสมตามเกรดการ์ด ความหายาก และพลังรวมของทีม
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(248, 81, 73, 0.08)',
                border: '1px solid rgba(248, 81, 73, 0.3)',
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <ValueBadge badge="OVERPRICED" size="medium" showTooltip={false} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} color="#F85149" gutterBottom>
                ราคาสูงกว่าราคาประเมิน
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1.5} display="block">
                ราคาตั้งขายสูงกว่ามูลค่าประเมินเฉลี่ย ผู้ซื้อสามารถตรวจสอบรายละเอียดการ์ดนักเตะก่อนตัดสินใจซื้อ
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* How It Works Workflow */}
      <Box sx={{ mb: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="overline" color="secondary.main" fontWeight={700} letterSpacing="0.1em">
            มาตรฐานการซื้อขายปลอดภัย
          </Typography>
          <Typography variant="h4" fontWeight={800} color="#F0F6FC">
            ขั้นตอนการทำงานของระบบ Escrow & การส่งมอบไอดี
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {workflowSteps.map((step, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ height: '100%', bgcolor: '#161B22', border: '1px solid #30363D' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight={900} color="primary.main" sx={{ opacity: 0.5, mb: 1 }}>
                    {step.step}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                    {step.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Feature Grid */}
      <Grid container spacing={3}>
        {features.map((f, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#161B22', border: '1px solid #30363D' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ mb: 2 }}>{f.icon}</Box>
                <Typography variant="h6" fontWeight={700} gutterBottom color="#F0F6FC">
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                  {f.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
