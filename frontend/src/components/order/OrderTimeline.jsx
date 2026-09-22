import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';

const STEPS = [
  { key: 'CREATED', label: 'สร้างคำสั่งซื้อ', desc: 'รอผู้ซื้ออัปโหลดสลิปชำระเงิน' },
  { key: 'PAYMENT_SUBMITTED', label: 'ส่งสลิปชำระเงินแล้ว', desc: 'เจ้าหน้าที่ Escrow ตรวจสอบสลิป' },
  { key: 'HANDOVER_OPEN', label: 'เปิดห้องส่งมอบไอดี', desc: 'ผู้ขายจัดเตรียมข้อมูล Konami ID' },
  { key: 'BUYER_REVIEWING', label: 'ส่งมอบข้อมูลแล้ว', desc: 'ผู้ซื้อตรวจสอบและเปลี่ยนรหัสผ่าน' },
  { key: 'COMPLETED', label: 'เสร็จสมบูรณ์', desc: 'ปล่อยเงิน Escrow ให้ผู้ขาย' },
];

export default function OrderTimeline({ status, isDisputed, isCancelled }) {
  // Determine active step index
  const getActiveStep = () => {
    switch (status) {
      case 'CREATED':
      case 'PENDING_PAYMENT':
        return 0;
      case 'PAYMENT_SUBMITTED':
        return 1;
      case 'PAYMENT_APPROVED':
      case 'HANDOVER_OPEN':
        return 2;
      case 'HANDOVER_INFO_PROVIDED':
      case 'BUYER_REVIEWING':
        return 3;
      case 'COMPLETED':
        return 5;
      default:
        return 0;
    }
  };

  const activeStep = getActiveStep();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: '#161B22',
        borderRadius: 2,
        border: '1px solid #30363D',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} color="#F0F6FC">
          ความคืบหน้าคำสั่งซื้อ Escrow
        </Typography>

        {status === 'DISPUTED' || isDisputed ? (
          <Chip
            icon={<WarningAmberIcon />}
            label="มีข้อพิพาท (DISPUTE)"
            color="error"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        ) : status === 'CANCELLED' || isCancelled ? (
          <Chip
            icon={<CancelIcon />}
            label="ยกเลิกแล้ว"
            color="default"
            size="small"
            sx={{ bgcolor: '#30363D', color: '#8B949E', fontWeight: 700 }}
          />
        ) : status === 'COMPLETED' ? (
          <Chip
            icon={<CheckCircleIcon />}
            label="เสร็จสมบูรณ์"
            color="success"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        ) : (
          <Chip
            icon={<PendingIcon />}
            label={
              status === 'CREATED' || status === 'PENDING_PAYMENT'
                ? 'รอชำระเงิน'
                : status === 'PAYMENT_SUBMITTED'
                ? 'รอตรวจสอบสลิป'
                : status === 'PAYMENT_APPROVED' || status === 'HANDOVER_OPEN'
                ? 'รอส่งมอบไอดี'
                : status === 'HANDOVER_INFO_PROVIDED' || status === 'BUYER_REVIEWING'
                ? 'ผู้ซื้อกำลังตรวจสอบ'
                : status?.replace(/_/g, ' ') || 'กำลังดำเนินการ'
            }
            color="primary"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Box>

      {status === 'CANCELLED' ? (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            คำสั่งซื้อนี้ถูกยกเลิกแล้ว ปิดคำสั่งซื้อ Escrow และไอดีถูกนำกลับมาวางจำหน่ายในตลาด
          </Typography>
        </Box>
      ) : (
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((step, idx) => {
            const isCompleted = activeStep > idx;
            const isCurrent = activeStep === idx;

            return (
              <Step key={step.key} completed={isCompleted}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: '#1F6FEB' },
                      '&.Mui-completed': { color: '#238636' },
                      '&.Mui-disabled': { color: '#30363D' },
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={isCurrent ? 700 : 500}
                    color={isCurrent ? '#58A6FF' : isCompleted ? '#3FB950' : 'text.secondary'}
                    display="block"
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontSize: '0.675rem', display: { xs: 'none', sm: 'block' } }}
                  >
                    {step.desc}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      )}
    </Paper>
  );
}
