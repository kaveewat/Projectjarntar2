import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  IconButton,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GavelIcon from '@mui/icons-material/Gavel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import disputesApi from '../../services/disputes.api';
import { formatThaiDateTime } from '../../utils/date';

export default function DisputeDetailPage() {
  const { id, order_id } = useParams();

  const [dispute, setDispute] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evidence upload state
  const [newEvidenceFile, setNewEvidenceFile] = useState(null);
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id, order_id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (order_id) {
        res = await disputesApi.getDisputeByOrderId(order_id);
      } else if (id) {
        res = await disputesApi.getDisputeDetail(id);
      } else {
        throw new Error('Dispute ID or Order ID is required');
      }
      setDispute(res.data?.data?.dispute || res.data?.dispute);
      setEvidenceList(res.data?.data?.evidence || res.data?.evidence || []);
      setComments(res.data?.data?.comments || res.data?.comments || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        setNewEvidenceFile(acceptedFiles[0]);
      }
    },
  });

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!newEvidenceFile) return;

    const targetId = dispute?.id || id;
    if (!targetId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('evidence', newEvidenceFile);
      formData.append('description', evidenceDesc.trim() || 'Additional evidence');

      await disputesApi.uploadEvidence(targetId, formData);
      setNewEvidenceFile(null);
      setEvidenceDesc('');
      fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={44} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          กำลังโหลดข้อมูลข้อพิพาท #{dispute?.id || id || order_id}...
        </Typography>
      </Container>
    );
  }

  if (error || !dispute) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'ไม่พบข้อมูลข้อพิพาท'}
        </Alert>
        <Button component={Link} to="/orders" startIcon={<ArrowBackIcon />}>
          กลับไปยังรายการคำสั่งซื้อ
        </Button>
      </Container>
    );
  }

  const getStatusChip = (status) => {
    switch (status) {
      case 'OPEN':
        return <Chip label="รอดำเนินการ (OPEN)" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'UNDER_REVIEW':
        return <Chip label="กำลังตรวจสอบ (UNDER REVIEW)" color="info" size="small" sx={{ fontWeight: 800 }} />;
      case 'RESOLVED':
        return <Chip label="ยุติแล้ว (RESOLVED)" color="success" size="small" sx={{ fontWeight: 800 }} />;
      case 'REJECTED':
        return <Chip label="ปฏิเสธ (REJECTED)" color="error" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label={status} size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          to={`/orders/${dispute.order_id}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, color: 'text.secondary' }}
        >
          กลับไปยังคำสั่งซื้อ #{dispute.order_id}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GavelIcon sx={{ color: '#F85149', fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight={800} color="#F0F6FC">
                ข้อพิพาท #{dispute.dispute_number || dispute.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ยื่นเรื่องเมื่อ {formatThaiDateTime(dispute.created_at)} • คำสั่งซื้อที่เกี่ยวข้อง #{dispute.order_id}
              </Typography>
            </Box>
          </Box>
          {getStatusChip(dispute.status)}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Dispute Overview & Evidence */}
        <Grid item xs={12} md={7}>
          {/* Dispute Description Card */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" gutterBottom>
                เหตุผลข้อพิพาท
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#F85149" sx={{ mb: 2 }}>
                {dispute.reason_title || dispute.dispute_reason || 'ข้อมูลไอดีไม่ตรงกับที่ระบุไว้ / ล็อกอินไม่ได้'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" gutterBottom>
                คำชี้แจงของผู้ซื้อ
              </Typography>
              <Typography variant="body1" color="#C9D1D9" sx={{ whiteSpace: 'pre-line', bgcolor: '#0D1117', p: 2, borderRadius: 1.5, border: '1px solid #21262D' }}>
                {dispute.description}
              </Typography>

              {dispute.resolution_notes && (
                <Box sx={{ mt: 3, p: 2, borderRadius: 1.5, bgcolor: 'rgba(63, 185, 80, 0.1)', border: '1px solid #3FB950' }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#3FB950" gutterBottom>
                    ผลการพิจารณาตัดสินจากผู้ดูแลระบบ
                  </Typography>
                  <Typography variant="body2" color="#F0F6FC">
                    {dispute.resolution_notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Evidence Gallery */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#F0F6FC" gutterBottom>
                ภาพหลักฐานที่แนบเข้ามา ({evidenceList.length})
              </Typography>

              {evidenceList.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  ยังไม่มีการอัปโหลดภาพหลักฐาน
                </Typography>
              ) : (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  {evidenceList.map((ev, idx) => (
                    <Grid item xs={12} sm={6} key={ev.id || idx}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: '#0D1117',
                          border: '1px solid #21262D',
                        }}
                      >
                        <Box
                          component="img"
                          src={ev.evidence_url || ev.file_url}
                          alt={`Evidence ${idx + 1}`}
                          sx={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }} noWrap>
                          {ev.description || `หลักฐานที่ #${idx + 1}`}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Upload More Evidence & Case Guidelines */}
        <Grid item xs={12} md={5}>
          {/* Upload Additional Evidence */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC" gutterBottom>
                อัปโหลดหลักฐานเพิ่มเติม
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                แนบภาพหน้าจอเพิ่มเติมเพื่อประกอบการพิจารณาตัดสินข้อพิพาท
              </Typography>

              <form onSubmit={handleUploadEvidence}>
                <Stack spacing={2}>
                  {newEvidenceFile ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: '#0D1117',
                        border: '1px solid #1F6FEB',
                        borderRadius: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="#F0F6FC" noWrap>
                          {newEvidenceFile.name}
                        </Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => setNewEvidenceFile(null)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ) : (
                    <Paper
                      {...getRootProps()}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderStyle: 'dashed',
                        borderColor: isDragActive ? '#1F6FEB' : '#30363D',
                        bgcolor: '#0D1117',
                        borderRadius: 1.5,
                      }}
                    >
                      <input {...getInputProps()} />
                      <CloudUploadIcon sx={{ fontSize: 28, color: 'text.secondary', mb: 0.5 }} />
                      <Typography variant="caption" display="block" color="#F0F6FC" fontWeight={600}>
                        {isDragActive ? 'วางรูปภาพหลักฐานที่นี่...' : 'คลิกหรือลากวางภาพหน้าจอหลักฐาน'}
                      </Typography>
                    </Paper>
                  )}

                  <TextField
                    label="คำอธิบายภาพหลักฐาน"
                    size="small"
                    fullWidth
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    placeholder="เช่น ภาพรหัสข้อผิดพลาดตอนล็อกอินเข้าเกม"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={uploading || !newEvidenceFile}
                    fullWidth
                    size="small"
                    sx={{ fontWeight: 700 }}
                  >
                    {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดหลักฐาน'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>

          {/* Arbitration Guidelines */}
          <Card sx={{ bgcolor: '#161B22', border: '1px solid #30363D', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#F0F6FC" gutterBottom>
                กระบวนการพิจารณาและ SLA
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                ผู้ดูแลระบบจะตรวจสอบหลักฐานที่ทั้งผู้ซื้อและผู้ขายส่งเข้ามาอย่างละเอียด
              </Typography>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary" display="block">
                  • <strong>การตอบกลับตาม SLA:</strong> เจ้าหน้าที่จะเริ่มเข้าตรวจสอบเคสภายใน 48 ชั่วโมง
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  • <strong>กรณีผู้ซื้อชนะ:</strong> ระบบจะคืนเงิน Escrow เต็มจำนวน 100% เข้ากระเป๋าเงินผู้ซื้อ
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  • <strong>กรณีผู้ขายชนะ:</strong> เงิน Escrow จะถูกปล่อยโอนให้ผู้ขายตามปกติ
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
