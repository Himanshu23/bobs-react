import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { MarketAdmin } from '../../admin/types/marketplace';
import {
  FormErrors,
  MarketFormValues,
  emptyMarketForm,
  hasErrors,
  marketDeactivationWarnings,
  marketFormToRequest,
  marketToForm,
  validateMarketForm,
} from '../../admin/utils/marketplaceForms';
import { useSaveMarket } from '../../admin/hooks/useMarketplaceAdmin';

interface MarketFormDrawerProps {
  open: boolean;
  /** null = create a new market. */
  market: MarketAdmin | null;
  /** Number of restaurants in this market, for the deactivation warning. */
  restaurantCount: number;
  onClose: () => void;
  onSaved?: (market: MarketAdmin) => void;
}

const MarketFormDrawer: React.FC<MarketFormDrawerProps> = ({
  open,
  market,
  restaurantCount,
  onClose,
  onSaved,
}) => {
  const saveMutation = useSaveMarket();
  const [values, setValues] = useState<MarketFormValues>(emptyMarketForm());
  const [errors, setErrors] = useState<FormErrors<MarketFormValues>>({});

  useEffect(() => {
    if (open) {
      setValues(market ? marketToForm(market) : emptyMarketForm());
      setErrors({});
      saveMutation.reset();
    }
    // Reset only when the drawer (re)opens, not on every mutation render.
  }, [open, market]);

  const isCreating = !market;
  const isDeactivating = Boolean(market?.active) && !values.active;

  const setField = <K extends keyof MarketFormValues>(
    field: K,
    value: MarketFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = () => {
    const nextErrors = validateMarketForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    saveMutation.mutate(
      { id: market?.id, market: marketFormToRequest(values) },
      {
        onSuccess: (saved) => {
          onSaved?.(saved);
          onClose();
        },
      }
    );
  };

  const numberField = (
    field: Exclude<keyof MarketFormValues, 'active'>,
    label: string,
    options: { required?: boolean; helperText?: string; step?: string } = {}
  ) => (
    <TextField
      label={label}
      type="number"
      required={options.required}
      fullWidth
      value={values[field]}
      onChange={(e) => setField(field, e.target.value)}
      error={Boolean(errors[field])}
      helperText={errors[field] ?? options.helperText}
      inputProps={{ step: options.step ?? 'any' }}
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
          {isCreating ? 'Add Market' : 'Edit Market'}
        </Typography>

        {saveMutation.isError && (
          <Alert
            severity="error"
            onClose={() => saveMutation.reset()}
            sx={{ mb: 2 }}
          >
            {saveMutation.error?.message ||
              'Failed to save market. Please try again.'}
          </Alert>
        )}

        <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              required
              fullWidth
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Delivery area
            </Typography>
            <Stack direction="row" spacing={2}>
              {numberField('centerLat', 'Center latitude', {
                required: true,
                helperText: '-90 to 90',
              })}
              {numberField('centerLng', 'Center longitude', {
                required: true,
                helperText: '-180 to 180',
              })}
            </Stack>
            {numberField('radiusKm', 'Radius (km)', {
              required: true,
              helperText: 'Greater than 0',
            })}
            {numberField('deliveryFee', 'Delivery fee (₹)', {
              helperText: 'Flat fee per order, 0 or more (default 20)',
            })}
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
              marketDeactivationWarnings(
                market?.id,
                values.name,
                restaurantCount
              ).map((warning) => (
                <Alert key={warning} severity="warning">
                  {warning}
                </Alert>
              ))}
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
                ? 'Create Market'
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

export default MarketFormDrawer;
