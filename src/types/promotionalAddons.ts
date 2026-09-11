/**
 * Promotional add-on (Steal Deals @ ₹9) DTOs.
 *
 * Backend contract (to be implemented):
 *   GET  /api/promotional-addons/available?cartSubtotal=&claimedItemIds=
 *        → PromotionalAddonsResponseDTO
 *   POST /api/promotional-addons/validate
 *        → ValidatePromotionalAddonResponseDTO
 *
 * Eligibility is based on qualifying cart subtotal (regular items only).
 * Promo add-ons do not count toward the ₹599 unlock threshold.
 */
import { ItemOptions } from './index';

/**
 * Campaign configuration returned by the backend.
 * Mirrors future GET /promotional-addons/config response.
 */
export interface PromotionalAddonCampaignDTO {
  id: string;
  name: string;
  /** Customer-facing promotion title. */
  title?: string;
  /** Customer-facing copy shown before eligibility. */
  unlockMessage?: string;
  /** Customer-facing copy shown after eligibility. */
  eligibleMessage?: string;
  minOrderValue: number;
  promotionalPrice: number;
  maxItemsPerOrder: number;
  active: boolean;
}

/** A dish mapped by an administrator to a promotional campaign. */
export interface PromotionalAddonDishMappingDTO {
  foodItemId: string;
  promotionalPrice: number;
  size: ItemOptions['size'];
  style?: ItemOptions['style'];
  base?: ItemOptions['base'];
}

/** Backend payload used to create or update a promotional campaign. */
export interface PromotionalAddonConfigDTO {
  id: string;
  title: string;
  unlockMessage: string;
  eligibleMessage: string;
  minOrderValue: number;
  promotionalPrice: number;
  maxItemsPerOrder: number;
  active: boolean;
  dishes: PromotionalAddonDishMappingDTO[];
}

export type SavePromotionalAddonConfigDTO = Omit<
  PromotionalAddonConfigDTO,
  'id'
> & { id?: string };

/**
 * A single dish eligible for the promotional add-on price.
 * Separate schema from FoodItem — backend curates these independently.
 */
export interface PromotionalAddonItemDTO {
  foodItemId: string;
  name: string;
  image: string;
  description?: string;
  veg: boolean;
  /** Regular selling price before the promotional discount */
  originalPrice: number;
  /** Locked promotional price (e.g. ₹9) */
  promotionalPrice: number;
  /** Pre-selected portion/size for this add-on offer */
  size: ItemOptions['size'];
  style?: ItemOptions['style'];
  base?: ItemOptions['base'];
}

/**
 * Request sent to GET /promotional-addons/available
 * (to be implemented on backend).
 */
export interface GetPromotionalAddonsRequestDTO {
  cartSubtotal: number;
  /** IDs of promo items already in cart — backend excludes these */
  claimedItemIds: string[];
}

/**
 * Full response from the promotional add-ons endpoint.
 */
export interface PromotionalAddonsResponseDTO {
  campaign: PromotionalAddonCampaignDTO;
  /** Empty when cart subtotal is below threshold or all items claimed */
  availableItems: PromotionalAddonItemDTO[];
  /** How many more promo slots the customer can still claim */
  remainingSlots: number;
  /** Whether the cart currently meets the minimum order value */
  eligible: boolean;
  /** Amount still needed to unlock (0 when eligible) */
  amountToUnlock: number;
}

/**
 * Payload for POST /promotional-addons/validate (future).
 * Validates a promo item can still be added at checkout time.
 */
export interface ValidatePromotionalAddonRequestDTO {
  foodItemId: string;
  cartSubtotal: number;
  currentPromoItemCount: number;
}

export interface ValidatePromotionalAddonResponseDTO {
  valid: boolean;
  reason?: string;
}
