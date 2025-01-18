import React from 'react';
import { Box, Typography } from '@mui/material';

const Ribbon = ({ text = 'testtt', color = 'red' }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '20px', // You can adjust this position
        right: '20px', // You can adjust this position
        backgroundColor: color,
        color: 'white',
        padding: '10px 20px',
        transform: 'rotate(45deg)',
        transformOrigin: 'top right',
        zIndex: 999,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Typography sx={{ fontWeight: 'bold', fontSize: '14px' }}>
        {text}
      </Typography>
    </Box>
  );
};

export default Ribbon;
