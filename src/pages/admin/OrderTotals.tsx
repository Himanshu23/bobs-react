import React from 'react';
import { Box, Typography } from '@mui/material';
import { AdminFullOrder } from '../../admin/types/orders';
import {
  formatRupees,
  getOrderMoneySummary,
} from '../../admin/utils/adminOrders';

interface OrderTotalsProps {
  order: AdminFullOrder;
}

const Line: React.FC<{
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}> = ({ label, value, color, bold }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography
      variant="caption"
      color={color ?? 'text.secondary'}
      sx={{ fontWeight: bold ? 700 : undefined }}
    >
      {label}
    </Typography>
    <Typography
      variant="caption"
      color={color}
      sx={{ fontWeight: bold ? 700 : undefined }}
    >
      {value}
    </Typography>
  </Box>
);

/**
 * Money lines of an admin order card, from the server fields (§5.5 Totals):
 * items subtotal, client-reported promo savings and discount, the server's
 * delivery fee, and `totalAmount` (items gross, excluding the fee).
 */
const OrderTotals: React.FC<OrderTotalsProps> = ({ order }) => {
  const money = getOrderMoneySummary(order);
  return (
    <Box>
      <Line label="Items subtotal" value={formatRupees(money.itemsSubtotal)} />
      {money.promotionalSavings > 0 && (
        <Line
          label="Promo savings"
          value={`-${formatRupees(money.promotionalSavings)}`}
          color="success.main"
        />
      )}
      {money.discount > 0 && (
        <Line
          label={order.discountName || order.discountCode || 'Discount'}
          value={`-${formatRupees(money.discount)}`}
          color="success.main"
        />
      )}
      <Line label="Delivery fee" value={formatRupees(money.deliveryFee)} />
      <Line
        label="Total (items, excl. fee)"
        value={formatRupees(money.total)}
        bold
        color="text.primary"
      />
    </Box>
  );
};

export default OrderTotals;
