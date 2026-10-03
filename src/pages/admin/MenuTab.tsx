import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { FoodItem, CATEGORY_ORDER } from '../../types';
import {
  AdminFoodItem,
  MarketAdmin,
  RestaurantAdmin,
} from '../../admin/types/marketplace';
import {
  itemVisibilityIssue,
  resolveRestaurantId,
} from '../../admin/utils/marketplaceForms';
import MenuItemCard from './MenuItemCard';

const ALL_RESTAURANTS = 'all';

interface MenuTabProps {
  items: AdminFoodItem[];
  restaurants?: RestaurantAdmin[];
  markets?: MarketAdmin[];
  onAddItem?: (restaurantId?: string) => void;
  onEditItem?: (item: FoodItem) => void;
  onDeleteItem?: (item: FoodItem) => void;
  onToggleAvailability?: (item: FoodItem) => void;
}

const MenuTab: React.FC<MenuTabProps> = ({
  items,
  restaurants = [],
  markets = [],
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleAvailability,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [restaurantFilter, setRestaurantFilter] =
    useState<string>(ALL_RESTAURANTS);

  const restaurantsById = useMemo(
    () =>
      restaurants.reduce<Record<string, RestaurantAdmin>>(
        (result, restaurant) => {
          result[restaurant.id] = restaurant;
          return result;
        },
        {}
      ),
    [restaurants]
  );
  const marketsById = useMemo(
    () =>
      markets.reduce<Record<string, MarketAdmin>>((result, market) => {
        result[market.id] = market;
        return result;
      }, {}),
    [markets]
  );

  // Restaurant ids used by items but without a restaurant record (e.g. `bobs`
  // before the migration) still get a filter option.
  const filterOptions = useMemo(() => {
    const known = restaurants.map((restaurant) => ({
      id: restaurant.id,
      label: `${restaurant.name}${restaurant.active ? '' : ' (inactive)'}`,
    }));
    const unknownIds = Array.from(
      new Set(items.map((item) => resolveRestaurantId(item.restaurantId)))
    ).filter((id) => !restaurantsById[id]);
    return [...known, ...unknownIds.map((id) => ({ id, label: id }))];
  }, [items, restaurants, restaurantsById]);

  const filteredItems = useMemo(
    () =>
      restaurantFilter === ALL_RESTAURANTS
        ? items
        : items.filter(
            (item) =>
              resolveRestaurantId(item.restaurantId) === restaurantFilter
          ),
    [items, restaurantFilter]
  );

  const getInactiveLabel = (item: AdminFoodItem): string | undefined => {
    const issue = itemVisibilityIssue(
      item.restaurantId,
      restaurantsById,
      marketsById
    );
    if (issue === 'restaurant-inactive') return 'Inactive restaurant';
    if (issue === 'market-inactive') return 'Inactive market';
    return undefined;
  };

  const getRestaurantLabel = (item: AdminFoodItem): string | undefined => {
    // Only useful when several restaurants are shown together.
    if (restaurantFilter !== ALL_RESTAURANTS || filterOptions.length < 2) {
      return undefined;
    }
    const id = resolveRestaurantId(item.restaurantId);
    return restaurantsById[id]?.name ?? id;
  };

  const categorizedMenuItems = useMemo(() => {
    const groups = filteredItems.reduce<Record<string, AdminFoodItem[]>>(
      (result, item) => {
        if (!result[item.category]) {
          result[item.category] = [];
        }

        result[item.category].push(item);
        return result;
      },
      {}
    );

    const knownCategories = CATEGORY_ORDER.filter(
      (category) => groups[category]
    );
    const extraCategories = Object.keys(groups)
      .filter((category) => !CATEGORY_ORDER.includes(category as never))
      .sort((left, right) => left.localeCompare(right));

    return [...knownCategories, ...extraCategories].map((category) => ({
      category,
      items: groups[category]
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name)),
    }));
  }, [filteredItems]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

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
          label="Restaurant"
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value={ALL_RESTAURANTS}>All restaurants</MenuItem>
          {filterOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {onAddItem && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() =>
              onAddItem(
                restaurantFilter === ALL_RESTAURANTS
                  ? undefined
                  : restaurantFilter
              )
            }
          >
            Add Item
          </Button>
        )}
      </Stack>

      {categorizedMenuItems.length === 0 && (
        <Typography color="text.secondary">No menu items found.</Typography>
      )}

      {categorizedMenuItems.map(({ category, items: categoryItems }) => {
        const vegItems = categoryItems.filter((item) => item.veg);
        const nonVegItems = categoryItems.filter((item) => !item.veg);

        return (
          <Card key={category} variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                onClick={() => toggleCategory(category)}
                sx={{ cursor: 'pointer' }}
              >
                <Box />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ flex: 1 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {category}
                  </Typography>
                  <Chip
                    label={`${categoryItems.length} items`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
                <IconButton
                  size="small"
                  sx={{
                    transform: expandedCategories[category]
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Stack>

              <Collapse in={expandedCategories[category]} timeout="auto">
                <Box sx={{ mt: 2 }}>
                  {/* Veg Items Accordion */}
                  {vegItems.length > 0 && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Chip
                          label={`🥬 Vegetarian (${vegItems.length})`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5} sx={{ width: '100%' }}>
                          {vegItems.map((item) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              onEditItem={onEditItem}
                              onDeleteItem={onDeleteItem}
                              onToggleAvailability={onToggleAvailability}
                              restaurantLabel={getRestaurantLabel(item)}
                              inactiveLabel={getInactiveLabel(item)}
                              backgroundColor="#f1f8f4"
                              hoverColor="#e8f5e9"
                            />
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Non-Veg Items Accordion */}
                  {nonVegItems.length > 0 && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Chip
                          label={`🍗 Non-Vegetarian (${nonVegItems.length})`}
                          variant="outlined"
                          size="small"
                        />
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5} sx={{ width: '100%' }}>
                          {nonVegItems.map((item) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              onEditItem={onEditItem}
                              onDeleteItem={onDeleteItem}
                              onToggleAvailability={onToggleAvailability}
                              restaurantLabel={getRestaurantLabel(item)}
                              inactiveLabel={getInactiveLabel(item)}
                              backgroundColor="#fce4ec"
                              hoverColor="#f8bbd0"
                            />
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default MenuTab;
