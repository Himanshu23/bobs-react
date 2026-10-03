import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  useMediaQuery,
  useTheme,
  Stack,
} from '@mui/material';
import { OrderFulfillmentType } from '../../types';
import OrderDeleteButton from '../../components/OrderDeleteButton';
import { AdminFullOrder } from '../../admin/types/orders';
import {
  formatItemVariant,
  formatRupees,
  getStatusChipColor,
  isLegacyOrder,
  overallStatusNote,
  subOrderProgressText,
} from '../../admin/utils/adminOrders';
import RestaurantOrderSections from './RestaurantOrderSections';
import OrderTotals from './OrderTotals';
import OverallStatusSelect from './OverallStatusSelect';

interface OrderCardProps {
  order: AdminFullOrder;
  onViewDetails?: (order: AdminFullOrder) => void;
  onDeleteSuccess?: () => void;
  isMobile?: boolean;
  /** Restaurant picked in the filter; its section is highlighted. */
  highlightRestaurantId?: string;
  /** Show the overall status control (PATCH /orders/{id}/status). */
  showStatusControl?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onDeleteSuccess,
  isMobile: propIsMobile,
  highlightRestaurantId,
  showStatusControl = false,
}) => {
  const theme = useTheme();
  const isMobile = propIsMobile ?? useMediaQuery(theme.breakpoints.down('sm'));

  const fulfillmentTypeLabel =
    order.fulfillmentType === OrderFulfillmentType.PICKUP
      ? 'Pickup'
      : order.fulfillmentType === OrderFulfillmentType.SCHEDULED
        ? 'Scheduled'
        : 'Delivery';

  const legacy = isLegacyOrder(order);
  const progress = subOrderProgressText(order);
  const statusNote = overallStatusNote(order);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': isMobile
          ? {}
          : {
              boxShadow: 6,
              transform: 'translateY(-2px)',
            },
      }}
    >
      <CardContent
        sx={{ flex: 1, p: isMobile ? 1.25 : 2, pb: isMobile ? 1 : 1.5 }}
      >
        {/* Header: Order ID and Status */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: isMobile ? 1 : 1.5,
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {/* <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: '#999',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block',
                mb: 0.25,
              }}
            >
              Order ID
            </Typography>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: isMobile ? '0.85rem' : '1rem',
                wordBreak: 'break-word',
                color: '#000',
              }}
            >
              {order.id}
            </Typography>
          </Box> */}
          <Chip
            label={order.status || 'PENDING'}
            color={getStatusChipColor(order.status)}
            size="small"
            sx={{ flexShrink: 0, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
          />
          {progress && (
            <Typography variant="caption" color="text.secondary">
              {progress}
            </Typography>
          )}
        </Box>
        {statusNote && (
          <Typography
            variant="caption"
            color="warning.main"
            sx={{ display: 'block', mb: 1 }}
          >
            {statusNote}
          </Typography>
        )}

        <Divider sx={{ my: isMobile ? 0.8 : 1.2 }} />

        {/* Customer Info */}
        <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: '#999',
              textTransform: 'uppercase',
              fontWeight: 600,
              display: 'block',
              mb: 0.25,
            }}
          >
            Customer
          </Typography>
          <Typography
            sx={{
              fontSize: isMobile ? '0.8rem' : '0.95rem',
              fontWeight: 500,
              mb: 0.25,
              color: '#000',
            }}
          >
            {order.customerName}
          </Typography>
          {/* <Typography
            sx={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: '#666',
            }}
          >
            {order.customerPhone}
          </Typography> */}
        </Box>

        {/* Order Details Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: isMobile ? 0.8 : 1.2,
            mb: isMobile ? 1 : 1.5,
          }}
        >
          {/* Items */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: '#999',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block',
                mb: 0.25,
              }}
            >
              Items
            </Typography>
            <Typography
              sx={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                color: '#1976d2',
              }}
            >
              {order.items.length}
            </Typography>
          </Box>

          {/* Total */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: '#999',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block',
                mb: 0.25,
              }}
            >
              Total
            </Typography>
            <Typography
              sx={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                color: '#2e7d32',
              }}
            >
              {formatRupees(order.totalAmount)}
            </Typography>
          </Box>

          {/* Time */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: '#999',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block',
                mb: 0.25,
              }}
            >
              Time
            </Typography>
            <Typography
              sx={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: '#333',
              }}
            >
              {order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'}
            </Typography>
          </Box>

          {/* Type */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: '#999',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block',
                mb: 0.25,
              }}
            >
              Type
            </Typography>
            <Typography
              sx={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: '#333',
              }}
            >
              {fulfillmentTypeLabel}
            </Typography>
          </Box>
        </Box>

        {/* Address */}
        {order.deliveryAddress && (
          <>
            <Divider sx={{ my: isMobile ? 0.8 : 1.2 }} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: '#999',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  mb: 0.25,
                }}
              >
                Address
              </Typography>
              <Typography
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                  color: '#444',
                }}
              >
                {order.deliveryAddress}
              </Typography>
            </Box>
          </>
        )}

        {/* Items: one section per restaurant; legacy orders keep the flat list */}
        {!legacy && (
          <>
            <Divider sx={{ my: isMobile ? 0.8 : 1.2 }} />
            <RestaurantOrderSections
              order={order}
              isMobile={isMobile}
              highlightRestaurantId={highlightRestaurantId}
            />
          </>
        )}
        {/* Items Details (legacy order) */}
        {legacy && order.items && order.items.length > 0 && (
          <>
            <Divider sx={{ my: isMobile ? 0.8 : 1.2 }} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: '#999',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Items Ordered
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {order.items.map((item, idx) => {
                  const variantText = formatItemVariant(item);

                  return (
                    <Typography
                      key={idx}
                      sx={{
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        color: '#333',
                      }}
                    >
                      • {item.itemName}
                      {variantText} × {item.quantity}
                      {item.isPromotionalAddon && (
                        <Chip
                          label="Promo deal"
                          size="small"
                          color="success"
                          sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                      {item.isFreeClaim && (
                        <Chip
                          label="FREE"
                          size="small"
                          color="info"
                          sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                    </Typography>
                  );
                })}
              </Box>
            </Box>
          </>
        )}
      </CardContent>

      <Box sx={{ px: isMobile ? 1.25 : 2, pb: 1.5 }}>
        <Divider sx={{ mb: 1 }} />
        <OrderTotals order={order} />
        {showStatusControl && (
          <Box sx={{ mt: 1.5 }}>
            <OverallStatusSelect order={order} />
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      {(onViewDetails || onDeleteSuccess !== undefined) && (
        <Box sx={{ px: isMobile ? 1.25 : 2, pb: isMobile ? 1.25 : 2 }}>
          <Stack direction="row" spacing={1}>
            {onViewDetails && (
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={() => onViewDetails(order)}
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  py: isMobile ? 0.75 : 1,
                }}
              >
                View Details
              </Button>
            )}
            <OrderDeleteButton
              orderId={order.id ?? ''}
              orderNumber={order.id?.slice(-4)}
              onDeleteSuccess={onDeleteSuccess}
              variant="icon"
              size="small"
            />
          </Stack>
        </Box>
      )}
    </Card>
  );
};

export default OrderCard;
