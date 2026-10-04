import React, { useEffect, useMemo, useRef } from 'react';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
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
import { MenuOrderingProvider } from '../context/MenuOrderingContext';
import {
  getClosedBannerText,
  isRestaurantOrderable,
} from '../utils/restaurantHours';
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
import { trackEvent, trackPageView } from '../utils/analytics';
import { getPageTitle, getRestaurantEntry } from '../utils/analyticsConfig';
import { restaurantParams } from '../utils/analyticsItems';

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
  const needsCanonicalRedirect = Boolean(
    data &&
      !slug &&
      params.marketId &&
      (params.marketId !== data.marketId || params.slug !== data.slug)
  );
  useEffect(() => {
    if (data && needsCanonicalRedirect) {
      navigate(restaurantPath(data.marketId, data.slug), {
        replace: true,
        state: location.state,
      });
    }
  }, [data, needsCanonicalRedirect, navigate, location.state]);

  // "<Restaurant> · Grokheads" once the name is known ("Grokheads" until then).
  const pageTitle = getPageTitle(location.pathname, restaurant?.name);
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  // Analytics: this page owns the page_view of menu routes (App.tsx skips
  // them) so it carries the restaurant title and params. One page_view +
  // one view_restaurant per visit (restaurant id + location.key): re-renders
  // and StrictMode's double effect don't repeat it; back navigation remounts
  // the page and counts as a new visit. Skipped while loading and while the
  // canonical redirect is pending (it is sent for the redirected URL).
  const lastTrackedVisitRef = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading || needsCanonicalRedirect) return;
    const visitKey = `${restaurant?.id ?? `missing:${idOrSlug}`}|${location.key}`;
    if (lastTrackedVisitRef.current === visitKey) return;
    lastTrackedVisitRef.current = visitKey;

    const page = `${location.pathname}${location.search}`;
    if (!restaurant) {
      trackPageView(page, pageTitle, { restaurant_slug: idOrSlug });
      return;
    }
    const restaurantFields = restaurantParams(restaurant);
    trackPageView(page, pageTitle, restaurantFields);
    trackEvent('view_restaurant', {
      ...restaurantFields,
      entry: getRestaurantEntry(location.state),
    });
  }, [
    isLoading,
    needsCanonicalRedirect,
    restaurant,
    idOrSlug,
    location.key,
    location.pathname,
    location.search,
    location.state,
    pageTitle,
  ]);

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

  const orderable = isRestaurantOrderable(restaurant);
  const closedText = restaurant ? getClosedBannerText(restaurant) : null;
  const menuOrdering = useMemo(
    () => ({ orderable, closedText }),
    [orderable, closedText]
  );

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
      <MenuOrderingProvider value={menuOrdering}>
        {closedText && (
          <Box
            role="status"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              px: 2,
              py: 0.875,
              bgcolor: 'rgba(43, 38, 36, 0.06)',
              borderBottom: '1px solid',
              borderColor: 'divider',
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            <AccessTimeIcon
              aria-hidden
              sx={{ fontSize: '1rem', color: 'secondary.main' }}
            />
            {closedText}
          </Box>
        )}
        {/* The name/back/ⓘ now live in the app header; keep a little top space. */}
        <FoodList
          restaurantId={restaurant.id}
          restaurantHeader={<Box aria-hidden sx={{ pt: 1.5 }} />}
        />
        <CartBar />
      </MenuOrderingProvider>
    </CurrentRestaurantProvider>
  );
};

export default RestaurantMenuPage;
