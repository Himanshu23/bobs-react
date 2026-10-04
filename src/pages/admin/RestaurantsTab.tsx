import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import { MarketAdmin, RestaurantAdmin } from '../../admin/types/marketplace';
import {
  useAdminMarkets,
  useAdminRestaurants,
  useSaveRestaurant,
} from '../../admin/hooks/useMarketplaceAdmin';
import {
  restaurantDeactivationWarnings,
  restaurantFormToRequest,
  restaurantOpenStatus,
  restaurantToForm,
} from '../../admin/utils/marketplaceForms';
import RestaurantFormDrawer from './RestaurantFormDrawer';
import ConfirmDialog from './ConfirmDialog';

const ALL_MARKETS = 'all';

const RestaurantsTab: React.FC = () => {
  const restaurantsQuery = useAdminRestaurants();
  const marketsQuery = useAdminMarkets();
  const saveMutation = useSaveRestaurant();

  const [marketFilter, setMarketFilter] = useState<string>(ALL_MARKETS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantAdmin | null>(null);
  const [toggleTarget, setToggleTarget] = useState<RestaurantAdmin | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  const restaurants = useMemo(
    () => restaurantsQuery.data ?? [],
    [restaurantsQuery.data]
  );
  const markets = useMemo(() => marketsQuery.data ?? [], [marketsQuery.data]);
  const marketsById = useMemo(
    () =>
      markets.reduce<Record<string, MarketAdmin>>((result, market) => {
        result[market.id] = market;
        return result;
      }, {}),
    [markets]
  );

  const visibleRestaurants = useMemo(
    () =>
      marketFilter === ALL_MARKETS
        ? restaurants
        : restaurants.filter(
            (restaurant) => restaurant.marketId === marketFilter
          ),
    [restaurants, marketFilter]
  );

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (restaurant: RestaurantAdmin) => {
    setEditing(restaurant);
    setDrawerOpen(true);
  };

  const defaultMarketId =
    marketFilter !== ALL_MARKETS
      ? marketFilter
      : (markets.find((market) => market.active)?.id ?? '');

  // PUT replaces the record, so send every field with only `active` flipped.
  const confirmToggleActive = () => {
    if (!toggleTarget) return;
    const nextActive = !toggleTarget.active;
    saveMutation.mutate(
      {
        id: toggleTarget.id,
        restaurant: {
          ...restaurantFormToRequest(restaurantToForm(toggleTarget)),
          active: nextActive,
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

  // Pause/resume orders now (D15): same full-record PUT, only
  // `acceptingOrders` flipped. The save hook refreshes the storefront too.
  const [pausingId, setPausingId] = useState<string | null>(null);
  const togglePause = (restaurant: RestaurantAdmin) => {
    const nextAccepting = restaurant.acceptingOrders === false;
    setPausingId(restaurant.id);
    saveMutation.mutate(
      {
        id: restaurant.id,
        restaurant: {
          ...restaurantFormToRequest(restaurantToForm(restaurant)),
          acceptingOrders: nextAccepting,
        },
      },
      {
        onSuccess: (saved) =>
          setSnackbar({
            severity: 'success',
            message: `${saved.name} ${
              saved.acceptingOrders === false
                ? 'is paused: no new orders until you resume.'
                : 'is taking orders again (within its opening hours).'
            }`,
          }),
        onError: (error) =>
          setSnackbar({ severity: 'error', message: error.message }),
        onSettled: () => setPausingId(null),
      }
    );
  };

  const loadError = restaurantsQuery.error ?? marketsQuery.error;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
      >
        <TextField
          select
          size="small"
          label="Market"
          value={marketFilter}
          onChange={(e) => setMarketFilter(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value={ALL_MARKETS}>All markets</MenuItem>
          {markets.map((market) => (
            <MenuItem key={market.id} value={market.id}>
              {market.name}
              {!market.active && ' (inactive)'}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={marketsQuery.isLoading}
        >
          Add Restaurant
        </Button>
      </Stack>

      {(restaurantsQuery.isLoading || marketsQuery.isLoading) && (
        <LinearProgress />
      )}
      {loadError && <Alert severity="error">{loadError.message}</Alert>}

      {!restaurantsQuery.isLoading && visibleRestaurants.length === 0 && (
        <Typography color="text.secondary">No restaurants found.</Typography>
      )}

      {visibleRestaurants.map((restaurant) => {
        const market = marketsById[restaurant.marketId];
        const openStatus = restaurantOpenStatus(restaurant);
        const paused = restaurant.acceptingOrders === false;
        return (
          <Card
            key={restaurant.id}
            variant="outlined"
            sx={{
              backgroundColor: '#fafafa',
              opacity: restaurant.active ? 1 : 0.65,
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
                <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                  {restaurant.imageUrl && (
                    <Box
                      component="img"
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  )}
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {restaurant.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={restaurant.active ? 'Active' : 'Inactive'}
                        color={restaurant.active ? 'success' : 'default'}
                        variant={restaurant.active ? 'outlined' : 'filled'}
                      />
                      {market && !market.active && (
                        <Chip
                          size="small"
                          color="warning"
                          label="Market inactive"
                        />
                      )}
                      {openStatus && (
                        <Chip
                          size="small"
                          color={openStatus.color}
                          label={openStatus.label}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      /{restaurant.slug} · {market?.name ?? restaurant.marketId}{' '}
                      · order {restaurant.displayOrder}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ mt: 0.5 }}
                    >
                      <PhoneIcon fontSize="inherit" color="action" />
                      <Typography variant="body2">
                        {restaurant.phone}
                      </Typography>
                    </Stack>
                    {restaurant.address && (
                      <Typography variant="body2" color="text.secondary">
                        {restaurant.address}
                      </Typography>
                    )}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 0.5 }}
                    >
                      {(restaurant.cuisineTags ?? []).map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Commission ${restaurant.commissionPercent ?? 0}%`}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Discount share ${
                          restaurant.discountSharePercent ?? 0
                        }%`}
                      />
                    </Stack>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => openEdit(restaurant)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant={restaurant.active ? 'outlined' : 'contained'}
                    color={restaurant.active ? 'warning' : 'success'}
                    onClick={() => setToggleTarget(restaurant)}
                  >
                    {restaurant.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color={paused ? 'success' : 'warning'}
                    disabled={pausingId === restaurant.id}
                    onClick={() => togglePause(restaurant)}
                  >
                    {paused ? 'Resume orders' : 'Pause orders'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      <RestaurantFormDrawer
        open={drawerOpen}
        restaurant={editing}
        markets={markets}
        restaurants={restaurants}
        defaultMarketId={defaultMarketId}
        onClose={() => setDrawerOpen(false)}
        onSaved={(saved) =>
          setSnackbar({
            severity: 'success',
            message: `${saved.name} saved.`,
          })
        }
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={
          toggleTarget?.active
            ? 'Deactivate restaurant?'
            : 'Activate restaurant?'
        }
        message={
          toggleTarget?.active
            ? `${toggleTarget?.name} will be hidden from customers. There is no delete; you can activate it again later.`
            : `${toggleTarget?.name} and its available items will be shown to customers again (if its market is active).`
        }
        warnings={
          toggleTarget?.active
            ? restaurantDeactivationWarnings(toggleTarget.id, toggleTarget.name)
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

export default RestaurantsTab;
