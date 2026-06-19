import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Badge,
  IconButton,
  Button,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhoneIcon from '@mui/icons-material/Phone';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import { recordAudioForMs } from '../utils/voiceRecorder';
import { useSendAudio } from '../hooks/useSendAudio';
import { getAuthState, isAuthenticated, logout } from '../admin/auth';

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
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [, setUsername] = useState<string | null>(getAuthState().username);
  const sendAudio = useSendAudio();

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

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUsername(null);
    trackEvent('header_logout_click', {});
    navigate('/bobs/foodList');
  };

  useEffect(() => {
    const updateAuth = () => {
      setAuthenticated(isAuthenticated());
      setUsername(getAuthState().username);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'admin_auth_token') {
        updateAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    updateAuth();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCallClick = () => {
    trackEvent('header_call_click', {
      phone_number: PHONE_NUMBER,
    });
    window.location.href = `tel:${PHONE_NUMBER}`;
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
          {/* {supportsVoice ? (
            isRecording ? (
              <MicOffIcon />
            ) : (
              <MicIcon />
            )
          ) : (
            <MicOffIcon />
          )} */}
        </IconButton>
        <IconButton color="inherit" onClick={handleCallClick}>
          <PhoneIcon />
        </IconButton>
        <IconButton color="inherit" onClick={handleCartClick}>
          <Badge badgeContent={totalItems} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
        {authenticated ? (
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              ml: 1,
              borderColor: 'rgba(255,255,255,0.7)',
              border: '1px solid',
            }}
          >
            Logout
          </Button>
        ) : null}
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
