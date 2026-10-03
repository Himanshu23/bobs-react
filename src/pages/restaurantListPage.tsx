import React, { useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useCurrentMarketId, useMarkets } from '../data/hooks/useMarkets';
import { useRestaurants } from '../data/hooks/useRestaurants';
import { useFoodItems } from '../data/hooks/useFoodItems';
import RestaurantCard from '../components/marketplace/RestaurantCard';
import CartBar from '../components/marketplace/CartBar';
import { Restaurant, DEFAULT_RESTAURANT_ID } from '../types/marketplace';
import {
  MENU_FROM_LIST_STATE,
  restaurantPath,
} from '../utils/marketplaceRoutes';
import { trackEvent } from '../utils/analytics';
import { groupDishImagesByRestaurant } from '../utils/restaurantDisplay';

/**
 * Restaurant list for one market (D11). Routes: `/` (implicit market: first
 * active market, else `market1`) and `/m/:marketId`.
 */
const RestaurantListPage: React.FC = () => {
  const navigate = useNavigate();
  const { marketId: marketIdParam } = useParams<{ marketId?: string }>();
  const { marketId, isResolved: isMarketResolved } =
    useCurrentMarketId(marketIdParam);
  const { data: markets } = useMarkets();
  // On `/`, wait for the markets so we don't fetch the fallback market first.
  const {
    data: restaurants = [],
    isLoading,
    error,
    refetch,
  } = useRestaurants(marketId, { enabled: isMarketResolved });
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);
  // One request for all public items (shared cache with the menu and cart),
  // grouped into each restaurant's dish photos for its card carousel.
  const { data: foodItems, isLoading: isFoodItemsLoading } = useFoodItems();
  const dishImagesByRestaurant = useMemo(
    () => groupDishImagesByRestaurant(foodItems ?? []),
    [foodItems]
  );

  const marketName = markets?.find((market) => market.id === marketId)?.name;

  const openRestaurant = (restaurant: Restaurant) => {
    trackEvent('select_restaurant', {
      restaurant_id: restaurant.id,
      market_id: restaurant.marketId,
    });
    navigate(restaurantPath(restaurant.marketId, restaurant.slug), {
      state: MENU_FROM_LIST_STATE,
    });
  };

  // Default restaurant menu, reachable even when the list is empty or failed
  // (e.g. before the restaurant records are migrated).
  const openDefaultMenu = () =>
    navigate(restaurantPath(marketId, DEFAULT_RESTAURANT_ID), {
      state: MENU_FROM_LIST_STATE,
    });

  let content: React.ReactNode;
  if (isLoading || !isMarketResolved) {
    content = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading restaurants" />
      </Box>
    );
  } else if (error) {
    content = (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Couldn&apos;t load restaurants
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {error.message}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button variant="contained" onClick={() => refetch()}>
            Try again
          </Button>
          <Button variant="outlined" onClick={openDefaultMenu}>
            Bob&apos;s menu
          </Button>
        </Stack>
      </Box>
    );
  } else if (restaurants.length === 0) {
    content = (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          No restaurants here yet
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Check back soon for more places to order from.
        </Typography>
        <Button variant="outlined" onClick={openDefaultMenu}>
          Bob&apos;s menu
        </Button>
      </Box>
    );
  } else {
    content = (
      <Stack spacing={2}>
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onOpen={openRestaurant}
            dishImages={dishImagesByRestaurant.get(restaurant.id)}
            dishImagesLoading={isFoodItemsLoading}
          />
        ))}
      </Stack>
    );
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ pt: 2, pb: totalItems > 0 ? 12 : 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          Restaurants
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {marketName ? `${marketName} · ` : ''}One cart, one delivery from any
          of these restaurants.
        </Typography>
        {content}
      </Container>
      <CartBar />
    </>
  );
};

export default RestaurantListPage;
