import React, { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { OrderStatus } from '../../types';
import { AdminFullOrder } from '../../admin/types/orders';
import {
  ORDER_STATUS_OPTIONS,
  RestaurantSection,
  formatItemVariant,
  formatRupees,
  getPayoutChipColor,
  getRestaurantSections,
  getStatusChipColor,
  statusErrorMessage,
  telHref,
} from '../../admin/utils/adminOrders';
import { useUpdateRestaurantOrderStatus } from '../../data/hooks/useOrders';

interface RestaurantOrderSectionsProps {
  order: AdminFullOrder;
  isMobile?: boolean;
  /** Restaurant picked in the filter: its section is highlighted. */
  highlightRestaurantId?: string;
}

/**
 * One block per `restaurantOrders[]` entry (§5.8, task 5.3): name, tap-to-call
 * phone, items, subtotal and a sub-order status control that calls
 * PATCH /orders/{id}/restaurants/{restaurantId}/status. Not used for legacy
 * orders, which keep the old single-list card.
 */
const RestaurantOrderSections: React.FC<RestaurantOrderSectionsProps> = ({
  order,
  isMobile = false,
  highlightRestaurantId,
}) => {
  const { mutate, isPending, variables } = useUpdateRestaurantOrderStatus();
  const [error, setError] = useState<string | null>(null);
  const sections = getRestaurantSections(order);

  if (sections.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No items on this order.
      </Typography>
    );
  }

  const handleChange = (section: RestaurantSection, status: OrderStatus) => {
    if (!order.id || status === section.status) return;
    setError(null);
    mutate(
      { orderId: order.id, restaurantId: section.restaurantId, status },
      { onError: (err) => setError(statusErrorMessage(err)) }
    );
  };

  return (
    <Stack spacing={1}>
      {sections.map((section) => {
        const phoneLink = telHref(section.restaurantPhone);
        const saving =
          isPending &&
          variables?.orderId === order.id &&
          variables?.restaurantId === section.restaurantId;
        const highlighted =
          !!highlightRestaurantId &&
          highlightRestaurantId === section.restaurantId;
        return (
          <Box
            key={section.restaurantId}
            sx={{
              border: '1px solid',
              borderColor: highlighted ? 'primary.main' : 'divider',
              borderRadius: 1,
              p: isMobile ? 1 : 1.25,
              bgcolor: highlighted ? 'action.hover' : 'transparent',
              opacity: section.status === OrderStatus.CANCELLED ? 0.7 : 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                }}
              >
                {section.restaurantName}
              </Typography>
              {section.payoutStatus && (
                <Chip
                  label={`Payout ${section.payoutStatus}`}
                  size="small"
                  variant="outlined"
                  color={getPayoutChipColor(section.payoutStatus)}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
            {phoneLink && (
              <Link
                href={phoneLink}
                underline="hover"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.8rem',
                }}
              >
                <PhoneIcon sx={{ fontSize: '0.9rem' }} />
                {section.restaurantPhone}
              </Link>
            )}

            <Box sx={{ mt: 0.5 }}>
              {section.items.map((item, idx) => (
                <Box
                  key={`${item.foodItemId}-${idx}`}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }}
                  >
                    • {item.itemName}
                    {formatItemVariant(item)} × {item.quantity}
                    {item.isPromotionalAddon ? ' · PROMO' : ''}
                    {item.isFreeClaim ? ' · FREE' : ''}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatRupees(item.unitPrice * item.quantity)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                mt: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Subtotal {formatRupees(section.subtotal)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {saving && <CircularProgress size={14} />}
                <TextField
                  select
                  size="small"
                  value={section.status}
                  disabled={!order.id || saving}
                  onChange={(event) =>
                    handleChange(section, event.target.value as OrderStatus)
                  }
                  inputProps={{
                    'aria-label': `${section.restaurantName} status`,
                  }}
                  sx={{ minWidth: 130 }}
                  SelectProps={{
                    renderValue: (value) => (
                      <Chip
                        label={String(value)}
                        size="small"
                        color={getStatusChipColor(value as OrderStatus)}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    ),
                  }}
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>
        );
      })}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Stack>
  );
};

export default RestaurantOrderSections;
