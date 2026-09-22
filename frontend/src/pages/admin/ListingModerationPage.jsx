import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import adminApi from '../../services/admin.api';

export default function ListingModerationPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Dialog State
  const [selectedListing, setSelectedListing] = useState(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Confirm Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 50 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await adminApi.getListings(params);
      const items = res.data?.data?.items || res.data?.data?.listings || res.data?.data || [];
      setListings(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      await adminApi.suspendListing(selectedListing.id, suspendReason || 'Suspended by admin moderation');
      setSuspendDialogOpen(false);
      setSuspendReason('');
      setSelectedListing(null);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to suspend listing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (listing) => {
    if (!window.confirm(`Are you sure you want to restore Listing #${listing.id} to ACTIVE?`)) return;
    try {
      await adminApi.restoreListing(listing.id);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to restore listing');
    }
  };

  const handleDelete = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      await adminApi.deleteListing(selectedListing.id);
      setDeleteDialogOpen(false);
      setSelectedListing(null);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete listing');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter listings by search query (title or seller)
  const filteredListings = listings.filter((l) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = l.title?.toLowerCase().includes(query);
    const sellerMatch = l.seller_name?.toLowerCase().includes(query);
    const idMatch = String(l.id).includes(query);
    return titleMatch || sellerMatch || idMatch;
  });

  const getStatusChip = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Chip
            label="ACTIVE"
            size="small"
            sx={{ bgcolor: 'rgba(63, 185, 80, 0.2)', color: '#3FB950', fontWeight: 700 }}
          />
        );
      case 'RESERVED':
        return (
          <Chip
            label="RESERVED / ESCROW"
            size="small"
            sx={{ bgcolor: 'rgba(210, 153, 34, 0.2)', color: '#D29922', fontWeight: 700 }}
          />
        );
      case 'SOLD':
        return (
          <Chip
            label="SOLD"
            size="small"
            sx={{ bgcolor: 'rgba(56, 139, 253, 0.2)', color: '#58A6FF', fontWeight: 700 }}
          />
        );
      case 'SUSPENDED':
        return (
          <Chip
            label="SUSPENDED"
            size="small"
            sx={{ bgcolor: 'rgba(248, 81, 73, 0.2)', color: '#F85149', fontWeight: 700 }}
          />
        );
      default:
        return <Chip label={status || 'UNKNOWN'} size="small" />;
    }
  };

  // Quick stats
  const totalCount = listings.length;
  const activeCount = listings.filter((l) => l.status === 'ACTIVE').length;
  const reservedCount = listings.filter((l) => l.status === 'RESERVED').length;
  const suspendedCount = listings.filter((l) => l.status === 'SUSPENDED').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FormatListBulletedIcon sx={{ color: '#58A6FF', fontSize: 32 }} />
            <Typography variant="h4" fontWeight={800} color="#F0F6FC">
              Listing Moderation
            </Typography>
            <Chip label="CATALOG AUDIT" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Audit marketplace account listings, review suspicious postings, and manage suspension policies.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshIcon />}
          onClick={fetchListings}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>
                Total Catalog
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#F0F6FC" sx={{ mt: 0.5 }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #238636', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="#3FB950" textTransform="uppercase" fontWeight={700}>
                Active in Market
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#3FB950" sx={{ mt: 0.5 }}>
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #D29922', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="#D29922" textTransform="uppercase" fontWeight={700}>
                Reserved in Escrow
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#D29922" sx={{ mt: 0.5 }}>
                {reservedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #DA3633', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="#F85149" textTransform="uppercase" fontWeight={700}>
                Suspended / Flagged
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#F85149" sx={{ mt: 0.5 }}>
                {suspendedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Controls */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Tabs
            value={statusFilter}
            onChange={(e, val) => setStatusFilter(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ minHeight: 40 }}
          >
            <Tab label="All Listings" value="ALL" sx={{ fontWeight: 700, minHeight: 40 }} />
            <Tab label="Active" value="ACTIVE" sx={{ fontWeight: 700, minHeight: 40 }} />
            <Tab label="Reserved" value="RESERVED" sx={{ fontWeight: 700, minHeight: 40 }} />
            <Tab label="Sold" value="SOLD" sx={{ fontWeight: 700, minHeight: 40 }} />
            <Tab label="Suspended" value="SUSPENDED" sx={{ fontWeight: 700, minHeight: 40 }} />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search by title, seller or #ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 280 } }}
          />
        </Box>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Listings Table */}
      <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={44} />
          </Box>
        ) : filteredListings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No listings found matching the current filter.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#0D1117' }}>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Listing Title</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Seller</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Platform</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Team Strength</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow
                    key={listing.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#21262D !important' },
                      borderBottom: '1px solid #30363D',
                    }}
                  >
                    <TableCell sx={{ color: '#8B949E', fontWeight: 600 }}>
                      #{listing.id}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#F0F6FC">
                        {listing.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(listing.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="#F0F6FC">
                        {listing.seller_name || `Seller #${listing.seller_id}`}
                      </Typography>
                      {listing.seller_verified ? (
                        <Chip label="VERIFIED" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={listing.platform_name || 'Multi-platform'}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#8B949E', borderColor: '#30363D' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SportsSoccerIcon sx={{ fontSize: 16, color: '#58A6FF' }} />
                        <Typography variant="body2" fontWeight={700} color="#58A6FF">
                          {listing.team_strength ? Number(listing.team_strength).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="#F0F6FC">
                        ฿{Number(listing.asking_price).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(listing.status)}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {/* Open in Marketplace */}
                        <Tooltip title="View Marketplace Listing">
                          <IconButton
                            component={Link}
                            to={`/marketplace/${listing.id}`}
                            target="_blank"
                            size="small"
                            sx={{ color: '#58A6FF' }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Suspend Button */}
                        {listing.status !== 'SUSPENDED' && listing.status !== 'SOLD' && (
                          <Tooltip title="Suspend Listing">
                            <IconButton
                              size="small"
                              sx={{ color: '#F85149' }}
                              onClick={() => {
                                setSelectedListing(listing);
                                setSuspendDialogOpen(true);
                              }}
                            >
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Restore Button */}
                        {listing.status === 'SUSPENDED' && (
                          <Tooltip title="Restore to Active">
                            <IconButton
                              size="small"
                              sx={{ color: '#3FB950' }}
                              onClick={() => handleRestore(listing)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Delete Button */}
                        <Tooltip title="Delete Listing">
                          <IconButton
                            size="small"
                            sx={{ color: '#8B949E', '&:hover': { color: '#F85149' } }}
                            onClick={() => {
                              setSelectedListing(listing);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Suspend Confirmation Dialog */}
      <Dialog
        open={suspendDialogOpen}
        onClose={() => !actionLoading && setSuspendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#161B22', border: '1px solid #30363D' } }}
      >
        <DialogTitle sx={{ color: '#F85149', display: 'flex', alignItems: 'center', gap: 1 }}>
          <BlockIcon />
          Suspend Listing #{selectedListing?.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Suspending this listing will hide it from the marketplace and prevent buyers from placing orders.
          </Typography>
          <TextField
            fullWidth
            label="Suspension Reason"
            multiline
            rows={3}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="e.g. Inappropriate title, suspicious activity, pricing manipulation..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSuspendDialogOpen(false)} disabled={actionLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSuspend}
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <BlockIcon />}
          >
            Confirm Suspend
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !actionLoading && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#161B22', border: '1px solid #30363D' } }}
      >
        <DialogTitle sx={{ color: '#F85149', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon />
          Delete Listing #{selectedListing?.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete listing <strong>"{selectedListing?.title}"</strong>? This will soft-delete the record from the catalog.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={actionLoading}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
