import React, { useMemo } from 'react';
import {
  alpha,
  Box,
  Button,
  Card,
  Container,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  ErrorOutline as ErrorOutlineIcon,
  LocationOn as LocationOnIcon,
  StorefrontOutlined as StorefrontOutlinedIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useCurrentMarketId, useMarkets } from '../data/hooks/useMarkets';
import { useRestaurants } from '../data/hooks/useRestaurants';
import { useFoodItems } from '../data/hooks/useFoodItems';
import RestaurantCard from '../components/marketplace/RestaurantCard';
import {
  RESTAURANT_CARD_ASPECT_RATIO,
  RESTAURANT_CARD_MIN_HEIGHT,
} from '../components/marketplace/RestaurantImageCarousel';
import CartBar, {
  CART_BAR_CLEARANCE,
  PAGE_BOTTOM_CLEARANCE,
} from '../components/marketplace/CartBar';
import {
  DEFAULT_MARKET_ID,
  DEFAULT_RESTAURANT_ID,
  Restaurant,
} from '../types/marketplace';
import {
  MENU_FROM_LIST_STATE,
  restaurantPath,
} from '../utils/marketplaceRoutes';
import { trackEvent } from '../utils/analytics';
import { groupDishImagesByRestaurant } from '../utils/restaurantDisplay';
import { sortOpenFirst } from '../utils/restaurantHours';

/** Same footprint as a RestaurantCard, so the list doesn't jump on load. */
const RestaurantCardSkeleton = () => (
  <Card
    aria-hidden
    sx={{
      borderRadius: 4,
      boxShadow: '0 2px 12px rgba(43, 38, 36, 0.08)',
      p: 1,
    }}
  >
    <Skeleton
      variant="rectangular"
      animation="wave"
      height="auto"
      sx={{
        borderRadius: 2,
        aspectRatio: RESTAURANT_CARD_ASPECT_RATIO,
        minHeight: RESTAURANT_CARD_MIN_HEIGHT,
      }}
    />
    <Box sx={{ px: 0.75, pt: 1.25, pb: 0.75 }}>
      <Skeleton variant="text" width="55%" sx={{ fontSize: '1.15rem' }} />
      <Skeleton variant="text" width="40%" sx={{ fontSize: '0.85rem' }} />
    </Box>
  </Card>
);

interface ListMessageProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  actions: React.ReactNode;
}

/** Empty and error states: a soft, centred panel. */
const ListMessage = ({ icon, title, body, actions }: ListMessageProps) => (
  <Box
    sx={{
      textAlign: 'center',
      px: 3,
      py: 5,
      borderRadius: 4,
      bgcolor: 'background.paper',
      boxShadow: '0 2px 12px rgba(43, 38, 36, 0.06)',
    }}
  >
    <Box
      aria-hidden
      sx={(theme) => ({
        width: 56,
        height: 56,
        mx: 'auto',
        mb: 2,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: 'primary.main',
        bgcolor: alpha(theme.palette.primary.main, 0.1),
      })}
    >
      {icon}
    </Box>
    <Typography
      component="h2"
      sx={{
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'text.primary',
        mb: 0.5,
      }}
    >
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      {body}
    </Typography>
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      flexWrap="wrap"
      useFlexGap
    >
      {actions}
    </Stack>
  </Box>
);

/**
 * Restaurant list for one market (D11). Routes: `/` (implicit market: first
 * active market, else `market1`) and `/m/:marketId`.
 */
const RestaurantListPage: React.FC = () => {
  const navigate = useNavigate();
  const { marketId: marketIdParam } = useParams<{ marketId?: string }>();
  const { marketId, isResolved: isMarketResolved } =
    useCurrentMarketId(marketIdParam);
  const { data: markets, isPending: isMarketsPending } = useMarkets();
  // On `/`, wait for the markets so we don't fetch the fallback market first.
  const {
    data: restaurantData,
    isLoading,
    error,
    refetch,
  } = useRestaurants(marketId, { enabled: isMarketResolved });
  // Open restaurants first (D15); otherwise the API order.
  const restaurants = useMemo(
    () => sortOpenFirst(restaurantData ?? []),
    [restaurantData]
  );
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);
  // One request for all public items (shared cache with the menu and cart),
  // grouped into each restaurant's dish photos for its card carousel.
  const { data: foodItems, isLoading: isFoodItemsLoading } = useFoodItems();
  const dishImagesByRestaurant = useMemo(
    () => groupDishImagesByRestaurant(foodItems ?? []),
    [foodItems]
  );

  // Fallback name only for the default market; otherwise hide the name.
  const marketName =
    markets?.find((market) => market.id === marketId)?.name ??
    (marketId === DEFAULT_MARKET_ID ? 'Market 1' : null);

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
      <Stack spacing={2.5} aria-busy="true" aria-label="Loading restaurants">
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
      </Stack>
    );
  } else if (error) {
    content = (
      <ListMessage
        icon={<ErrorOutlineIcon />}
        title="Couldn't load restaurants"
        body={error.message}
        actions={
          <>
            <Button variant="contained" onClick={() => refetch()}>
              Try again
            </Button>
            <Button variant="outlined" onClick={openDefaultMenu}>
              Bob&apos;s menu
            </Button>
          </>
        }
      />
    );
  } else if (restaurants.length === 0) {
    content = (
      <ListMessage
        icon={<StorefrontOutlinedIcon />}
        title="No restaurants here yet"
        body="Check back soon for more places to order from."
        actions={
          <Button variant="outlined" onClick={openDefaultMenu}>
            Bob&apos;s menu
          </Button>
        }
      />
    );
  } else {
    content = (
      <Stack spacing={2.5}>
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
      <Container
        maxWidth="sm"
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.5, sm: 2.5 },
          // Keep the last card fully visible above the cart bar / safe area.
          pb: totalItems > 0 ? CART_BAR_CLEARANCE : PAGE_BOTTOM_CLEARANCE,
        }}
      >
        {/* Fixed height, so the line never shifts the list while loading. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            minHeight: 28,
            minWidth: 0,
          }}
        >
          {isMarketsPending ? (
            <Skeleton variant="text" width={190} sx={{ fontSize: '0.95rem' }} />
          ) : (
            marketName && (
              <>
                <LocationOnIcon
                  aria-hidden
                  sx={{ fontSize: '1.15rem', color: 'primary.main' }}
                />
                <Typography
                  noWrap
                  sx={{ fontSize: '0.95rem', color: 'text.secondary', mb: 0 }}
                >
                  Delivering from{' '}
                  <Box
                    component="strong"
                    sx={{ fontWeight: 700, color: 'text.primary' }}
                  >
                    {marketName}
                  </Box>
                </Typography>
              </>
            )
          )}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '0.8rem', mb: 2 }}
        >
          One cart, one delivery from any of these restaurants.
        </Typography>

        {content}
      </Container>
      <CartBar />
    </>
  );
};

export default RestaurantListPage;
