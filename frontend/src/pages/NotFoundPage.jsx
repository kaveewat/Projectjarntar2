import React from 'react';
import { Box, Typography, Button, Container, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function NotFoundPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
          <Typography variant="h3" fontWeight={800}>
            404
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Page Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The page or route you requested does not exist or has been moved.
          </Typography>
          <Button component={Link} to="/" variant="contained" color="primary" sx={{ mt: 2 }}>
            Return Home
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
