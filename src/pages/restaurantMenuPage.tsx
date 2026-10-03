import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import FoodList from './foodList';
import { useRestaurant } from '../data/hooks/useRestaurants';
import { useCurrentMarketId } from '../data/hooks/useMarkets';
import { CurrentRestaurantProvider } from '../context/CurrentRestaurantContext';
import { usePublishRestaurantHeader } from '../context/RestaurantHeaderContext';
import CartBar from '../components/marketplace/CartBar';
import {
  DEFAULT_RESTAURANT_ID,
  FALLBACK_DEFAULT_RESTAURANT,
  Restaurant,
} from '../types/marketplace';
import { CartRestaurantRef } from '../utils/cartUtils';
import {
  isOpenedFromList,
  marketPath,
  restaurantPath,
} from '../utils/marketplaceRoutes';

interface RestaurantMenuPageProps {
  /** Fixed restaurant (legacy `/bobs/*` routes); otherwise read from `:slug`. */
  slug?: string;
}

/**
 * One restaurant's own menu (D11). Routes: `/m/:marketId/r/:slug`, and
 * `/bobs`, `/bobs/menu`, `/bobs/foodList` for Bob's.
 */
const RestaurantMenuPage: React.FC<RestaurantMenuPageProps> = ({ slug }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ marketId?: string; slug?: string }>();
  const idOrSlug = slug ?? params.slug ?? DEFAULT_RESTAURANT_ID;
  const { marketId: fallbackMarketId } = useCurrentMarketId(params.marketId);
  const { data, isLoading, error } = useRestaurant(idOrSlug);

  const isDefault = idOrSlug === DEFAULT_RESTAURANT_ID;
  const restaurant: Restaurant | undefined =
    data ?? (isDefault && error ? FALLBACK_DEFAULT_RESTAURANT : undefined);

  const cartRestaurant = useMemo<CartRestaurantRef | null>(
    () =>
      restaurant
        ? {
            id: restaurant.id,
            name: restaurant.name,
            marketId: restaurant.marketId,
          }
        : null,
    [restaurant]
  );

  // Canonical URL: `/m/<restaurant's market>/r/<slug>`. Only for the `/m/...`
  // route; the legacy `/bobs/*` paths stay as they are.
  useEffect(() => {
    if (!data || slug || !params.marketId) return;
    if (params.marketId !== data.marketId || params.slug !== data.slug) {
      navigate(restaurantPath(data.marketId, data.slug), {
        replace: true,
        state: location.state,
      });
    }
  }, [data, slug, params.marketId, params.slug, navigate, location.state]);

  // Pop back to the list when we came from it; otherwise replace this entry
  // with the list, so hardware/browser back never bounces list ↔ menu.
  const backToList = () => {
    if (isOpenedFromList(location.state)) {
      navigate(-1);
      return;
    }
    navigate(marketPath(restaurant?.marketId ?? fallbackMarketId), {
      replace: true,
    });
  };

  // The app header shows back + name + ⓘ for this restaurant (header.tsx).
  usePublishRestaurantHeader(restaurant ?? null, isLoading, backToList);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading restaurant" />
      </Box>
    );
  }

  if (!restaurant || !cartRestaurant) {
    return (
      <>
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Restaurant not available
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error?.message ?? 'This restaurant could not be found.'}
          </Typography>
          <Button variant="contained" onClick={backToList}>
            See all restaurants
          </Button>
        </Container>
        <CartBar />
      </>
    );
  }

  return (
    <CurrentRestaurantProvider value={cartRestaurant}>
      {/* The name/back/ⓘ now live in the app header; keep a little top space. */}
      <FoodList
        restaurantId={restaurant.id}
        restaurantHeader={<Box aria-hidden sx={{ pt: 1.5 }} />}
      />
      <CartBar />
    </CurrentRestaurantProvider>
  );
};

export default RestaurantMenuPage;
