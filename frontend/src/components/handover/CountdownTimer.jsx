import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';

export default function CountdownTimer({ targetDate, onExpire, label = 'Time Remaining' }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    if (!targetDate) return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    const difference = new Date(targetDate) - new Date();
    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return { hours, minutes, seconds, totalMs: difference };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);

      if (updated.totalMs <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const isUrgent = timeLeft.totalMs > 0 && timeLeft.hours < 4;
  const isExpired = timeLeft.totalMs <= 0;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: isExpired
          ? 'rgba(248, 81, 73, 0.1)'
          : isUrgent
          ? 'rgba(210, 153, 34, 0.12)'
          : '#161B22',
        border: `1px solid ${
          isExpired ? '#F85149' : isUrgent ? '#D29922' : '#30363D'
        }`,
        textAlign: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
        <AccessTimeFilledIcon
          sx={{
            fontSize: 18,
            color: isExpired ? '#F85149' : isUrgent ? '#D29922' : 'primary.light',
          }}
        />
        <Typography
          variant="caption"
          fontWeight={700}
          textTransform="uppercase"
          letterSpacing="0.05em"
          color={isExpired ? '#F85149' : isUrgent ? '#D29922' : 'text.secondary'}
        >
          {label}
        </Typography>
      </Box>

      {isExpired ? (
        <Typography variant="h6" fontWeight={800} color="#F85149">
          DEADLINE EXPIRED
        </Typography>
      ) : (
        <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color={isUrgent ? '#D29922' : '#58A6FF'}>
              {pad(timeLeft.hours)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              HOURS
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} color="text.secondary">
            :
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color={isUrgent ? '#D29922' : '#58A6FF'}>
              {pad(timeLeft.minutes)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              MINS
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} color="text.secondary">
            :
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color={isUrgent ? '#D29922' : '#58A6FF'}>
              {pad(timeLeft.seconds)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SECS
            </Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
