import React, { useMemo, useState } from 'react';
import { AppBar, Toolbar, Typography, Badge, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhoneIcon from '@mui/icons-material/Phone';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import { recordAudioForMs } from '../utils/voiceRecorder';

const PHONE_NUMBER = '9643310092';
const RECORDING_MS = 5000;

interface RootState {
  cart: {
    totalItems: number;
  };
}

const Header: React.FC = () => {
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const supportsVoice = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }, []);

  const handleHeaderClick = () => {
    trackEvent('header_brand_click', {
      destination: '/bobs/foodList',
    });
    navigate('/bobs/foodList');
  };

  const handleCartClick = () => {
    trackEvent('header_cart_click', {
      destination: '/cart',
      cart_items: totalItems,
    });
    navigate('/cart');
  };

  const handleCallClick = () => {
    trackEvent('header_call_click', {
      phone_number: PHONE_NUMBER,
    });
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  const sendAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');

    const res = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Voice upload failed (${res.status})`);
    }

    const data = (await res.json()) as { text?: string };
    trackEvent('voice_transcribe_result', {
      has_text: Boolean(data.text),
    });

    if (data.text) {
      window.dispatchEvent(
        new CustomEvent('voice:text', { detail: { text: data.text } })
      );
    }
  };

  const handleVoiceClick = async () => {
    if (!supportsVoice || isRecording) return;
    setVoiceError(null);
    setIsRecording(true);

    trackEvent('voice_record_start', { duration_ms: RECORDING_MS });

    try {
      const result = await recordAudioForMs(RECORDING_MS);
      if (!result.ok) {
        setVoiceError(result.error);
        trackEvent('voice_record_error', { message: result.error });
        return;
      }

      trackEvent('voice_record_stop', {
        size_bytes: result.blob.size,
        mime_type: result.blob.type,
      });

      await sendAudio(result.blob);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Voice recording failed.';
      setVoiceError(message);
      trackEvent('voice_record_error', { message });
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1 }}
          onClick={handleHeaderClick}
          style={{
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '1.25rem',
            color: '#fff',
          }}
        >
          Bob&#39;s
        </Typography>
        <IconButton
          color="inherit"
          onClick={handleVoiceClick}
          disabled={!supportsVoice || isRecording}
          aria-label="Record voice"
          title={
            !supportsVoice
              ? 'Voice not supported on this device'
              : isRecording
                ? 'Recording...'
                : 'Record voice'
          }
        >
          {supportsVoice ? (isRecording ? <MicOffIcon /> : <MicIcon />) : <MicOffIcon />}
        </IconButton>
        <IconButton color="inherit" onClick={handleCallClick}>
          <PhoneIcon />
        </IconButton>
        <IconButton color="inherit" onClick={handleCartClick}>
          <Badge badgeContent={totalItems} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Toolbar>
      {voiceError ? (
        <Typography
          variant="caption"
          sx={{
            px: 2,
            pb: 1,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {voiceError}
        </Typography>
      ) : null}
    </AppBar>
  );
};

export default Header;
