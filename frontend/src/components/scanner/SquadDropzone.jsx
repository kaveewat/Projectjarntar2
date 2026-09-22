import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Grid,
  IconButton,
  Card,
  CardMedia,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function SquadDropzone({ files = [], onFilesChange, disabled = false }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (disabled) return;

      const remainingSlots = MAX_FILES - files.length;
      if (remainingSlots <= 0) return;

      // Add preview object URL for immediate display
      const newFilesWithPreview = acceptedFiles.slice(0, remainingSlots).map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      onFilesChange([...files, ...newFilesWithPreview]);
    },
    [files, onFilesChange, disabled]
  );

  const removeFile = (indexToRemove) => {
    if (disabled) return;
    const targetFile = files[indexToRemove];
    if (targetFile?.preview) {
      URL.revokeObjectURL(targetFile.preview);
    }
    const updated = files.filter((_, idx) => idx !== indexToRemove);
    onFilesChange(updated);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: MAX_FILES - files.length,
    maxSize: MAX_FILE_SIZE,
    disabled: disabled || files.length >= MAX_FILES,
  });

  return (
    <Box>
      {/* Dropzone Area */}
      <Box
        {...getRootProps()}
        sx={{
          p: { xs: 3, md: 5 },
          border: '2px dashed',
          borderColor: isDragActive
            ? 'primary.main'
            : files.length >= MAX_FILES
            ? 'rgba(255, 255, 255, 0.1)'
            : '#30363D',
          borderRadius: 2,
          bgcolor: isDragActive ? 'rgba(31, 111, 235, 0.08)' : '#0D1117',
          textAlign: 'center',
          cursor: disabled || files.length >= MAX_FILES ? 'default' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: files.length >= MAX_FILES || disabled ? undefined : 'primary.light',
            bgcolor: files.length >= MAX_FILES || disabled ? undefined : 'rgba(255, 255, 255, 0.02)',
          },
        }}
      >
        <input {...getInputProps()} />

        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: isDragActive ? 'primary.main' : 'text.secondary',
            mb: 1.5,
          }}
        />

        <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
          {isDragActive
            ? 'Drop squad screenshots here...'
            : files.length >= MAX_FILES
            ? 'Maximum file limit reached (10/10)'
            : 'Drag & drop squad screenshots, or browse files'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 2 }}>
          Upload high-resolution screenshots of your eFootball <strong>Game Plan</strong> and <strong>Player List</strong>. Supported formats: JPEG, PNG, WEBP (up to 10MB per file).
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="center">
          <Chip
            icon={<InsertPhotoIcon sx={{ fontSize: 16 }} />}
            label={`${files.length} / ${MAX_FILES} screenshots selected`}
            size="small"
            color={files.length > 0 ? 'primary' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Box>

      {/* Validation Rejection Alert */}
      {fileRejections.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {fileRejections[0].errors[0]?.message || 'Some files were rejected. Please upload valid images under 10MB.'}
        </Alert>
      )}

      {/* Thumbnails Preview Grid */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC" sx={{ mb: 1.5 }}>
            Selected Screenshots ({files.length})
          </Typography>

          <Grid container spacing={2}>
            {files.map((file, index) => (
              <Grid item xs={6} sm={4} md={2.4} key={index}>
                <Card
                  sx={{
                    position: 'relative',
                    bgcolor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={file.preview}
                    alt={file.name}
                    sx={{ height: 110, objectFit: 'cover' }}
                  />

                  {/* Remove Button Overlay */}
                  {!disabled && (
                    <IconButton
                      size="small"
                      onClick={() => removeFile(index)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.75)',
                        color: 'error.light',
                        p: 0.5,
                        '&:hover': { bgcolor: 'error.main', color: '#fff' },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}

                  <Box sx={{ p: 1, bgcolor: '#0D1117' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem',
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Helpful Hint */}
      <Box
        sx={{
          mt: 3,
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: 'rgba(31, 111, 235, 0.05)',
          border: '1px solid rgba(31, 111, 235, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <InfoOutlinedIcon sx={{ color: 'primary.light', fontSize: 20 }} />
        <Typography variant="caption" color="text.secondary">
          <strong>Tip for Sellers:</strong> For the most accurate AI valuation, ensure player card overall ratings (OVR) and card background art (Epic, Big Time, Show Time) are clearly visible and uncropped.
        </Typography>
      </Box>
    </Box>
  );
}
