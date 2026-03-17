import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import DishSlider from '../components/dish-slider';
import { LocationOn } from '@mui/icons-material';

const LandingPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: "url('/imgs/black-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '10px',
        }}
      >
        <Box
          component="img"
          src="/imgs/logo.png"
          alt="Logo"
          sx={{ width: 100 }}
        />
      </Box>

      {/* Dish Slider */}
      <Box
        id="dishSliderContainer"
        sx={{ flex: 1, width: '100%', mb: 1, mt: 1, maxHeight: '250px' }}
      >
        <DishSlider />
      </Box>

      {/* Order Section */}
      <Container sx={{ textAlign: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Order on
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Button
            component="a"
            href="https://link.zomato.com/xqzv/rshare?id=9438730630563d53"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ background: 'transparent', padding: 0 }}
          >
            <Box
              component="img"
              src="/imgs/zomato-button.jpg"
              alt="Zomato"
              sx={{ width: 120 }}
            />
          </Button>

          <Button
            component="a"
            href="https://www.swiggy.com/direct/brand/48321?source=swiggy-direct&subSource=instagram"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ background: 'transparent', padding: 0 }}
          >
            <Box
              component="img"
              src="/imgs/swiggy-button.jpg"
              alt="Swiggy"
              sx={{ width: 120 }}
            />
          </Button>
        </Box>

        {/* WhatsApp Section */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', mb: 1, color: '#FFFFFF' }}
        >
          For Better Deals Connect
        </Typography>
        <Button
          href="https://wa.me/919643310092"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#25d366',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: '8px 16px',
            borderRadius: '5px',
            animation: 'pulse 2.5s infinite',
            '&:hover': { backgroundColor: '#1ebe5b' },
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' },
            },
          }}
        >
          <Box
            component="img"
            src="/imgs/whats_app.svg"
            alt="WhatsApp"
            sx={{ width: 20, mr: 1 }}
          />
          +91 9643310092
        </Button>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          width: '100%',
          textAlign: 'left',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            fontSize: '14px',
          }}
        >
          <LocationOn color="primary" />
          Shop No 66, Habitat 78, Sector 78 Faridabad, 121004
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;
