import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAdminRestaurants } from '../../admin/hooks/useMarketplaceAdmin';
import {
  useMarkPayoutsPaid,
  usePayoutReport,
} from '../../admin/hooks/useAdminReports';
import {
  PayoutStatus,
  RestaurantPayoutSummary,
} from '../../admin/types/orders';
import {
  buildRestaurantFilterOptions,
  formatRupees,
  getPayoutChipColor,
  getStatusChipColor,
} from '../../admin/utils/adminOrders';
import {
  UTC_DAY_NOTE,
  buildMarkPaidRequest,
  dateRangeError,
  formatMarkPaidResult,
  formatPayoutTotals,
  linesForRestaurant,
  unpaidSelection,
  utcIsoDate,
  utcMonthStart,
} from '../../admin/utils/adminReports';
import RestaurantFilterSelect from './RestaurantFilterSelect';

const formatDateTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

/**
 * Restaurant payouts (task 5.4, contract §5.9): owed/paid per restaurant for
 * a date range, a drill-down of the sub-order lines, and "Mark paid".
 */
const PayoutsTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [from, setFrom] = useState(utcMonthStart());
  const [to, setTo] = useState(utcIsoDate());
  const [restaurantId, setRestaurantId] = useState('');
  const [status, setStatus] = useState<PayoutStatus | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogRestaurant, setDialogRestaurant] =
    useState<RestaurantPayoutSummary | null>(null);
  const [payoutRef, setPayoutRef] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const rangeError = dateRangeError(from, to);
  const filters = { from, to, restaurantId, status };
  const {
    data: report,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePayoutReport(filters);
  const { data: restaurants = [] } = useAdminRestaurants();
  const markPaid = useMarkPayoutsPaid();

  const restaurantOptions = useMemo(
    () => buildRestaurantFilterOptions(restaurants),
    [restaurants]
  );
  const totals = formatPayoutTotals(report);
  const expandedLines = expandedId
    ? linesForRestaurant(report, expandedId)
    : [];

  const toggleExpanded = (id: string) => {
    setSelectedIds([]);
    setExpandedId((current) => (current === id ? null : id));
  };

  const toggleSelected = (orderId: string) =>
    setSelectedIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    );

  const openMarkPaid = (summary: RestaurantPayoutSummary) => {
    if (summary.restaurantId !== expandedId) setSelectedIds([]);
    setDialogRestaurant(summary);
    setPayoutRef('');
    setDialogError(null);
    setResultMessage(null);
  };

  const dialogOrderIds =
    dialogRestaurant && dialogRestaurant.restaurantId === expandedId
      ? selectedIds
      : [];
  const preview = dialogRestaurant
    ? unpaidSelection(report, dialogRestaurant.restaurantId, dialogOrderIds)
    : { count: 0, amount: 0 };

  const handleConfirmMarkPaid = () => {
    if (!dialogRestaurant) return;
    const built = buildMarkPaidRequest({
      restaurantId: dialogRestaurant.restaurantId,
      payoutRef,
      from,
      to,
      orderIds: dialogOrderIds,
    });
    if (built.error !== undefined) {
      setDialogError(built.error);
      return;
    }
    setDialogError(null);
    markPaid.mutate(built.request, {
      onSuccess: (result) => {
        setResultMessage(formatMarkPaidResult(result));
        setDialogRestaurant(null);
        setSelectedIds([]);
      },
      onError: (err) => setDialogError(err.message),
    });
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3, width: '100%' }}>
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Restaurant payouts
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr 1fr'
                  : 'repeat(5, minmax(0, 1fr))',
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              <TextField
                label="From"
                type="date"
                size="small"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <RestaurantFilterSelect
                value={restaurantId}
                options={restaurantOptions}
                onChange={(id) => {
                  setRestaurantId(id);
                  setExpandedId(id || null);
                  setSelectedIds([]);
                }}
                minWidth={0}
              />
              <TextField
                select
                size="small"
                label="Payout status"
                value={status}
                onChange={(e) => setStatus(e.target.value as PayoutStatus | '')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="UNPAID">Unpaid</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
              </TextField>
              <Button
                variant="outlined"
                onClick={() => refetch()}
                disabled={isFetching || !!rangeError}
              >
                {isFetching ? 'Loading…' : 'Refresh'}
              </Button>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              {UTC_DAY_NOTE} Leave a date empty for an open range. Cancelled
              restaurant orders are not included.
            </Typography>
          </CardContent>
        </Card>

        {rangeError && <Alert severity="warning">{rangeError}</Alert>}
        {error && <Alert severity="error">{error.message}</Alert>}
        {resultMessage && (
          <Alert severity="success" onClose={() => setResultMessage(null)}>
            {resultMessage}
          </Alert>
        )}

        {isLoading && !rangeError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {report && (
          <>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Owed (unpaid)
                    </Typography>
                    <Typography
                      variant={isMobile ? 'h6' : 'h4'}
                      sx={{ fontWeight: 800, color: 'warning.main' }}
                    >
                      {totals.owed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {totals.unpaidLines} restaurant orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Paid
                    </Typography>
                    <Typography
                      variant={isMobile ? 'h6' : 'h4'}
                      sx={{ fontWeight: 800, color: 'success.main' }}
                    >
                      {totals.paid}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {totals.paidLines} restaurant orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Restaurant</TableCell>
                      <TableCell align="right">Owed</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Unpaid / paid</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.restaurants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography color="text.secondary">
                            No payout lines for these filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {report.restaurants.map((summary) => (
                      <TableRow
                        key={summary.restaurantId}
                        selected={summary.restaurantId === expandedId}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {summary.restaurantName}
                        </TableCell>
                        <TableCell align="right">
                          {formatRupees(summary.owedAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatRupees(summary.paidAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {summary.unpaidCount} / {summary.paidCount}
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Button
                              size="small"
                              onClick={() =>
                                toggleExpanded(summary.restaurantId)
                              }
                            >
                              {summary.restaurantId === expandedId
                                ? 'Hide lines'
                                : 'Lines'}
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={summary.unpaidCount === 0}
                              onClick={() => openMarkPaid(summary)}
                            >
                              Mark paid
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {expandedId && (
              <Card variant="outlined">
                <CardContent>
                  <Stack
                    direction={isMobile ? 'column' : 'row'}
                    justifyContent="space-between"
                    alignItems={isMobile ? 'flex-start' : 'center'}
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {report.restaurants.find(
                        (r) => r.restaurantId === expandedId
                      )?.restaurantName ?? expandedId}{' '}
                      lines ({expandedLines.length})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedIds.length
                        ? `${selectedIds.length} selected: "Mark paid" will pay only these`
                        : 'Tick unpaid lines to pay only those; otherwise the whole date range is paid'}
                    </Typography>
                  </Stack>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" />
                          <TableCell>Placed</TableCell>
                          <TableCell>Order</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                          <TableCell align="right">Commission</TableCell>
                          <TableCell align="right">Discount share</TableCell>
                          <TableCell align="right">Payout</TableCell>
                          <TableCell>Payout status</TableCell>
                          <TableCell>Ref / paid at</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expandedLines.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10}>
                              <Typography color="text.secondary">
                                No lines for these filters.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {expandedLines.map((line) => (
                          <TableRow
                            key={`${line.orderId}-${line.restaurantId}`}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                disabled={line.payoutStatus !== 'UNPAID'}
                                checked={selectedIds.includes(line.orderId)}
                                onChange={() => toggleSelected(line.orderId)}
                                inputProps={{
                                  'aria-label': `Select order ${line.orderId}`,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {formatDateTime(line.createdAt)}
                            </TableCell>
                            <TableCell title={line.orderId}>
                              #{line.orderId.slice(-6)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={line.status}
                                size="small"
                                color={getStatusChipColor(line.status)}
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatRupees(line.subtotal)}
                            </TableCell>
                            <TableCell align="right">
                              {formatRupees(line.commissionAmount)}
                            </TableCell>
                            <TableCell align="right">
                              {formatRupees(line.discountShareAmount)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {formatRupees(line.payoutAmount)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={line.payoutStatus}
                                size="small"
                                variant="outlined"
                                color={getPayoutChipColor(line.payoutStatus)}
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {line.payoutRef
                                ? `${line.payoutRef} · ${formatDateTime(line.paidAt)}`
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Stack>

      <Dialog
        open={!!dialogRestaurant}
        onClose={
          markPaid.isPending ? undefined : () => setDialogRestaurant(null)
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Mark {dialogRestaurant?.restaurantName} paid
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>
              {dialogOrderIds.length
                ? `Pays the ${dialogOrderIds.length} selected line(s).`
                : `Pays every unpaid ${dialogRestaurant?.restaurantName} line placed from ${from || '…'} to ${to || '…'} (UTC days).`}
            </Typography>
            <Alert severity="info">
              From the lines shown: {preview.count} unpaid line(s),{' '}
              {formatRupees(preview.amount)}. Lines that are already paid are
              left unchanged, so repeating this is safe.
            </Alert>
            <TextField
              label="Payout reference"
              placeholder="e.g. UTR 1234 / cash"
              value={payoutRef}
              onChange={(e) => setPayoutRef(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogRestaurant(null)}
            disabled={markPaid.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmMarkPaid}
            disabled={markPaid.isPending || !payoutRef.trim()}
            startIcon={
              markPaid.isPending ? <CircularProgress size={18} /> : undefined
            }
          >
            Confirm mark paid
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayoutsTab;
