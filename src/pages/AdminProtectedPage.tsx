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
          position: 'fixed',
          top: 0,
          right: 0,
          p: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderLeft: '1px solid #ddd',
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
