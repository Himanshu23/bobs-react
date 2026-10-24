import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useSendOtp, useVerifyOtp } from '../../data/hooks/useCustomerAuth';
import { SavedAddress } from '../../types/address';
import { CustomerAuthResponseDTO } from '../../types/customerAuth';
import {
  formatIndianPhoneDisplay,
  isValidIndianPhone,
  normalizeIndianPhone,
  toAddressDTO,
  toApiPhoneNumber,
} from '../../utils/phone';
import { trackEvent } from '../../utils/analytics';
import { LEGAL_URLS } from '../../config/api';

type OtpStep = 'phone' | 'otp';

/** Matches the server's resend cooldown (OTPService.RESEND_COOLDOWN). */
const RESEND_COOLDOWN_SECONDS = 30;

interface CustomerOtpDialogProps {
  open: boolean;
  address: SavedAddress | null;
  onClose: () => void;
  onVerified: (auth: CustomerAuthResponseDTO) => void;
}

const CustomerOtpDialog: React.FC<CustomerOtpDialogProps> = ({
  open,
  address,
  onClose,
  onVerified,
}) => {
  const [step, setStep] = useState<OtpStep>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (open) {
      return;
    }

    setStep('phone');
    setOtp('');
    setSessionId(null);
    setError('');
    setResendIn(0);
  }, [open]);

  // Counts down to when "Resend code" is allowed again.
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const phoneDigits = normalizeIndianPhone(phoneInput);
  const apiPhone = phoneDigits ? toApiPhoneNumber(phoneInput) : '';
  const busy = sendOtp.isPending || verifyOtp.isPending;

  const handleSendOtp = async () => {
    setError('');

    if (!isValidIndianPhone(phoneInput)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!address) {
      setError('Select a delivery address before verifying your phone.');
      return;
    }

    try {
      const result = await sendOtp.mutateAsync({
        phoneNumber: toApiPhoneNumber(phoneInput),
      });
      setSessionId(result.sessionId);
      setStep('otp');
      setOtp('');
      setResendIn(RESEND_COOLDOWN_SECONDS);
      trackEvent('customer_otp_sent', { phone_suffix: phoneDigits.slice(-4) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send the code.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');

    if (!sessionId) {
      setError('Session expired. Please request a new OTP.');
      setStep('phone');
      return;
    }

    if (!/^\d{4,8}$/.test(otp.trim())) {
      setError('Enter the 6-digit code sent to your WhatsApp.');
      return;
    }

    if (!address) {
      setError('Select a delivery address before verifying your phone.');
      return;
    }

    try {
      const auth = await verifyOtp.mutateAsync({
        phoneNumber: apiPhone,
        sessionId,
        otp: otp.trim(),
        address: toAddressDTO(address),
      });
      trackEvent('customer_otp_verified', {
        phone_suffix: phoneDigits.slice(-4),
      });
      onVerified(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    }
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setOtp('');
    setSessionId(null);
    setError('');
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Verify mobile number</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          We&apos;ll send a code to this number on WhatsApp. Verify once and you
          stay logged in for your next orders.
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <TextField
          fullWidth
          label="Mobile number"
          placeholder="10-digit mobile number"
          value={phoneInput}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d+\s-]/g, '');
            setPhoneInput(next);
            setError('');
          }}
          disabled={busy || step === 'otp'}
          inputProps={{ inputMode: 'numeric', maxLength: 14 }}
          helperText={
            isValidIndianPhone(phoneInput)
              ? `+91 ${formatIndianPhoneDisplay(phoneInput)}`
              : 'India numbers only (+91)'
          }
          sx={{ mb: 2 }}
        />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 2 }}
        >
          By continuing you agree to our{' '}
          <a href={LEGAL_URLS.terms} target="_blank" rel="noreferrer">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href={LEGAL_URLS.privacy} target="_blank" rel="noreferrer">
            Privacy Policy
          </a>
          .
        </Typography>

        {step === 'otp' ? (
          <Box>
            <TextField
              fullWidth
              label="WhatsApp code"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 8));
                setError('');
              }}
              disabled={busy}
              inputProps={{ inputMode: 'numeric', maxLength: 8 }}
              autoFocus
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Code sent on WhatsApp to +91{' '}
              {formatIndianPhoneDisplay(phoneInput)}. It&apos;s valid for 5
              minutes.
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {step === 'otp' ? (
            <>
              <Button
                onClick={handleChangeNumber}
                disabled={busy}
                sx={{ textTransform: 'none' }}
              >
                Change number
              </Button>
              <Button
                onClick={() => void handleSendOtp()}
                disabled={busy || resendIn > 0}
                sx={{ textTransform: 'none' }}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleVerifyOtp()}
                disabled={busy || otp.trim().length < 4}
                startIcon={
                  verifyOtp.isPending ? (
                    <CircularProgress size={16} />
                  ) : undefined
                }
                sx={{ textTransform: 'none' }}
              >
                Verify & continue
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => void handleSendOtp()}
              disabled={busy || !isValidIndianPhone(phoneInput)}
              startIcon={
                sendOtp.isPending ? <CircularProgress size={16} /> : undefined
              }
              sx={{ textTransform: 'none' }}
            >
              Send code on WhatsApp
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerOtpDialog;
