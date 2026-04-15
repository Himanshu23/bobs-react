import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { Order, OrderStatus, OrderFulfillmentType } from '../../types';
import {
  useCurrentOrders,
  useUpdateOrderStatus,
} from '../../data/hooks/useOrders';
import { useOrderWebSocket } from '../../data/hooks/useOrderWebSocket';
import {
  requestNotificationPermission,
  sendBrowserNotification,
  startRepeatNotification,
  stopRepeatNotification,
  initializeAudio,
} from '../../utils/notificationSound';
import { initializeFCM } from '../../utils/firebaseMessaging';

const CurrentOrdersTab: React.FC = () => {
  const [subTab, setSubTab] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [wsOrders, setWsOrders] = useState<Order[]>([]);
  const [alertingOrderId, setAlertingOrderId] = useState<string | null>(null);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Responsive hook for mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    data: fetchedOrders = { orders: [], total: 0 },
    isLoading,
    error,
    refetch,
  } = useCurrentOrders();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Merge WebSocket orders with fetched orders, removing duplicates
  const orders = [
    ...wsOrders,
    ...fetchedOrders.orders.filter(
      (fo) => !wsOrders.some((wo) => wo.id === fo.id)
    ),
  ];

  console.log({ fetchedOrders });

  // Handle new order from WebSocket
  const handleNewOrder = useCallback(
    async (order: Order) => {
      console.log('New order received:', order);

      // Add to WebSocket orders
      setWsOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (!exists) {
          return [order, ...prev];
        }
        return prev;
      });

      // Show alert for new order
      setNewOrderAlert(order);
      if (order.id) {
        setAlertingOrderId(order.id);
      }

      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }

      // Alert stays visible until order is accepted
      // (only clears when user accepts or timeout is manually cleared)

      // Start repeating loud notification if sound is enabled
      if (soundEnabled && order.id) {
        startRepeatNotification(order.id, 2000); // Repeat every 2 seconds
      }

      // Send browser notification if enabled
      await sendBrowserNotification('🔔 NEW ORDER ALERT!', {
        body: `Order ${order.id} from ${order.customerName} - ₹${order.totalAmount.toFixed(2)}`,
        icon: '👨‍🍳',
      });

      // Auto-switch to Unaccepted Orders tab
      setSubTab(0);
    },
    [soundEnabled]
  );

  // Request notification permission on mount and initialize audio + FCM
  useEffect(() => {
    requestNotificationPermission();
    // Initialize audio context with user gesture (required for iOS)
    initializeAudio();
    // Initialize Firebase Cloud Messaging for push notifications
    void initializeFCM();

    // Also setup one-time click handler as additional initialization
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Setup WebSocket listener
  const { isConnected: wsConnected } = useOrderWebSocket(
    handleNewOrder,
    undefined
  );

  // Fetch fresh data when switching tabs
  useEffect(() => {
    void refetch();
  }, [subTab, refetch]);

  // Filter orders by status
  const newOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED
  );
  const preparingOrders = orders.filter(
    (o) => o.status === OrderStatus.PREPARING
  );
  const doneOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);

  // Debug logging
  useEffect(() => {
    console.log('[ORDERS-DEBUG]', {
      totalOrders: orders.length,
      wsOrders: wsOrders.length,
      fetchedOrders: fetchedOrders.orders.length,
      newOrders: newOrders.length,
      preparingOrders: preparingOrders.length,
      doneOrders: doneOrders.length,
      orders: orders.map((o) => ({ id: o.id, status: o.status })),
    });
  }, [
    orders,
    wsOrders.length,
    fetchedOrders.orders.length,
    newOrders.length,
    preparingOrders.length,
    doneOrders.length,
  ]);

  const handleAcceptOrder = (order: Order) => {
    if (order.id) {
      // Stop the repeating alert sound
      if (alertingOrderId === order.id) {
        stopRepeatNotification();
        setAlertingOrderId(null);
      }

      // Clear the alert message
      setNewOrderAlert(null);

      setUpdatingOrderId(order.id);
      updateStatus(
        { orderId: order.id, status: OrderStatus.PREPARING },
        {
          onSuccess: () => {
            // Remove from WebSocket orders - let it be fetched from server
            // This ensures it appears in the correct tab based on server state
            setWsOrders((prev) => prev.filter((o) => o.id !== order.id));
            // Immediately refetch to get the updated order
            void refetch();
          },
          onSettled: () => {
            setUpdatingOrderId(null);
          },
        }
      );
    }
  };

  const handleMarkDone = (order: Order) => {
    if (order.id) {
      setUpdatingOrderId(order.id);
      updateStatus(
        { orderId: order.id, status: OrderStatus.COMPLETED },
        {
          onSuccess: () => {
            // Remove from WebSocket orders - let it be fetched from server
            setWsOrders((prev) => prev.filter((o) => o.id !== order.id));
            // Immediately refetch to get the updated order
            void refetch();
          },
          onSettled: () => {
            setUpdatingOrderId(null);
          },
        }
      );
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      // Stop any repeating notifications
      stopRepeatNotification();
    };
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading current orders: {error.message}
      </Alert>
    );
  }

  // if (orders.length === 0) {
  //   return (
  //     <Alert severity="info">
  //       No active orders at the moment. All orders are completed!
  //     </Alert>
  //   );
  // }

  const displayOrders =
    subTab === 0 ? newOrders : subTab === 1 ? preparingOrders : doneOrders;

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      {/* New Order Alert - PROMINENT */}
      {newOrderAlert && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            backgroundColor: '#ffebee',
            borderLeft: '5px solid #d32f2f',
            animation: soundEnabled ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.7 },
              '100%': { opacity: 1 },
            },
            padding: isMobile ? '12px' : '16px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: isMobile ? 'flex-start' : 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? 1 : 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.95em' : '1.1em',
                }}
              >
                🔔 NEW ORDER ALERT!
              </Typography>
              <Typography
                variant={isMobile ? 'caption' : 'body2'}
                sx={{ fontWeight: 'bold', mt: 0.5 }}
              >
                Order #{newOrderAlert.id}
              </Typography>
              <Typography
                variant={isMobile ? 'caption' : 'body2'}
                sx={{ mt: 0.25 }}
              >
                {newOrderAlert.customerName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.25, display: 'block' }}
              >
                Total: ₹{newOrderAlert.totalAmount.toFixed(2)} (
                {newOrderAlert.items?.length || 0} items)
              </Typography>
              {soundEnabled && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    color: '#c62828',
                    fontWeight: 'bold',
                  }}
                >
                  🔊 Sound repeating every 2s
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              color="error"
              size={isMobile ? 'medium' : 'large'}
              fullWidth={isMobile}
              onClick={() => {
                const order = newOrderAlert;
                handleAcceptOrder(order);
              }}
              sx={{ mt: isMobile ? 1 : 0 }}
            >
              {isMobile ? '✅ Accept' : '✅ ACCEPT ORDER'}
            </Button>
          </Box>
        </Alert>
      )}

      {/* Header with Refresh and Sound Toggle */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 1 : 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 1 : 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant={isMobile ? 'body2' : 'h6'}
            sx={{ fontWeight: 'bold' }}
          >
            🔵 {isMobile ? 'Orders' : 'Active Orders'}: {orders.length}
          </Typography>
          <Chip
            label={
              wsConnected
                ? isMobile
                  ? 'Connected'
                  : 'WS Connected'
                : 'Disconnected'
            }
            color={wsConnected ? 'success' : 'error'}
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
        <Box
          sx={{ display: 'flex', gap: 1, width: isMobile ? '100%' : 'auto' }}
        >
          <Tooltip title={soundEnabled ? 'Sound On' : 'Sound Off'}>
            <IconButton
              size={isMobile ? 'medium' : 'small'}
              onClick={() => setSoundEnabled(!soundEnabled)}
              color={soundEnabled ? 'success' : 'default'}
            >
              {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size={isMobile ? 'small' : 'small'}
            onClick={() => refetch()}
            title="Refresh orders list"
            sx={{ flex: isMobile ? 1 : 'auto' }}
          >
            {isMobile ? '🔄' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Sub-Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={subTab} onChange={(_, nextTab) => setSubTab(nextTab)}>
          <Tab
            label={
              isMobile
                ? `📥 (${newOrders.length})`
                : `📥 New Orders (${newOrders.length})`
            }
            icon={<ThumbUpIcon />}
            iconPosition="start"
          />
          <Tab
            label={
              isMobile
                ? `🍳 (${preparingOrders.length})`
                : `🍳 Preparing (${preparingOrders.length})`
            }
            icon={<LocalShippingIcon />}
            iconPosition="start"
          />
          <Tab
            label={
              isMobile
                ? `✅ (${doneOrders.length})`
                : `✅ Done (${doneOrders.length})`
            }
            icon={<CheckCircleIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Empty State for Current Tab */}
      {displayOrders.length === 0 && (
        <Alert severity="info">
          {subTab === 0 && 'No new orders at the moment.'}
          {subTab === 1 && 'No orders being prepared.'}
          {subTab === 2 && 'No completed orders.'}
        </Alert>
      )}

      {/* Orders Grid */}
      <Grid container spacing={isMobile ? 1 : 2}>
        {displayOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            subTab={subTab}
            isUpdating={isUpdating}
            updatingOrderId={updatingOrderId}
            onAccept={handleAcceptOrder}
            onMarkDone={handleMarkDone}
            isMobile={isMobile}
          />
        ))}
      </Grid>
    </Box>
  );
};

interface OrderCardProps {
  order: Order;
  subTab: number;
  isUpdating: boolean;
  updatingOrderId: string | null;
  onAccept: (order: Order) => void;
  onMarkDone: (order: Order) => void;
  isMobile: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  subTab,
  isUpdating,
  updatingOrderId,
  onAccept,
  onMarkDone,
  isMobile,
}) => {
  const borderColor =
    order.status === OrderStatus.COMPLETED
      ? '#4CAF50'
      : subTab === 1
        ? '#FF9800'
        : '#2196F3';

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid',
          borderColor,
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: isMobile ? 1.5 : 2 }}>
          {/* Header */}
          {/* <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                #{order.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(order.createdAt || '').toLocaleTimeString()}
              </Typography>
            </Box>
            <Chip
              label={getStatusLabel(order.status)}
              color={getStatusColor(order.status)}
              size="small"
            />
          </Box>

          <Divider sx={{ my: 1.5 }} /> */}

          {/* Customer Info */}
          <Box sx={{ mb: isMobile ? 1.5 : 2 }}>
            <Typography
              variant={isMobile ? 'caption' : 'subtitle2'}
              sx={{ fontWeight: 'bold', mb: 0.5 }}
            >
              👤 Customer
            </Typography>
            <Typography variant={isMobile ? 'caption' : 'body2'}>
              {order.customerName}
            </Typography>
            <Typography variant="caption">{order.customerPhone}</Typography>
          </Box>

          {/* Fulfillment Type */}
          <Box sx={{ mb: isMobile ? 1.5 : 2 }}>
            <Typography
              variant={isMobile ? 'caption' : 'subtitle2'}
              sx={{ fontWeight: 'bold', mb: 0.5 }}
            >
              {order.fulfillmentType === OrderFulfillmentType.PICKUP
                ? '🚶 Pickup'
                : order.fulfillmentType === OrderFulfillmentType.SCHEDULED
                  ? '⏰ Scheduled'
                  : '🚚 Delivery'}
            </Typography>
            <Typography variant="caption">{order.deliveryAddress}</Typography>
          </Box>

          {/* Items */}
          <Box sx={{ mb: isMobile ? 1.5 : 2 }}>
            <Typography
              variant={isMobile ? 'caption' : 'subtitle2'}
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              📦 Items ({order.items.length})
            </Typography>
            <List sx={{ py: 0, px: 0 }}>
              {order.items.map((item, idx) => {
                const variants = [];
                if (item.size) variants.push(item.size);
                if (item.style) variants.push(item.style);
                if (item.base) variants.push(item.base);
                const variantText =
                  variants.length > 0 ? ` (${variants.join(', ')})` : '';

                return (
                  <ListItem
                    key={idx}
                    sx={{
                      py: isMobile ? 0.25 : 0.5,
                      px: 0,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                    }}
                  >
                    <ListItemText
                      primary={`${item.itemName}${variantText.length > 20 && isMobile ? '' : variantText} ×${item.quantity}`}
                      secondary={`₹${(item.unitPrice * item.quantity).toFixed(2)}`}
                      primaryTypographyProps={{
                        variant: isMobile ? 'caption' : 'body2',
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>

          <Divider sx={{ my: isMobile ? 1 : 1.5 }} />

          {/* Total */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              variant={isMobile ? 'caption' : 'subtitle2'}
              sx={{ fontWeight: 'bold' }}
            >
              Total:
            </Typography>
            <Typography
              variant={isMobile ? 'caption' : 'subtitle2'}
              sx={{ fontWeight: 'bold', color: '#ff6b6b' }}
            >
              ₹{order.totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>

        {/* Action Buttons */}
        <CardActions
          sx={{
            pt: isMobile ? 1 : 0,
            flexDirection: 'column',
            gap: 1,
            p: isMobile ? 1.5 : 2,
          }}
        >
          {subTab === 0 && (
            <Button
              fullWidth
              variant="contained"
              color="success"
              size={isMobile ? 'small' : 'medium'}
              startIcon={isMobile ? undefined : <ThumbUpIcon />}
              onClick={() => onAccept(order)}
              disabled={isUpdating || updatingOrderId === order.id}
            >
              {updatingOrderId === order.id
                ? 'Accepting...'
                : isMobile
                  ? '✅ Accept'
                  : 'Accept Order'}
            </Button>
          )}

          {subTab === 1 && (
            <Button
              fullWidth
              variant="contained"
              color="success"
              size={isMobile ? 'small' : 'medium'}
              startIcon={isMobile ? undefined : <CheckCircleIcon />}
              onClick={() => onMarkDone(order)}
              disabled={isUpdating || updatingOrderId === order.id}
            >
              {updatingOrderId === order.id
                ? 'Marking...'
                : isMobile
                  ? '✅ Done'
                  : 'Mark Done'}
            </Button>
          )}

          {subTab === 2 && (
            <Button
              fullWidth
              variant="outlined"
              disabled
              size={isMobile ? 'small' : 'medium'}
            >
              ✓ Completed
            </Button>
          )}
        </CardActions>
      </Card>
    </Grid>
  );
};

export default CurrentOrdersTab;
