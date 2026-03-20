import React from 'react';
import { Box } from '@mui/material';

const MenuPage: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'auto',
        overscrollBehavior: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0)',
      }}
    >
      <Box
        component="img"
        src="/imgs/menu.jpg"
        alt="Bob's Menu"
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
    </Box>
  );
};

export default MenuPage;
