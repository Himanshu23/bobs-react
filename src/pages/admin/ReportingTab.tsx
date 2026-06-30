import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { formatPrice } from '../../utils/priceUtils';
import { useExpenses } from '../../data/hooks/useExpenses';
import { useOrdersByDateRange } from '../../data/hooks/useOrders';
import { OrderFulfillmentType } from '../../types';

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const getLastWeekDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return formatDate(date);
};

const getTodayDate = (): string => formatDate(new Date());

const ReportingTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const today = getTodayDate();
  const [fromDate, setFromDate] = useState<string>(getLastWeekDate());
  const [toDate, setToDate] = useState<string>(today);

  const {
    data: orderData = { orders: [], totalAmount: 0 },
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrdersByDateRange(fromDate, toDate);

  const {
    data: expenses = [],
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses({ fromDate, toDate });

  const loading = ordersLoading || expensesLoading;
  const error = ordersError || expensesError;

  const totals = useMemo(() => {
    const totalOrders = orderData.orders.length;
    const totalRevenue = orderData.totalAmount ?? 0;
    const averageOrder = totalOrders ? totalRevenue / totalOrders : 0;
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const profit = totalRevenue - totalExpenses;

    const ordersByStatus = orderData.orders.reduce<Record<string, number>>(
      (acc, order) => {
        const status = order.status ?? 'UNKNOWN';
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const ordersByFulfillment = orderData.orders.reduce<Record<string, number>>(
      (acc, order) => {
        const type = order.fulfillmentType || OrderFulfillmentType.DELIVERY;
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const expensesByCategory = expenses.reduce<Record<string, number>>(
      (acc, expense) => {
        acc[expense.categoryName] =
          (acc[expense.categoryName] ?? 0) + expense.amount;
        return acc;
      },
      {}
    );

    return {
      totalOrders,
      totalRevenue,
      averageOrder,
      totalExpenses,
      profit,
      ordersByStatus,
      ordersByFulfillment,
      expensesByCategory,
    };
  }, [orderData.orders, orderData.totalAmount, expenses]);

  const handleRefresh = () => {
    void refetchOrders();
    void refetchExpenses();
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3, width: '100%' }}>
      <Stack spacing={3}>
        <Card>
          <CardContent
            sx={{
              p: isMobile ? 1.5 : 2,
              '&:last-child': { pb: isMobile ? 1.5 : 2 },
            }}
          >
            <Stack
              direction={isMobile ? 'column' : 'row'}
              spacing={2}
              justifyContent="space-between"
              alignItems={isMobile ? 'stretch' : 'center'}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Reporting
                </Typography>
                <Typography color="text.secondary">
                  View revenue, order volume, and expense insights for the
                  selected date range.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh data
              </Button>
            </Stack>

            <Box
              sx={{
                mt: 3,
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : 'repeat(3, minmax(0, 1fr))',
                gap: 16,
              }}
            >
              <TextField
                label="From"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
              <TextField
                label="To"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => {
                  setFromDate(getLastWeekDate());
                  setToDate(today);
                }}
                size="small"
                sx={{ height: 'fit-content' }}
              >
                Last 7 days
              </Button>
            </Box>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error">
            {ordersError ? `Orders error: ${ordersError.message}` : ''}
            {expensesError ? `Expenses error: ${expensesError.message}` : ''}
          </Alert>
        )}

        {!loading && !error && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {formatPrice(totals.totalRevenue)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Orders: {totals.totalOrders}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Average Order Value
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {formatPrice(totals.averageOrder)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Total expenses: {formatPrice(totals.totalExpenses)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Profit
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: totals.profit < 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {formatPrice(totals.profit)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {totals.profit < 0
                      ? 'Negative profit'
                      : 'Net income after expenses'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Orders by Status
                  </Typography>
                  <Stack spacing={1}>
                    {Object.entries(totals.ordersByStatus).map(
                      ([status, count]) => (
                        <Box
                          key={status}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography>{status}</Typography>
                          <Typography sx={{ fontWeight: 700 }}>
                            {count}
                          </Typography>
                        </Box>
                      )
                    )}
                    {Object.keys(totals.ordersByStatus).length === 0 && (
                      <Typography color="text.secondary">
                        No orders found.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Orders by Fulfillment
                  </Typography>
                  <Stack spacing={1}>
                    {Object.entries(totals.ordersByFulfillment).map(
                      ([type, count]) => (
                        <Box
                          key={type}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography>{type}</Typography>
                          <Typography sx={{ fontWeight: 700 }}>
                            {count}
                          </Typography>
                        </Box>
                      )
                    )}
                    {Object.keys(totals.ordersByFulfillment).length === 0 && (
                      <Typography color="text.secondary">
                        No orders found.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Expense Breakdown
                    </Typography>
                    <Typography color="text.secondary">
                      {expenses.length} entries
                    </Typography>
                  </Stack>
                  {Object.entries(totals.expensesByCategory).length > 0 ? (
                    <Stack spacing={1}>
                      {Object.entries(totals.expensesByCategory)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => (
                          <Box
                            key={category}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography>{category}</Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {formatPrice(amount)}
                            </Typography>
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">
                      No expense data for the selected date range.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>
    </Box>
  );
};

export default ReportingTab;
