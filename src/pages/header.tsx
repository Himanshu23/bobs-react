import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Badge,
  IconButton,
  Box,
  Skeleton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhoneIcon from '@mui/icons-material/PhoneOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';
import { openWhatsApp } from '../utils/whatsappService';
import { getAuthState, isAuthenticated, logout } from '../admin/auth';
import AddressHeaderBar from '../components/address/AddressHeaderBar';
import RestaurantInfoButton from '../components/marketplace/RestaurantInfoSheet';
import { useRestaurantHeader } from '../context/RestaurantHeaderContext';
import { getHeaderMode } from '../utils/marketplaceRoutes';

/** Platform contact number (calls and WhatsApp from the header menu). */
const GROKHEADS_PHONE = '9643310092';

interface RootState {
  cart: {
    totalItems: number;
  };
}

const Header: React.FC = () => {
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);
  const navigate = useNavigate();
  const location = useLocation();
  const [, setUsername] = useState<string | null>(getAuthState().username);
  const authenticated = isAuthenticated();
  const isRestaurantHeader = getHeaderMode(location.pathname) === 'restaurant';
  const restaurantHeader = useRestaurantHeader();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchor);
  const closeMenu = () => setMenuAnchor(null);

  const handleHeaderClick = () => {
    trackEvent('header_brand_click', {
      destination: '/',
    });
    navigate('/');
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
    closeMenu();
    navigate(isAdminView ? '/bobs/foodList' : '/bobs/admin');
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    setUsername(null);
    trackEvent('header_logout_click', {});
    navigate('/bobs/foodList');
  };

  useEffect(() => {
    const updateAuth = () => {
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

  // Same back action as the menu page registered (pop to the list when opened
  // from it, else replace with the market list); home if none is registered.
  const handleBackClick = () => {
    trackEvent('header_back_click', {
      restaurant_id: restaurantHeader.restaurant?.id,
    });
    if (!restaurantHeader.goBack()) navigate('/', { replace: true });
  };

  const restaurantTitle = (
    <Box
      sx={{
        flexGrow: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
      }}
    >
      <IconButton
        color="inherit"
        onClick={handleBackClick}
        aria-label="Back to restaurants"
        edge="start"
      >
        <ArrowBackIcon />
      </IconButton>
      {/* A future optional `restaurant.logoUrl` would render here (small
          round avatar) before the name; until then the name stands alone. */}
      {restaurantHeader.restaurant ? (
        <>
          <Typography
            component="h1"
            noWrap
            sx={{
              minWidth: 0,
              mb: 0,
              fontWeight: 700,
              fontSize: '1.15rem',
              lineHeight: 1.3,
              color: 'inherit',
            }}
          >
            {restaurantHeader.restaurant.name}
          </Typography>
          <RestaurantInfoButton
            restaurant={restaurantHeader.restaurant}
            source="menu_header"
            sx={{ color: 'inherit', ml: -0.5 }}
          />
        </>
      ) : restaurantHeader.loading ? (
        <Skeleton
          variant="text"
          width={140}
          sx={{ fontSize: '1.15rem', bgcolor: 'rgba(255,255,255,0.35)' }}
          aria-label="Loading restaurant"
        />
      ) : (
        <Typography
          component="h1"
          noWrap
          sx={{
            mb: 0,
            fontWeight: 700,
            fontSize: '1.15rem',
            lineHeight: 1.3,
            color: 'inherit',
          }}
        >
          Menu
        </Typography>
      )}
    </Box>
  );

  const handleCallClick = () => {
    closeMenu();
    trackEvent('header_call_click', {
      phone_number: GROKHEADS_PHONE,
    });
    window.location.href = `tel:${GROKHEADS_PHONE}`;
  };

  const handleWhatsAppClick = () => {
    closeMenu();
    trackEvent('header_whatsapp_click', {
      phone_number: GROKHEADS_PHONE,
    });
    openWhatsApp(GROKHEADS_PHONE, 'Hi Grokheads!');
  };

  return (
    <AppBar
      position="static"
      sx={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <Toolbar
        sx={{
          gap: 0.1,
          px: { xs: 1.5, sm: 2.5 },
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        {isRestaurantHeader ? (
          restaurantTitle
        ) : (
          <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex' }}>
            <Typography
              variant="h6"
              component="div"
              role="link"
              tabIndex={0}
              onClick={handleHeaderClick}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleHeaderClick();
              }}
              noWrap
              sx={{
                // The theme gives every Typography a bottom margin; drop it so
                // the brand sits on the toolbar's centre line.
                mb: 0,
                lineHeight: 1.3,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '1.25rem',
                color: '#fff',
                borderRadius: 1,
                '&:focus-visible': {
                  outline: '2px solid rgba(255,255,255,0.8)',
                  outlineOffset: 2,
                },
              }}
            >
              Grokheads
            </Typography>
          </Box>
        )}
        <IconButton
          color="inherit"
          onClick={handleCartClick}
          aria-label={`Cart, ${totalItems} item${totalItems === 1 ? '' : 's'}`}
        >
          <Badge badgeContent={totalItems} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
        <IconButton
          color="inherit"
          edge="end"
          aria-label="Open menu"
          aria-haspopup="menu"
          aria-controls={menuOpen ? 'header-menu' : undefined}
          aria-expanded={menuOpen ? 'true' : undefined}
          onClick={(event) => setMenuAnchor(event.currentTarget)}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="header-menu"
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: { sx: { mt: 0.5, minWidth: 220, borderRadius: 2 } },
          }}
          sx={{ '& .MuiListItemIcon-root': { color: 'primary.main' } }}
        >
          <MenuItem onClick={handleCallClick}>
            <ListItemIcon>
              <PhoneIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Contact Grokheads" />
          </MenuItem>
          <MenuItem onClick={handleWhatsAppClick}>
            <ListItemIcon>
              <WhatsAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="WhatsApp us" />
          </MenuItem>
          {authenticated && <Divider />}
          {authenticated && (
            <MenuItem onClick={handleRouteToggle}>
              <ListItemIcon>
                {isAdminView ? (
                  <StorefrontOutlinedIcon fontSize="small" />
                ) : (
                  <AdminPanelSettingsOutlinedIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary={isAdminView ? 'Back to store' : 'Admin'} />
            </MenuItem>
          )}
          {authenticated && (
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
      {!isAdminView ? <AddressHeaderBar /> : null}
    </AppBar>
  );
};

export default Header;
