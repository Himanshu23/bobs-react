import React from 'react';
import { AppBar, Toolbar, Typography, Badge, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

interface RootState {
  cart: {
    totalItems: number;
  };
}

const Header: React.FC = () => {
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);
  const navigate = useNavigate();

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
        <IconButton color="inherit" onClick={handleCartClick}>
          <Badge badgeContent={totalItems} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
