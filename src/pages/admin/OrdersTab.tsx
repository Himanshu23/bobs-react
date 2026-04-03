import React from 'react';
import { Grid, Typography } from '@mui/material';

const OrdersTab: React.FC = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography color="text.secondary">
          Orders management coming soon...
        </Typography>
      </Grid>
    </Grid>
  );
};

export default OrdersTab;
