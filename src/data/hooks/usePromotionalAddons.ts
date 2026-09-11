import { useQuery } from '@tanstack/react-query';
import { CartItem } from '../../types';
import {
  GetPromotionalAddonsRequestDTO,
  PromotionalAddonsResponseDTO,
} from '../../types/promotionalAddons';
import { ENDPOINTS } from '../../config/api';
import { getQualifyingCartSubtotal } from '../../utils/promotionalAddonStrategy';

const PROMO_ADDONS_QUERY_KEY = 'promotionalAddons';

const fetchPromotionalAddons = async (
  request: GetPromotionalAddonsRequestDTO
): Promise<PromotionalAddonsResponseDTO> => {
  const params = new URLSearchParams({
    cartSubtotal: String(request.cartSubtotal),
    claimedItemIds: request.claimedItemIds.join(','),
  });

  const response = await fetch(`${ENDPOINTS.PROMOTIONAL_ADDONS}?${params}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch promotional add-ons: ${response.statusText}`
    );
  }

  const data = (await response.json()) as PromotionalAddonsResponseDTO;
  const amountToUnlock = Math.max(
    0,
    Math.ceil(data.campaign.minOrderValue - request.cartSubtotal)
  );

  return {
    ...data,
    amountToUnlock: data.eligible ? 0 : amountToUnlock,
  };
};

/**
 * Returns promotional add-on availability based on current cart state.
 * The backend is the source of truth for eligibility and mapped dishes.
 */
export const usePromotionalAddons = (cartItems: CartItem[]) => {
  const qualifyingSubtotal = getQualifyingCartSubtotal(cartItems);

  const claimedItemIds = cartItems
    .filter((item) => item.isPromotionalAddon)
    .map((item) => item.id);

  return useQuery<PromotionalAddonsResponseDTO, Error>({
    queryKey: [
      PROMO_ADDONS_QUERY_KEY,
      'api',
      qualifyingSubtotal,
      claimedItemIds,
    ],
    queryFn: () =>
      fetchPromotionalAddons({
        cartSubtotal: qualifyingSubtotal,
        claimedItemIds,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });
};

export { PROMO_ADDONS_QUERY_KEY };
