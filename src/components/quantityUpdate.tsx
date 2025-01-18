import React, { useState } from 'react';
import { Drawer, Box, Button, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FoodItem } from '../types';

interface QuantityUpdateProps {
    open: boolean;
    item: FoodItem;
    onClose: () => void;
}

const QuantityUpdate = ({open, onClose}: QuantityUpdateProps) => {

  return (
    <div>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => onClose()}
        PaperProps={{
          sx: {
            borderRadius: '16px 16px 0 0',
            padding: 2,
            maxHeight: '60%', // optional, if you want to control the height
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Bottom Drawer Content</Typography>
            <IconButton onClick={() => onClose()}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body1">This is the content inside the drawer.</Typography>
          <Button variant="contained" onClick={() => onClose()}>
            Close
          </Button>
        </Box>
      </Drawer>
    </div>
  );
};

export default QuantityUpdate;
