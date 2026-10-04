import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { MarketAdmin, RestaurantAdmin } from '../../admin/types/marketplace';
import {
  FormErrors,
  RestaurantFormValues,
  bobsCollisionWarning,
  defaultScheduleRows,
  emptyRestaurantForm,
  hasErrors,
  restaurantDeactivationWarnings,
  restaurantFormToRequest,
  restaurantToForm,
  slugify,
  validateRestaurantForm,
} from '../../admin/utils/marketplaceForms';
import { useSaveRestaurant } from '../../admin/hooks/useMarketplaceAdmin';
import OpeningHoursEditor from './OpeningHoursEditor';

interface RestaurantFormDrawerProps {
  open: boolean;
  /** null = create a new restaurant. */
  restaurant: RestaurantAdmin | null;
  markets: MarketAdmin[];
  /** All restaurants, to detect a manual "Bob's" before the migration. */
  restaurants: RestaurantAdmin[];
  defaultMarketId?: string;
  onClose: () => void;
  onSaved?: (restaurant: RestaurantAdmin) => void;
}

const RestaurantFormDrawer: React.FC<RestaurantFormDrawerProps> = ({
  open,
  restaurant,
  markets,
  restaurants,
  defaultMarketId = '',
  onClose,
  onSaved,
}) => {
  const saveMutation = useSaveRestaurant();
  const [values, setValues] = useState<RestaurantFormValues>(
    emptyRestaurantForm(defaultMarketId)
  );
  const [errors, setErrors] = useState<FormErrors<RestaurantFormValues>>({});

  useEffect(() => {
    if (open) {
      setValues(
        restaurant
          ? restaurantToForm(restaurant)
          : emptyRestaurantForm(defaultMarketId)
      );
      setErrors({});
      saveMutation.reset();
    }
    // Reset only when the drawer (re)opens, not on every mutation render.
  }, [open, restaurant, defaultMarketId]);

  const isCreating = !restaurant;
  const isDeactivating = Boolean(restaurant?.active) && !values.active;

  const setField = <K extends keyof RestaurantFormValues>(
    field: K,
    value: RestaurantFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = () => {
    const nextErrors = validateRestaurantForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    saveMutation.mutate(
      {
        id: restaurant?.id,
        restaurant: restaurantFormToRequest(values, { isCreate: !restaurant }),
      },
      {
        onSuccess: (saved) => {
          onSaved?.(saved);
          onClose();
        },
      }
    );
  };

  const slugPreview = values.slug.trim()
    ? slugify(values.slug)
    : isCreating
      ? slugify(values.name)
      : (restaurant?.slug ?? '');

  const currentMarketId = restaurant?.marketId;
  const collisionWarning = isCreating
    ? bobsCollisionWarning(values, restaurants)
    : null;

  const numberField = (
    field: keyof RestaurantFormValues,
    label: string,
    extra: { helperText?: string; step?: string } = {}
  ) => (
    <TextField
      label={label}
      type="number"
      fullWidth
      value={values[field] as string}
      onChange={(e) => setField(field, e.target.value as never)}
      error={Boolean(errors[field])}
      helperText={errors[field] ?? extra.helperText}
      inputProps={{ step: extra.step ?? 'any' }}
    />
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saveMutation.isPending ? undefined : onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, p: 0 } }}
    >
      <Box
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          {isCreating ? 'Add Restaurant' : 'Edit Restaurant'}
        </Typography>

        {saveMutation.isError && (
          <Alert
            severity="error"
            onClose={() => saveMutation.reset()}
            sx={{ mb: 2 }}
          >
            {saveMutation.error?.message ||
              'Failed to save restaurant. Please try again.'}
          </Alert>
        )}

        {collisionWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {collisionWarning}
          </Alert>
        )}

        <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Basic Information
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
            <TextField
              label="Slug (optional)"
              fullWidth
              value={values.slug}
              onChange={(e) => setField('slug', e.target.value)}
              error={Boolean(errors.slug)}
              helperText={
                errors.slug ??
                (values.slug.trim()
                  ? `Will be saved as "${slugPreview}"`
                  : isCreating
                    ? `Leave blank to generate from the name${
                        slugPreview ? ` ("${slugPreview}")` : ''
                      }`
                    : `Leave blank to keep "${slugPreview}"`)
              }
            />
            <TextField
              select
              label="Market"
              required
              fullWidth
              value={values.marketId}
              onChange={(e) => setField('marketId', e.target.value)}
              error={Boolean(errors.marketId)}
              helperText={
                errors.marketId ??
                'Only active markets can be chosen for a new or moved restaurant'
              }
            >
              {markets.map((market) => (
                <MenuItem
                  key={market.id}
                  value={market.id}
                  // The backend rejects moving into / creating in an inactive market.
                  disabled={!market.active && market.id !== currentMarketId}
                >
                  {market.name}
                  {!market.active && ' (inactive)'}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Phone"
              required
              fullWidth
              value={values.phone}
              onChange={(e) => setField('phone', e.target.value)}
              error={Boolean(errors.phone)}
              helperText={errors.phone ?? 'Shown to customers'}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={values.address}
              onChange={(e) => setField('address', e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              {numberField('locationLat', 'Latitude', {
                helperText: 'Optional',
              })}
              {numberField('locationLng', 'Longitude', {
                helperText: 'Optional',
              })}
            </Stack>
            <TextField
              label="Image URL"
              fullWidth
              value={values.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
            />
            <Autocomplete
              multiple
              freeSolo
              options={[] as string[]}
              value={values.cuisineTags}
              onChange={(_, next) =>
                setField(
                  'cuisineTags',
                  Array.from(
                    new Set(next.map((tag) => tag.trim()).filter(Boolean))
                  )
                )
              }
              renderTags={(tags, getTagProps) =>
                tags.map((tag, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip key={key} label={tag} size="small" {...tagProps} />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cuisine tags"
                  helperText="Type a tag and press Enter"
                />
              )}
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Opening hours
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.acceptingOrders}
                    onChange={(e) =>
                      setField('acceptingOrders', e.target.checked)
                    }
                  />
                }
                label="Accepting orders"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Turn off to pause orders now; the schedule resumes when you turn
                it back on.
              </Typography>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.hoursEnabled}
                    disabled={values.hasStoredSchedule}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setValues((current) => ({
                        ...current,
                        hoursEnabled: enabled,
                        // Prefill: every day open 11:00–23:00.
                        schedule: enabled
                          ? defaultScheduleRows()
                          : current.schedule,
                      }));
                      setErrors((current) => ({
                        ...current,
                        schedule: undefined,
                      }));
                    }}
                  />
                }
                label="Set opening hours"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                {values.hasStoredSchedule
                  ? 'Times are India time. To be open all day, set open and close to the same time.'
                  : values.hoursEnabled
                    ? 'Times are India time. A close time before the open time means after midnight.'
                    : 'Off: always open (while accepting orders).'}
              </Typography>
            </Box>
            {values.hoursEnabled && (
              <OpeningHoursEditor
                rows={values.schedule}
                onChange={(rows) => setField('schedule', rows)}
                showErrors={Boolean(errors.schedule)}
              />
            )}
            {errors.schedule && (
              <Alert severity="error">{errors.schedule}</Alert>
            )}
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Payout & Display
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2}>
              {numberField('commissionPercent', 'Commission %', {
                helperText: '0–100, default 0',
              })}
              {numberField('discountSharePercent', 'Discount share %', {
                helperText: '0–100, default 0',
              })}
            </Stack>
            {numberField('displayOrder', 'Display order', {
              helperText: 'Lower numbers are listed first',
              step: '1',
            })}
            <FormControlLabel
              control={
                <Switch
                  checked={values.active}
                  onChange={(e) => setField('active', e.target.checked)}
                />
              }
              label={values.active ? 'Active' : 'Inactive'}
            />
            {isDeactivating &&
              restaurantDeactivationWarnings(restaurant?.id, values.name).map(
                (warning) => (
                  <Alert key={warning} severity="warning">
                    {warning}
                  </Alert>
                )
              )}
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={2}
          sx={{ pt: 2, borderTop: '1px solid #ddd' }}
        >
          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={saveMutation.isPending}
            startIcon={
              saveMutation.isPending ? (
                <CircularProgress size={20} />
              ) : undefined
            }
          >
            {saveMutation.isPending
              ? 'Saving...'
              : isCreating
                ? 'Create Restaurant'
                : 'Save Changes'}
          </Button>
          <Button
            variant="text"
            fullWidth
            onClick={onClose}
            disabled={saveMutation.isPending}
          >
            Close
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default RestaurantFormDrawer;
