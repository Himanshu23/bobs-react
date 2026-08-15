import React, { useEffect, useState } from 'react';
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
import { useLocation, useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import { getAuthState, isAuthenticated, logout } from '../admin/auth';
import AddressHeaderBar from '../components/address/AddressHeaderBar';

const PHONE_NUMBER = '9643310092';

interface RootState {
  cart: {
    totalItems: number;
  };
}

const Header: React.FC = () => {
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [, setUsername] = useState<string | null>(getAuthState().username);

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

  const isAdminView = location.pathname.startsWith('/bobs/admin');

  const handleRouteToggle = () => {
    navigate(isAdminView ? '/bobs/foodList' : '/bobs/admin');
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

  return (
    <AppBar
      position="static"
      sx={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
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
        <IconButton color="inherit" onClick={handleCallClick}>
          <PhoneIcon />
        </IconButton>
        <IconButton color="inherit" onClick={handleCartClick}>
          <Badge badgeContent={totalItems} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        <Button color="inherit" onClick={handleRouteToggle} sx={{ ml: 1 }}>
          {isAdminView ? 'Food List' : 'Admin'}
        </Button>
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
      </Toolbar>
      {!isAdminView ? <AddressHeaderBar /> : null}
    </AppBar>
  );
};

export default Header;
