import { useMemo } from 'react';
import { alpha, Box, ButtonBase, Card, Typography } from '@mui/material';
import {
  LocalOffer as LocalOfferIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Restaurant } from '../../types/marketplace';
import {
  getCuisineTags,
  getPromoText,
  getRestaurantImages,
  hasOwnRestaurantImage,
  resolveCardMeta,
  RestaurantCardMeta,
} from '../../utils/restaurantDisplay';
import RestaurantImageCarousel from './RestaurantImageCarousel';
import RestaurantInfoButton from './RestaurantInfoSheet';

interface RestaurantCardProps extends RestaurantCardMeta {
  restaurant: Restaurant;
  onOpen: (restaurant: Restaurant) => void;
  /** This restaurant's own dish photos (menu order), used when it has no image. */
  dishImages?: string[];
  /** Dish photos are still loading: show a skeleton rather than no-image. */
  dishImagesLoading?: boolean;
}

/**
 * Zomato-style restaurant card: image carousel, name + ⓘ, cuisines,
 * rating / delivery time / cost for two, and an offer strip. Tapping anywhere
 * (except ⓘ and the carousel dots) opens the menu.
 */
const RestaurantCard = ({
  restaurant,
  onOpen,
  dishImages,
  dishImagesLoading = false,
  rating,
  deliveryTime,
  costForTwo,
}: RestaurantCardProps) => {
  const images = useMemo(
    () => getRestaurantImages(restaurant, dishImages),
    [restaurant, dishImages]
  );
  const imagesLoading = dishImagesLoading && !hasOwnRestaurantImage(restaurant);
  const cuisines = getCuisineTags(restaurant);
  const promoText = getPromoText(restaurant);

  // Rating, delivery time and cost for two have no backend fields yet. Real
  // values can be passed as props later; until then dev builds
  // (`import.meta.env.DEV`) show sample values so the design can be judged
  // locally, and production builds hide the row so customers never see fake
  // numbers. See `resolveCardMeta`.
  const resolvedMeta = resolveCardMeta(
    { rating, deliveryTime, costForTwo },
    import.meta.env.DEV
  );

  const open = () => onOpen(restaurant);

  return (
    <Card
      onClick={open}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(43, 38, 36, 0.08)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: '0 6px 20px rgba(43, 38, 36, 0.14)' },
      }}
    >
      <Box sx={{ p: 1, pb: 0 }}>
        <RestaurantImageCarousel
          images={images}
          restaurantName={restaurant.name}
          height={190}
          loading={imagesLoading}
        />
      </Box>

      <Box sx={{ px: 1.75, pt: 1.25, pb: promoText ? 1 : 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            component="h2"
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'text.primary',
              lineHeight: 1.3,
              mb: 0,
            }}
          >
            {/* Keyboard/screen-reader entry point; the click bubbles to the card. */}
            <ButtonBase
              aria-label={`Open ${restaurant.name} menu`}
              disableRipple
              sx={{
                display: 'block',
                maxWidth: '100%',
                font: 'inherit',
                color: 'inherit',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                borderRadius: 1,
                '&.Mui-focusVisible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              {restaurant.name}
            </ButtonBase>
          </Typography>
          <RestaurantInfoButton
            restaurant={restaurant}
            source="restaurant_card"
            sx={{ mr: -0.75 }}
          />
        </Box>

        {cuisines.length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ fontSize: '0.85rem', mb: 0 }}
          >
            {cuisines.join(', ')}
          </Typography>
        )}

        {resolvedMeta && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              columnGap: 1,
              rowGap: 0.5,
              mt: 0.75,
              color: 'text.secondary',
              fontSize: '0.85rem',
            }}
          >
            {typeof resolvedMeta.meta.rating === 'number' && (
              <Box
                component="span"
                aria-label={`Rated ${resolvedMeta.meta.rating.toFixed(1)}`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 1.5,
                  bgcolor: 'success.main',
                  color: 'common.white',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {resolvedMeta.meta.rating.toFixed(1)}
                <StarIcon sx={{ fontSize: '0.8rem' }} />
              </Box>
            )}
            {resolvedMeta.meta.deliveryTime && (
              <Box component="span" sx={{ fontWeight: 600 }}>
                {resolvedMeta.meta.deliveryTime}
              </Box>
            )}
            {typeof resolvedMeta.meta.costForTwo === 'number' && (
              <>
                {resolvedMeta.meta.deliveryTime && (
                  <Box component="span" aria-hidden>
                    ·
                  </Box>
                )}
                <Box component="span">
                  ₹{resolvedMeta.meta.costForTwo} for two
                </Box>
              </>
            )}
            {resolvedMeta.isSample && (
              <Box
                component="span"
                sx={{
                  ml: 'auto',
                  px: 0.75,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  fontSize: '0.65rem',
                  fontStyle: 'italic',
                }}
              >
                dev sample
              </Box>
            )}
          </Box>
        )}
      </Box>

      {promoText && (
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.75,
            py: 0.875,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderTop: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            color: 'primary.dark',
          })}
        >
          <LocalOfferIcon
            aria-hidden
            sx={{ fontSize: '1rem', flexShrink: 0 }}
          />
          <Typography
            noWrap
            sx={{
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'inherit',
              mb: 0,
              minWidth: 0,
            }}
          >
            {promoText}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export default RestaurantCard;
