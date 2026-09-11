import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FoodItem } from '../../types';
import {
  PromotionalAddonConfigDTO,
  SavePromotionalAddonConfigDTO,
} from '../../types/promotionalAddons';
import {
  usePromotionalAddonConfig,
  useSavePromotionalAddonConfig,
} from '../../data/hooks/usePromotionalAddonConfig';

interface PromotionalAddonsTabProps {
  foodItems: FoodItem[];
}

const DEFAULT_CONFIG: SavePromotionalAddonConfigDTO = {
  title: 'Steal Deals @ ₹9',
  unlockMessage: 'Add ₹{amountToUnlock} more to unlock selected dishes.',
  eligibleMessage: 'Select a promotional dish for just ₹{promotionalPrice}.',
  minOrderValue: 599,
  promotionalPrice: 9,
  maxItemsPerOrder: 3,
  active: true,
  dishes: [],
};

const getInitialConfig = (
  config: PromotionalAddonConfigDTO | undefined
): SavePromotionalAddonConfigDTO => config ?? DEFAULT_CONFIG;

const PromotionalAddonsTab = ({ foodItems }: PromotionalAddonsTabProps) => {
  const { data, isLoading, error } = usePromotionalAddonConfig();
  const saveMutation = useSavePromotionalAddonConfig();
  const [config, setConfig] = useState<SavePromotionalAddonConfigDTO>(
    getInitialConfig(data)
  );

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const selectedIds = new Set(config.dishes.map((dish) => dish.foodItemId));

  const toggleDish = (foodItem: FoodItem) => {
    if (selectedIds.has(foodItem.id)) {
      setConfig((current) => ({
        ...current,
        dishes: current.dishes.filter(
          (dish) => dish.foodItemId !== foodItem.id
        ),
      }));
      return;
    }

    const size = foodItem.priceOptions.nowPrice.size.Quarter
      ? 'Quarter'
      : foodItem.priceOptions.nowPrice.size.Half
        ? 'Half'
        : 'Full';
    setConfig((current) => ({
      ...current,
      dishes: [
        ...current.dishes,
        {
          foodItemId: foodItem.id,
          promotionalPrice: current.promotionalPrice,
          size,
        },
      ],
    }));
  };
  useEffect(() => {
    console.log({ config });
  }, [config]);

  const updateNumber = (
    field: 'minOrderValue' | 'promotionalPrice' | 'maxItemsPerOrder',
    value: string
  ) => {
    setConfig((current) => ({ ...current, [field]: Number(value) || 0 }));
  };

  const handleSave = () => {
    const dishes = config.dishes.map((dish) => {
      const foodItem = foodItems.find((item) => item.id === dish.foodItemId);
      const size =
        dish.size ??
        (foodItem?.priceOptions.nowPrice.size.Quarter
          ? 'Quarter'
          : foodItem?.priceOptions.nowPrice.size.Half
            ? 'Half'
            : 'Full');

      return { ...dish, size };
    });

    saveMutation.mutate({ ...config, dishes });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Promotional add-ons
        </Typography>
        <Typography color="text.secondary">
          Define the customer copy, unlock rules, and dishes available in this
          promotion.
        </Typography>
      </Box>

      {error && (
        <Alert severity="info">
          No saved promotion was found. Configure a new one below.
        </Alert>
      )}
      {saveMutation.isSuccess && (
        <Alert severity="success">Promotion saved successfully.</Alert>
      )}
      {saveMutation.error && (
        <Alert severity="error">{saveMutation.error.message}</Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Promotion title"
            value={config.title}
            onChange={(event) =>
              setConfig({ ...config, title: event.target.value })
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Promotion ID"
            value={config.id ?? 'Created on save'}
            disabled
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Unlock message"
            helperText="Use {amountToUnlock} and {promotionalPrice} as placeholders."
            value={config.unlockMessage}
            onChange={(event) =>
              setConfig({ ...config, unlockMessage: event.target.value })
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Eligible message"
            helperText="Use {promotionalPrice} as a placeholder."
            value={config.eligibleMessage}
            onChange={(event) =>
              setConfig({ ...config, eligibleMessage: event.target.value })
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Minimum order value"
            value={config.minOrderValue}
            onChange={(event) =>
              updateNumber('minOrderValue', event.target.value)
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Promotional price"
            value={config.promotionalPrice}
            onChange={(event) =>
              updateNumber('promotionalPrice', event.target.value)
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Maximum items per order"
            value={config.maxItemsPerOrder}
            onChange={(event) =>
              updateNumber('maxItemsPerOrder', event.target.value)
            }
          />
        </Grid>
      </Grid>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Map dishes to this promotion
        </Typography>
        <Grid container spacing={1}>
          {foodItems.map((foodItem) => (
            <Grid item xs={12} sm={6} md={4} key={foodItem.id}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedIds.has(foodItem.id)}
                    onChange={() => toggleDish(foodItem)}
                  />
                }
                label={foodItem.name}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <FormControlLabel
          control={
            <Checkbox
              checked={config.active}
              onChange={(event) =>
                setConfig({ ...config, active: event.target.checked })
              }
            />
          }
          label="Promotion active"
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            isLoading || saveMutation.isPending || config.dishes.length === 0
          }
        >
          {saveMutation.isPending ? 'Saving...' : 'Save promotion'}
        </Button>
      </Stack>
    </Stack>
  );
};

export default PromotionalAddonsTab;
