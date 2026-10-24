import React, { useState, useEffect } from 'react';
import { isAuthenticated, logout, getAuthState } from '../admin/auth';
import LoginPage from './LoginPage';
import AdminPage from './adminPage';
import { Button, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const AdminProtectedPage: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    setAuthenticated(isAuthenticated());
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  if (loading) {
    return null;
  }

  if (!authenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const authState = getAuthState();

  return (
    <Box>
      <Box
        sx={{
          // Phones: a normal bar above the page, so it doesn't cover the
          // admin screens. Wider screens: pinned top-right as before.
          position: { xs: 'static', md: 'fixed' },
          top: 0,
          right: 0,
          p: { xs: 1.5, md: 2 },
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: { xs: 'space-between', md: 'flex-start' },
          flexWrap: 'wrap',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderLeft: { md: '1px solid #ddd' },
          borderBottom: { xs: '1px solid #ddd', md: 'none' },
          zIndex: 1000,
        }}
      >
        <span style={{ fontSize: '14px', color: '#666' }}>
          Logged in as: <strong>{authState.username}</strong>
        </span>
        <Button
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      <AdminPage />
    </Box>
  );
};

export default AdminProtectedPage;
