import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { OrderStatus, OrderFulfillmentType } from '../../types';
import { useOrdersByDateRange } from '../../data/hooks/useOrders';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getTodayDate = (): string => {
  return formatDate(new Date());
};

const getStatusColor = (
  status?: OrderStatus
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'warning';
    case OrderStatus.CONFIRMED:
      return 'info';
    case OrderStatus.PREPARING:
      return 'info';
    case OrderStatus.READY:
      return 'success';
    case OrderStatus.COMPLETED:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

const OrdersTab: React.FC = () => {
  const today = getTodayDate();
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useOrdersByDateRange(fromDate, toDate);

  const handleResetToToday = () => {
    setFromDate(today);
    setToDate(today);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Grid container spacing={3}>
      {/* Date Range Filter Card */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📅 Filter Orders by Date
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <TextField
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ minWidth: 150 }}
              />
              <Button variant="outlined" onClick={handleResetToToday}>
                Reset to Today
              </Button>
              <Tooltip title="Refresh Orders">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isLoading}
                  sx={{
                    color: '#1976d2',
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Orders Summary Card */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                📦 Orders
              </Typography>
              <Typography variant="h6" sx={{ color: '#1976d2' }}>
                Total: {orders.length}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Loading State */}
      {isLoading && (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </Grid>
      )}

      {/* Error State */}
      {error && (
        <Grid item xs={12}>
          <Alert severity="error">Error loading orders: {error.message}</Alert>
        </Grid>
      )}

      {/* Empty State */}
      {!isLoading && !error && orders.length === 0 && (
        <Grid item xs={12}>
          <Alert severity="info">
            No orders found for the selected date range.
          </Alert>
        </Grid>
      )}

      {/* Orders Table */}
      {!isLoading && !error && orders.length > 0 && (
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Customer Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.customerPhone}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.items.length} item(s)
                      </Typography>
                    </TableCell>
                    <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status || 'PENDING'}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.fulfillmentType === OrderFulfillmentType.PICKUP
                          ? 'Pickup'
                          : order.fulfillmentType ===
                              OrderFulfillmentType.SCHEDULED
                            ? 'Scheduled'
                            : 'Delivery'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography
                        variant="body2"
                        sx={{ wordBreak: 'break-word' }}
                      >
                        {order.deliveryAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleTimeString()
                          : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      )}
    </Grid>
  );
};

export default OrdersTab;
