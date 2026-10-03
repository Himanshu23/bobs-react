import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { MarketAdmin } from '../../admin/types/marketplace';
import {
  useAdminMarkets,
  useAdminRestaurants,
  useSaveMarket,
} from '../../admin/hooks/useMarketplaceAdmin';
import {
  marketDeactivationWarnings,
  marketFormToRequest,
  marketToForm,
} from '../../admin/utils/marketplaceForms';
import MarketFormDrawer from './MarketFormDrawer';
import ConfirmDialog from './ConfirmDialog';

const MarketsTab: React.FC = () => {
  const marketsQuery = useAdminMarkets();
  const restaurantsQuery = useAdminRestaurants();
  const saveMutation = useSaveMarket();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MarketAdmin | null>(null);
  const [toggleTarget, setToggleTarget] = useState<MarketAdmin | null>(null);
  const [snackbar, setSnackbar] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  const markets = marketsQuery.data ?? [];
  const restaurantCounts = useMemo(
    () =>
      (restaurantsQuery.data ?? []).reduce<Record<string, number>>(
        (result, restaurant) => {
          result[restaurant.marketId] = (result[restaurant.marketId] ?? 0) + 1;
          return result;
        },
        {}
      ),
    [restaurantsQuery.data]
  );

  const openEdit = (market: MarketAdmin | null) => {
    setEditing(market);
    setDrawerOpen(true);
  };

  // PUT replaces the record, so send every field with only `active` flipped.
  const confirmToggleActive = () => {
    if (!toggleTarget) return;
    saveMutation.mutate(
      {
        id: toggleTarget.id,
        market: {
          ...marketFormToRequest(marketToForm(toggleTarget)),
          active: !toggleTarget.active,
        },
      },
      {
        onSuccess: (saved) => {
          setToggleTarget(null);
          setSnackbar({
            severity: 'success',
            message: `${saved.name} is now ${saved.active ? 'active' : 'inactive'}.`,
          });
        },
        onError: (error) => {
          setToggleTarget(null);
          setSnackbar({ severity: 'error', message: error.message });
        },
      }
    );
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
      >
        <Typography color="text.secondary">
          A market is a cluster of restaurants one rider covers. Its center and
          radius are the delivery area; the fee is charged once per order.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openEdit(null)}
          sx={{ flexShrink: 0 }}
        >
          Add Market
        </Button>
      </Stack>

      {marketsQuery.isLoading && <LinearProgress />}
      {marketsQuery.error && (
        <Alert severity="error">{marketsQuery.error.message}</Alert>
      )}
      {!marketsQuery.isLoading && markets.length === 0 && (
        <Typography color="text.secondary">No markets found.</Typography>
      )}

      {markets.map((market) => (
        <Card
          key={market.id}
          variant="outlined"
          sx={{
            backgroundColor: '#fafafa',
            opacity: market.active ? 1 : 0.65,
            '&:hover': { backgroundColor: '#f5f5f5' },
          }}
        >
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {market.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={market.active ? 'Active' : 'Inactive'}
                    color={market.active ? 'success' : 'default'}
                    variant={market.active ? 'outlined' : 'filled'}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {market.id} · order {market.displayOrder}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 0.5 }}
                >
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Center ${market.center?.lat}, ${market.center?.lng}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Radius ${market.radiusKm} km`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Delivery fee ₹${market.deliveryFee}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${restaurantCounts[market.id] ?? 0} restaurants`}
                  />
                </Stack>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => openEdit(market)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant={market.active ? 'outlined' : 'contained'}
                  color={market.active ? 'warning' : 'success'}
                  onClick={() => setToggleTarget(market)}
                >
                  {market.active ? 'Deactivate' : 'Activate'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <MarketFormDrawer
        open={drawerOpen}
        market={editing}
        restaurantCount={editing ? (restaurantCounts[editing.id] ?? 0) : 0}
        onClose={() => setDrawerOpen(false)}
        onSaved={(saved) =>
          setSnackbar({ severity: 'success', message: `${saved.name} saved.` })
        }
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.active ? 'Deactivate market?' : 'Activate market?'}
        message={
          toggleTarget?.active
            ? `${toggleTarget?.name} will be hidden from customers. There is no delete; you can activate it again later.`
            : `${toggleTarget?.name} and its active restaurants will be shown to customers again.`
        }
        warnings={
          toggleTarget?.active
            ? marketDeactivationWarnings(
                toggleTarget.id,
                toggleTarget.name,
                restaurantCounts[toggleTarget.id] ?? 0
              )
            : []
        }
        confirmLabel={toggleTarget?.active ? 'Deactivate' : 'Activate'}
        confirmColor={toggleTarget?.active ? 'warning' : 'success'}
        loading={saveMutation.isPending}
        onConfirm={confirmToggleActive}
        onCancel={() => setToggleTarget(null)}
      />

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={snackbar?.severity === 'error' ? 8000 : 4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar(null)}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
};

export default MarketsTab;
