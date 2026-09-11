import { useDispatch } from 'react-redux';
import { Box, Button, Card, Chip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { addToCart } from '../../redux/store';
import { FoodItem } from '../../types';
import { PromotionalAddonsResponseDTO } from '../../types/promotionalAddons';
import { createPromotionalAddonCartItem } from '../../utils/cartUtils';
import { getPromoItemSavings } from '../../utils/promotionalAddonStrategy';
import { trackEvent } from '../../utils/analytics';
import PriceDisplay from '../PriceDisplay';
import FoodImage from '../FoodImage';

interface PromotionalAddonSectionProps {
  promoData: PromotionalAddonsResponseDTO | undefined;
  menuItems: FoodItem[];
  isUpdating?: boolean;
}

/**
 * Horizontal scroll of ₹9 deal items — Instamart-style add-on strip.
 */
const PromotionalAddonSection = ({
  promoData,
  menuItems,
  isUpdating = false,
}: PromotionalAddonSectionProps) => {
  const dispatch = useDispatch();

  if (
    !promoData?.eligible ||
    promoData.availableItems.length === 0 ||
    promoData.remainingSlots <= 0
  ) {
    return null;
  }

  const { campaign, availableItems, remainingSlots } = promoData;

  const handleAdd = (promoItem: (typeof availableItems)[0]) => {
    if (remainingSlots <= 0) return;

    const product = menuItems.find((m) => m.id === promoItem.foodItemId);
    if (!product) return;

    const cartItem = createPromotionalAddonCartItem(promoItem, product);
    dispatch(addToCart(cartItem));

    trackEvent('add_promotional_addon', {
      item_id: promoItem.foodItemId,
      promotional_price: promoItem.promotionalPrice,
      original_price: promoItem.originalPrice,
      source: 'promo_addon_section',
    });
  };

  return (
    <Box
      sx={{
        mb: 3,
        opacity: isUpdating ? 0.7 : 1,
        transition: 'opacity 0.2s ease',
      }}
      aria-busy={isUpdating}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Steal Deals @ ₹{campaign.promotionalPrice}
        </Typography>
        <Chip
          label={`${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} left`}
          size="small"
          color="success"
          variant="outlined"
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          mx: -0.5,
          px: 0.5,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#ccc',
            borderRadius: 2,
          },
        }}
      >
        {availableItems.map((item) => {
          const savings = getPromoItemSavings(
            item.originalPrice,
            item.promotionalPrice
          );
          const discountPct = Math.round((savings / item.originalPrice) * 100);

          return (
            <Card
              key={item.foodItemId}
              sx={{
                minWidth: 140,
                maxWidth: 140,
                flexShrink: 0,
                borderRadius: 2,
                border: '1px solid #e8f5e9',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <Chip
                label={`${discountPct}% OFF`}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 1,
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: '#c2410c',
                  color: '#fff',
                }}
              />
              <FoodImage
                src={item.image}
                alt={item.name}
                size={140}
                sx={{ width: '100%', height: 90, borderRadius: 0 }}
              />

              <Box sx={{ p: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.25,
                    minHeight: '2.5em',
                  }}
                >
                  {item.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ display: 'block', mb: 0.5, color: '#475569' }}
                >
                  {item.size}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 0.5,
                  }}
                >
                  <PriceDisplay
                    nowPrice={item.promotionalPrice}
                    wasPrice={item.originalPrice}
                    nowVariant="body2"
                    wasVariant="caption"
                    gap={0.5}
                  />

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAdd(item)}
                    disabled={isUpdating}
                    sx={{
                      minWidth: 32,
                      width: 32,
                      height: 32,
                      p: 0,
                      borderRadius: 1,
                      bgcolor: '#43a047',
                      '&:hover': { bgcolor: '#2e7d32' },
                    }}
                    aria-label={`Add ${item.name} to cart`}
                  >
                    <AddIcon fontSize="small" />
                  </Button>
                </Box>
              </Box>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default PromotionalAddonSection;
