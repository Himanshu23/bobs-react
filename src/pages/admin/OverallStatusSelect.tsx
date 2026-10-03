import React, { useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  TextField,
} from '@mui/material';
import { OrderStatus } from '../../types';
import { AdminFullOrder } from '../../admin/types/orders';
import {
  ORDER_STATUS_OPTIONS,
  isLegacyOrder,
  statusErrorMessage,
} from '../../admin/utils/adminOrders';
import { useUpdateOrderStatus } from '../../data/hooks/useOrders';

interface OverallStatusSelectProps {
  order: AdminFullOrder;
}

/**
 * Overall order status (PATCH /orders/{id}/status). On a multi-restaurant
 * order it also sets every non-cancelled restaurant to the same status (§5.8).
 */
const OverallStatusSelect: React.FC<OverallStatusSelectProps> = ({ order }) => {
  const { mutate, isPending } = useUpdateOrderStatus();
  const [error, setError] = useState<string | null>(null);
  const current = order.status ?? OrderStatus.PENDING;
  const propagates =
    !isLegacyOrder(order) && (order.restaurantOrders?.length ?? 0) > 1;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          select
          size="small"
          fullWidth
          label="Overall status"
          value={current}
          disabled={!order.id || isPending}
          helperText={
            propagates ? 'Also sets every restaurant (except cancelled)' : ''
          }
          onChange={(event) => {
            const status = event.target.value as OrderStatus;
            if (!order.id || status === current) return;
            setError(null);
            mutate(
              { orderId: order.id, status },
              { onError: (err) => setError(statusErrorMessage(err)) }
            );
          }}
        >
          {ORDER_STATUS_OPTIONS.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
        {isPending && <CircularProgress size={18} />}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default OverallStatusSelect;
