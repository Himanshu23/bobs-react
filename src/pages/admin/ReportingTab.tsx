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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { formatPrice } from '../../utils/priceUtils';
import { useExpenses } from '../../data/hooks/useExpenses';
import { useOrdersByDateRange } from '../../data/hooks/useOrders';
import { OrderFulfillmentType } from '../../types';
import { useSalesReport } from '../../admin/hooks/useAdminReports';
import { useAdminRestaurants } from '../../admin/hooks/useMarketplaceAdmin';
import { SalesGroupBy, SalesRow } from '../../admin/types/orders';
import {
  buildRestaurantFilterOptions,
  filterOrdersByRestaurant,
  formatRupees,
} from '../../admin/utils/adminOrders';
import {
  UTC_DAY_NOTE,
  averageOrderValue,
  dateRangeError,
  salesRowLabel,
  sumSalesRows,
  utcIsoDate,
} from '../../admin/utils/adminReports';
import RestaurantFilterSelect from './RestaurantFilterSelect';

// UTC days, matching the backend's date filters (§5, §9).
const getLastWeekDate = (): string => utcIsoDate(new Date(), 7);

const getTodayDate = (): string => utcIsoDate();

/** Headline tile for one restaurant (or all restaurants). */
const SalesTile: React.FC<{
  title: string;
  orders: number;
  items: number;
  gross: number;
  highlight?: boolean;
}> = ({ title, orders, items, gross, highlight }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Typography
        variant="subtitle2"
        color={highlight ? 'primary.main' : 'text.secondary'}
        sx={{ fontWeight: 700 }}
        gutterBottom
      >
        {title}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
        {orders} orders
      </Typography>
      <Typography sx={{ mt: 0.5 }}>
        Item sales: <strong>{formatRupees(gross)}</strong>
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {items} items · avg{' '}
        {formatRupees(averageOrderValue({ orders, grossSubtotal: gross }))}
        /order
      </Typography>
    </CardContent>
  </Card>
);

/**
 * Order reporting per restaurant (task 5.5): orders, items and item sales
 * from GET /reporting/sales, plus status/fulfillment counts. Delivery-fee
 * earnings and platform totals are left for a separate dashboard.
 */
const ReportingTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const today = getTodayDate();
  const [fromDate, setFromDate] = useState<string>(getLastWeekDate());
  const [toDate, setToDate] = useState<string>(today);
  const [restaurantId, setRestaurantId] = useState('');
  const [groupBy, setGroupBy] = useState<SalesGroupBy>('restaurant');
  const rangeError = dateRangeError(fromDate, toDate);

  // Per-restaurant rows for the headline tiles (always grouped by restaurant).
  const {
    data: byRestaurant,
    isLoading: tilesLoading,
    error: tilesError,
    refetch: refetchTiles,
  } = useSalesReport({
    from: fromDate,
    to: toDate,
    groupBy: 'restaurant',
    restaurantId,
  });
  // Table rows, grouped by the toggle (same query when it's "restaurant").
  const {
    data: sales,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales,
  } = useSalesReport({
    from: fromDate,
    to: toDate,
    groupBy,
    restaurantId,
  });
  const { data: restaurants = [] } = useAdminRestaurants();
  const restaurantOptions = useMemo(
    () => buildRestaurantFilterOptions(restaurants),
    [restaurants]
  );

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

  const loading =
    ordersLoading || expensesLoading || salesLoading || tilesLoading;
  const salesOrTilesError = salesError || tilesError;
  const error = ordersError || expensesError || salesOrTilesError;

  const tableRows: SalesRow[] = sales?.rows ?? [];
  const tileRows: SalesRow[] = byRestaurant?.rows ?? [];
  const rowTotals = useMemo(() => sumSalesRows(tableRows), [tableRows]);
  const tileTotals = useMemo(() => sumSalesRows(tileRows), [tileRows]);

  const counts = useMemo(() => {
    // Status/fulfillment counts come from the order list (the sales report
    // has no per-status data) and follow the restaurant filter.
    const scopedOrders = filterOrdersByRestaurant(
      orderData.orders,
      restaurantId
    );
    const ordersByStatus = scopedOrders.reduce<Record<string, number>>(
      (acc, order) => {
        const status = order.status ?? 'UNKNOWN';
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const ordersByFulfillment = scopedOrders.reduce<Record<string, number>>(
      (acc, order) => {
        const type = order.fulfillmentType || OrderFulfillmentType.DELIVERY;
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      },
      {}
    );
    return { ordersByStatus, ordersByFulfillment };
  }, [orderData.orders, restaurantId]);

  const expensesByCategory = useMemo(
    () =>
      expenses.reduce<Record<string, number>>((acc, expense) => {
        acc[expense.categoryName] =
          (acc[expense.categoryName] ?? 0) + expense.amount;
        return acc;
      }, {}),
    [expenses]
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleRefresh = () => {
    void refetchOrders();
    void refetchExpenses();
    void refetchSales();
    void refetchTiles();
  };

  const countList = (entries: Record<string, number>) => (
    <Stack spacing={1}>
      {Object.entries(entries).map(([key, count]) => (
        <Box
          key={key}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography>{key}</Typography>
          <Typography sx={{ fontWeight: 700 }}>{count}</Typography>
        </Box>
      ))}
      {Object.keys(entries).length === 0 && (
        <Typography color="text.secondary">No orders found.</Typography>
      )}
    </Stack>
  );

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
                  Orders and item sales per restaurant for the selected date
                  range.
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
                  : 'repeat(5, minmax(0, 1fr))',
                gap: 2,
                alignItems: 'center',
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
              <RestaurantFilterSelect
                value={restaurantId}
                options={restaurantOptions}
                onChange={setRestaurantId}
                minWidth={0}
              />
              <ToggleButtonGroup
                size="small"
                exclusive
                value={groupBy}
                onChange={(_, value: SalesGroupBy | null) =>
                  value && setGroupBy(value)
                }
              >
                <ToggleButton value="restaurant">By restaurant</ToggleButton>
                <ToggleButton value="day">By day</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              {UTC_DAY_NOTE} Sales exclude cancelled orders; item sales are at
              menu prices (free items included).
            </Typography>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {rangeError && <Alert severity="warning">{rangeError}</Alert>}

        {error && (
          <Alert severity="error">
            {salesOrTilesError
              ? `Sales report error: ${salesOrTilesError.message} `
              : ''}
            {ordersError ? `Orders error: ${ordersError.message} ` : ''}
            {expensesError ? `Expenses error: ${expensesError.message}` : ''}
          </Alert>
        )}

        {!loading && !error && !rangeError && (
          <Grid container spacing={2}>
            {/* Headline tiles: all restaurants + one per restaurant, or just
                the filtered restaurant. */}
            {!restaurantId && (
              <Grid item xs={12} md={6} lg={4}>
                <SalesTile
                  title="All restaurants"
                  // An order can span restaurants: use the distinct count.
                  orders={byRestaurant?.platform?.orders ?? tileTotals.orders}
                  items={tileTotals.items}
                  gross={tileTotals.grossSubtotal}
                  highlight
                />
              </Grid>
            )}
            {tileRows.map((row) => (
              <Grid
                key={row.restaurantId ?? salesRowLabel(row)}
                item
                xs={12}
                md={6}
                lg={4}
              >
                <SalesTile
                  title={salesRowLabel(row)}
                  orders={row.orders}
                  items={row.items}
                  gross={row.grossSubtotal}
                  highlight={!!restaurantId}
                />
              </Grid>
            ))}
            {tileRows.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">No orders in this range.</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {groupBy === 'day'
                      ? 'Orders by day'
                      : 'Orders by restaurant'}
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            {groupBy === 'day' ? 'Day (UTC)' : 'Restaurant'}
                          </TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Items</TableCell>
                          <TableCell align="right">Item sales</TableCell>
                          <TableCell align="right">Avg / order</TableCell>
                          <TableCell align="right">Free items</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <Typography color="text.secondary">
                                No orders in this range.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {tableRows.map((row) => (
                          <TableRow
                            key={`${row.restaurantId ?? ''}-${row.day ?? ''}`}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>
                              {salesRowLabel(row)}
                            </TableCell>
                            <TableCell align="right">{row.orders}</TableCell>
                            <TableCell align="right">{row.items}</TableCell>
                            <TableCell align="right">
                              {formatRupees(row.grossSubtotal)}
                            </TableCell>
                            <TableCell align="right">
                              {formatRupees(averageOrderValue(row))}
                            </TableCell>
                            <TableCell align="right">
                              {formatRupees(row.freeClaimValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      {tableRows.length > 1 && (
                        <TableFooter>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>
                              Total
                            </TableCell>
                            <TableCell align="right">
                              {/* An order can span restaurants, so the
                                  per-restaurant counts don't add up. */}
                              {groupBy === 'restaurant'
                                ? (sales?.platform?.orders ?? '')
                                : rowTotals.orders}
                            </TableCell>
                            <TableCell align="right">
                              {rowTotals.items}
                            </TableCell>
                            <TableCell align="right">
                              {formatRupees(rowTotals.grossSubtotal)}
                            </TableCell>
                            <TableCell align="right" />
                            <TableCell align="right">
                              {formatRupees(rowTotals.freeClaimValue)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Orders by Status
                  </Typography>
                  {countList(counts.ordersByStatus)}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Orders by Fulfillment
                  </Typography>
                  {countList(counts.ordersByFulfillment)}
                </CardContent>
              </Card>
            </Grid>

            {/* Kept for now: the Expenses tabs have no all-categories
                breakdown (Expense List filters one category at a time). */}
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
                      {expenses.length} entries · {formatPrice(totalExpenses)}
                    </Typography>
                  </Stack>
                  {Object.entries(expensesByCategory).length > 0 ? (
                    <Stack spacing={1}>
                      {Object.entries(expensesByCategory)
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
