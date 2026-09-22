import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Button,
  Alert,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import scansApi from '../../services/scans.api';

const POLLING_INTERVAL_MS = 3000;

export default function ScanProgress({ scanId, onComplete, onRetry }) {
  const [status, setStatus] = useState('PROCESSING');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const pollTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);

  useEffect(() => {
    if (!scanId) return;

    // Timer for elapsed seconds display
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Polling function
    const checkScanStatus = async () => {
      try {
        const res = await scansApi.getScanResult(scanId);
        if (res?.success && res.data?.scan) {
          const scan = res.data.scan;
          setStatus(scan.status);

          if (scan.status === 'COMPLETED') {
            clearInterval(pollTimerRef.current);
            clearInterval(elapsedTimerRef.current);
            if (onComplete) {
              onComplete(res.data);
            }
          } else if (scan.status === 'FAILED') {
            clearInterval(pollTimerRef.current);
            clearInterval(elapsedTimerRef.current);
            setErrorMsg(scan.error_message || 'AI Squad scan failed. Please try again with clearer screenshots.');
          }
        }
      } catch (err) {
        console.error('Error polling scan status:', err);
        // Do not immediately fail on network jitter, let it retry on next interval
      }
    };

    // First check immediately, then poll every 3 seconds
    checkScanStatus();
    pollTimerRef.current = setInterval(checkScanStatus, POLLING_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [scanId, onComplete]);

  if (status === 'FAILED') {
    return (
      <Card sx={{ bgcolor: '#161B22', border: '1px solid rgba(248, 81, 73, 0.4)', p: 3, textAlign: 'center' }}>
        <CardContent>
          <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
            AI Squad Scan Failed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            {errorMsg || 'We were unable to process the uploaded squad images. Please verify that the screenshots clearly show the player roster.'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReplayIcon />}
            onClick={onRetry}
            sx={{ fontWeight: 700 }}
          >
            Try Again / Re-upload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        bgcolor: '#161B22',
        border: '1px solid #30363D',
        borderRadius: 2,
        p: { xs: 3, md: 5 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #1F6FEB, #00E5FF, #1F6FEB)',
        }}
      />

      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
        <CircularProgress size={80} thickness={3} sx={{ color: 'primary.main' }} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 32, color: 'primary.light' }} />
        </Box>
      </Box>

      <Typography variant="h5" fontWeight={800} color="#F0F6FC" gutterBottom>
        กำลังประมวลผลข้อมูลทีม...
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
        ระบบกำลังจัดเตรียมโครงสร้างข้อมูลทีมและนักเตะ กรุณารอสักครู่
      </Typography>

      <Box sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
        <LinearProgress
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #1F6FEB 0%, #00E5FF 100%)',
            },
          }}
        />
      </Box>

      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Elapsed Time: <strong>{elapsedSeconds}s</strong>
        </Typography>
        <Typography variant="caption" color="text.disabled">
          •
        </Typography>
        <Typography variant="caption" color="primary.light">
          Polling status every 3s
        </Typography>
      </Stack>
    </Card>
  );
}
