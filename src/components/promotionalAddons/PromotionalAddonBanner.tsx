import { Box, LinearProgress, Typography } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { PromotionalAddonsResponseDTO } from '../../types/promotionalAddons';

interface PromotionalAddonBannerProps {
  promoData: PromotionalAddonsResponseDTO | undefined;
  cartSubtotal: number;
}

const formatCampaignMessage = (
  message: string,
  amountToUnlock: number,
  promotionalPrice: number
): string =>
  message
    .replaceAll('{amountToUnlock}', String(amountToUnlock))
    .replaceAll('{promotionalPrice}', String(promotionalPrice));

/**
 * Top-of-page banner inspired by Zomato Instamart / Swiggy steal deals.
 * Shows unlock progress or celebrates eligibility with available deal count.
 */
const PromotionalAddonBanner = ({
  promoData,
  cartSubtotal,
}: PromotionalAddonBannerProps) => {
  if (!promoData?.campaign.active) return null;

  const { campaign, eligible, amountToUnlock, availableItems } = promoData;
  const progress = Math.min(100, (cartSubtotal / campaign.minOrderValue) * 100);
  const hasDeals = eligible && availableItems.length > 0;

  // Nothing to show when eligible but all deals claimed / no items
  if (eligible && availableItems.length === 0) return null;

  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        background: eligible
          ? 'linear-gradient(135deg, #14532d 0%, #2f855a 100%)'
          : 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)',
        color: '#fff',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            p: 1,
            display: 'flex',
          }}
        >
          <LocalOfferIcon sx={{ fontSize: 28 }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          {eligible ? (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: '#fff' }}
              >
                🎉 {campaign.title ?? `${campaign.name} Unlocked!`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff' }}>
                {campaign.eligibleMessage
                  ? formatCampaignMessage(
                      campaign.eligibleMessage,
                      amountToUnlock,
                      campaign.promotionalPrice
                    )
                  : `Add ${availableItems.length} item${availableItems.length !== 1 ? 's' : ''} at just ₹${campaign.promotionalPrice} each — scroll down to grab them`}
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: '#fff' }}
              >
                {campaign.title ??
                  `Unlock ₹${campaign.promotionalPrice} Deals!`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff' }}>
                {campaign.unlockMessage
                  ? formatCampaignMessage(
                      campaign.unlockMessage,
                      amountToUnlock,
                      campaign.promotionalPrice
                    )
                  : `Add ₹${amountToUnlock} more to get select items at ₹${campaign.promotionalPrice}`}
              </Typography>
            </>
          )}
        </Box>

        {hasDeals && (
          <Box
            sx={{
              bgcolor: '#fff',
              color: '#2e7d32',
              borderRadius: 2,
              px: 1.5,
              py: 0.75,
              textAlign: 'center',
              minWidth: 56,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>
              ₹{campaign.promotionalPrice}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              ONLY
            </Typography>
          </Box>
        )}
      </Box>

      {!eligible && (
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#fff',
                borderRadius: 3,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ mt: 0.5, display: 'block', color: '#fff' }}
          >
            ₹{cartSubtotal.toFixed(0)} / ₹{campaign.minOrderValue} —{' '}
            {Math.round(progress)}% there
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PromotionalAddonBanner;
