import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formatPrice } from '../../utils/priceUtils';
import { useOrdersByDateRange } from '../../data/hooks/useOrders';
import OrderCard from './OrderCard';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getTodayDate = (): string => {
  return formatDate(new Date());
};

const OrdersTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const today = getTodayDate();
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const {
    data: allOrders = { orders: [], totalAmount: 0 },
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
    <Box sx={{ p: isMobile ? 1 : 3, width: '100%' }}>
      <Grid container spacing={isMobile ? 1 : 2}>
        {/* Date Range Filter Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent
              sx={{
                p: isMobile ? 1.5 : 2,
                '&:last-child': { pb: isMobile ? 1.5 : 2 },
              }}
            >
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                sx={{
                  mb: isMobile ? 1 : 2,
                  fontWeight: 'bold',
                  fontSize: isMobile ? '1rem' : undefined,
                }}
              >
                📅 Filter Orders by Date
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr 1fr'
                    : isTablet
                      ? '1fr 1fr 1fr 0.1fr'
                      : '1fr 1fr 1fr 0.1fr',
                  gap: isMobile ? 0.8 : 1.5,
                  alignItems: 'flex-end',
                }}
              >
                <TextField
                  label="From"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="To"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={handleResetToToday}
                  size="small"
                  fullWidth
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  {isMobile ? 'Reset' : 'Reset to Today'}
                </Button>
                <Tooltip title="Refresh Orders">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={isLoading}
                    size="small"
                    sx={{
                      color: '#1976d2',
                      animation: isLoading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Orders Summary Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent
              sx={{
                p: isMobile ? 1.5 : 2,
                '&:last-child': { pb: isMobile ? 1.5 : 2 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: isMobile ? '1rem' : '1.25rem',
                  }}
                >
                  📦 Orders
                </Typography>
                <Typography
                  sx={{
                    color: '#1976d2',
                    fontSize: isMobile ? '0.9rem' : '1.1rem',
                    fontWeight: 500,
                  }}
                >
                  Total: {allOrders.orders.length}
                </Typography>
                <Typography
                  sx={{
                    color: '#1976d2',
                    fontSize: isMobile ? '0.9rem' : '1.1rem',
                    fontWeight: 500,
                  }}
                >
                  Total Amount: {formatPrice(allOrders.totalAmount ?? 0)}
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
            <Alert severity="error">
              Error loading orders: {error.message}
            </Alert>
          </Grid>
        )}

        {/* Empty State */}
        {!isLoading && !error && allOrders.orders.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No orders found for the selected date range.
            </Alert>
          </Grid>
        )}

        {/* Orders Grid - Mobile Friendly Card Layout */}
        {!isLoading &&
          !error &&
          allOrders.orders.length > 0 &&
          allOrders.orders.map((order) => (
            <Grid key={order.id} item xs={12} sm={6} md={4} lg={3}>
              <OrderCard
                order={order}
                isMobile={isMobile}
                onDeleteSuccess={() => refetch()}
              />
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};

export default OrdersTab;
