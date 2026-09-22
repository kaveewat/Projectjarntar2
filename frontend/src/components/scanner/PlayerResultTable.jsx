import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const POSITIONS = ['CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'];
const TIERS = [
  { name: 'Big Time', color: '#FF1744' },
  { name: 'Epic', color: '#FFD700' },
  { name: 'Show Time', color: '#00E5FF' },
  { name: 'Highlight', color: '#B388FF' },
  { name: 'Standard', color: '#8B949E' },
];

export default function PlayerResultTable({ players = [], onPlayersChange }) {
  const handleFieldChange = (index, field, value) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    onPlayersChange(updated);
  };

  const handleAddPlayer = () => {
    const newPlayer = {
      id: Date.now(),
      player_name: '',
      position_code: 'CF',
      tier_name: 'Standard',
      overall_rating: 90,
      confidence_score: 1.0,
      is_confirmed: true,
      display_color: '#8B949E',
    };
    onPlayersChange([...players, newPlayer]);
  };

  const handleRemovePlayer = (index) => {
    const updated = players.filter((_, idx) => idx !== index);
    onPlayersChange(updated);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.light', fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
            AI Detected Players ({players.length} Cards)
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleAddPlayer}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add Missing Card
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Review detected player cards below. You can edit names, positions, and ratings to match your squad before valuation calculation.
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          bgcolor: '#0D1117',
          border: '1px solid #30363D',
          borderRadius: 2,
          maxHeight: 460,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: '#161B22', color: '#8B949E', fontWeight: 700 } }}>
              <TableCell sx={{ width: 60 }}>POS</TableCell>
              <TableCell>Player Name</TableCell>
              <TableCell sx={{ width: 100 }}>OVR</TableCell>
              <TableCell sx={{ width: 140 }}>Card Tier</TableCell>
              <TableCell sx={{ width: 110 }}>Confidence</TableCell>
              <TableCell align="center" sx={{ width: 60 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No players detected yet. Click "Add Missing Card" to add manually.
                </TableCell>
              </TableRow>
            ) : (
              players.map((player, idx) => {
                const confPercent = Math.round((player.confidence_score || 0.95) * 100);

                return (
                  <TableRow
                    key={player.id || idx}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                      borderBottom: '1px solid #21262D',
                    }}
                  >
                    {/* Position */}
                    <TableCell>
                      <Select
                        size="small"
                        value={player.position_code || 'CF'}
                        onChange={(e) => handleFieldChange(idx, 'position_code', e.target.value)}
                        sx={{
                          height: 32,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'primary.light',
                          '& .MuiSelect-select': { py: 0.5, px: 1 },
                        }}
                      >
                        {POSITIONS.map((pos) => (
                          <MenuItem key={pos} value={pos} sx={{ fontSize: '0.8rem' }}>
                            {pos}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    {/* Player Name */}
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={player.player_name || ''}
                        onChange={(e) => handleFieldChange(idx, 'player_name', e.target.value)}
                        placeholder="Player Name"
                        inputProps={{
                          style: {
                            padding: '4px 8px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#F0F6FC',
                          },
                        }}
                      />
                    </TableCell>

                    {/* Overall Rating */}
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={player.overall_rating || 90}
                        onChange={(e) =>
                          handleFieldChange(idx, 'overall_rating', Number(e.target.value) || 0)
                        }
                        inputProps={{
                          min: 60,
                          max: 110,
                          style: {
                            padding: '4px 8px',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#00E5FF',
                            textAlign: 'center',
                          },
                        }}
                      />
                    </TableCell>

                    {/* Tier */}
                    <TableCell>
                      <Select
                        size="small"
                        value={player.tier_name || 'Standard'}
                        onChange={(e) => {
                          const chosenTier = TIERS.find((t) => t.name === e.target.value);
                          handleFieldChange(idx, 'tier_name', e.target.value);
                          if (chosenTier) {
                            handleFieldChange(idx, 'display_color', chosenTier.color);
                          }
                        }}
                        sx={{
                          height: 32,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          '& .MuiSelect-select': { py: 0.5, px: 1 },
                        }}
                      >
                        {TIERS.map((tier) => (
                          <MenuItem key={tier.name} value={tier.name} sx={{ fontSize: '0.8rem' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: tier.color,
                                }}
                              />
                              {tier.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    {/* Confidence */}
                    <TableCell>
                      <Chip
                        label={`${confPercent}% OCR`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor:
                            confPercent >= 90
                              ? 'rgba(35, 134, 54, 0.2)'
                              : confPercent >= 75
                              ? 'rgba(210, 153, 34, 0.2)'
                              : 'rgba(248, 81, 73, 0.2)',
                          color:
                            confPercent >= 90
                              ? '#3FB950'
                              : confPercent >= 75
                              ? '#D29922'
                              : '#F85149',
                          border:
                            confPercent >= 90
                              ? '1px solid rgba(46, 160, 67, 0.4)'
                              : '1px solid rgba(210, 153, 34, 0.4)',
                        }}
                      />
                    </TableCell>

                    {/* Delete Action */}
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemovePlayer(idx)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
