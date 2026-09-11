import { CartItem } from '../types';
import {
  PromotionalAddonCampaignDTO,
  PromotionalAddonItemDTO,
  PromotionalAddonsResponseDTO,
} from '../types/promotionalAddons';

export const DEFAULT_PROMO_CAMPAIGN: PromotionalAddonCampaignDTO = {
  id: 'steal-deals-9',
  name: 'Steal Deals @ ₹9',
  minOrderValue: 599,
  promotionalPrice: 9,
  maxItemsPerOrder: 3,
  active: true,
};

/**
 * Compute eligibility and remaining unlock amount for a given cart subtotal.
 */
export const computePromoEligibility = (
  cartSubtotal: number,
  campaign: PromotionalAddonCampaignDTO = DEFAULT_PROMO_CAMPAIGN
): { isEligible: boolean; amountToUnlock: number } => {
  if (!campaign.active) {
    return { isEligible: false, amountToUnlock: campaign.minOrderValue };
  }

  const isEligible = cartSubtotal >= campaign.minOrderValue;
  const amountToUnlock = isEligible
    ? 0
    : Math.ceil(campaign.minOrderValue - cartSubtotal);

  return { isEligible, amountToUnlock };
};

/**
 * Cart subtotal that counts toward unlocking the campaign.
 * Promo add-ons and free-claim items do not count — same as Swiggy/Zomato.
 */
export const getQualifyingCartSubtotal = (cartItems: CartItem[]): number =>
  cartItems
    .filter((item) => !item.isPromotionalAddon && !item.isFreeClaim)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

/**
 * Total savings from promotional add-ons currently in the cart.
 */
export const getCartPromoSavings = (cartItems: CartItem[]): number =>
  cartItems
    .filter((item) => item.isPromotionalAddon && item.originalPrice)
    .reduce(
      (sum, item) => sum + (item.originalPrice! - item.price) * item.quantity,
      0
    );

export const countPromoItemsInCart = (cartItems: CartItem[]): number =>
  cartItems
    .filter((item) => item.isPromotionalAddon)
    .reduce((sum, item) => sum + item.quantity, 0);

/**
 * IDs of promo items already claimed in cart.
 */
export const getClaimedPromoItemIds = (cartItems: CartItem[]): string[] =>
  cartItems.filter((item) => item.isPromotionalAddon).map((item) => item.id);

/**
 * Filter available add-on items:
 * - exclude items already in cart as promo
 * - respect maxItemsPerOrder slot limit
 */
export const filterAvailablePromoItems = (
  allItems: PromotionalAddonItemDTO[],
  cartItems: CartItem[],
  campaign: PromotionalAddonCampaignDTO = DEFAULT_PROMO_CAMPAIGN
): { availableItems: PromotionalAddonItemDTO[]; remainingSlots: number } => {
  const claimedIds = new Set(getClaimedPromoItemIds(cartItems));
  const promoCount = countPromoItemsInCart(cartItems);
  const remainingSlots = Math.max(0, campaign.maxItemsPerOrder - promoCount);

  const availableItems = allItems
    .filter((item) => !claimedIds.has(item.foodItemId))
    .slice(0, remainingSlots > 0 ? allItems.length : 0);

  return { availableItems, remainingSlots };
};

/**
 * Assemble the full promotional add-ons response from raw item list + cart state.
 * Used by the hook (mock) and will mirror backend logic.
 */
export const buildPromotionalAddonsResponse = (
  allItems: PromotionalAddonItemDTO[],
  cartSubtotal: number,
  cartItems: CartItem[],
  campaign: PromotionalAddonCampaignDTO = DEFAULT_PROMO_CAMPAIGN
): PromotionalAddonsResponseDTO => {
  const { isEligible, amountToUnlock } = computePromoEligibility(
    cartSubtotal,
    campaign
  );

  if (!isEligible) {
    return {
      campaign,
      availableItems: [],
      remainingSlots: campaign.maxItemsPerOrder,
      eligible: false,
      amountToUnlock,
    };
  }

  const { availableItems, remainingSlots } = filterAvailablePromoItems(
    allItems,
    cartItems,
    campaign
  );

  return {
    campaign,
    availableItems: remainingSlots > 0 ? availableItems : [],
    remainingSlots,
    eligible: true,
    amountToUnlock: 0,
  };
};

/**
 * Savings shown on a single promotional add-on line item.
 */
export const getPromoItemSavings = (
  originalPrice: number,
  promotionalPrice: number
): number => Math.max(0, originalPrice - promotionalPrice);
