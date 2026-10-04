// Opening-hours display and ordering rules (D15). The server computes
// `openNow`, `closedReason` and `nextOpensLabel` in India time; nothing here
// works out hours or timezones.
import { Restaurant } from '../types/marketplace';
import { CartRestaurantGroup } from './cartUtils';

type HoursFields = Pick<
  Restaurant,
  'openNow' | 'closedReason' | 'nextOpensLabel'
>;

const NOT_ACCEPTING = 'Not accepting orders right now';

/**
 * Whether the restaurant takes orders now. A missing `openNow` (an older
 * backend, or an unknown restaurant) counts as open: the server still checks
 * when the order is placed.
 */
export const isRestaurantOrderable = (
  restaurant: Pick<Restaurant, 'openNow'> | null | undefined
): boolean => restaurant?.openNow !== false;

const isPaused = (restaurant: HoursFields) =>
  restaurant.closedReason === 'PAUSED' ||
  restaurant.nextOpensLabel?.trim().toLowerCase() ===
    NOT_ACCEPTING.toLowerCase();

/**
 * When it opens again, e.g. "Opens tomorrow at 11:00 AM" or "Not accepting
 * orders right now". Null when open, or when the server only says "Closed".
 */
export const getNextOpensText = (restaurant: HoursFields): string | null => {
  if (isRestaurantOrderable(restaurant)) return null;
  if (isPaused(restaurant)) return NOT_ACCEPTING;
  const label = restaurant.nextOpensLabel?.trim();
  if (!label || label.toLowerCase() === 'closed') return null;
  return label;
};

/**
 * One-line closed notice for the menu banner and cart groups:
 * "Closed now · Opens tomorrow at 11:00 AM", "Not accepting orders right now"
 * or "Closed now". Null when the restaurant is open.
 */
export const getClosedBannerText = (restaurant: HoursFields): string | null => {
  if (isRestaurantOrderable(restaurant)) return null;
  if (isPaused(restaurant)) return NOT_ACCEPTING;
  const next = getNextOpensText(restaurant);
  return next ? `Closed now · ${next}` : 'Closed now';
};

/** Open restaurants first; otherwise the API order is kept (stable). */
export const sortOpenFirst = <T extends Pick<Restaurant, 'openNow'>>(
  restaurants: readonly T[]
): T[] =>
  restaurants
    .map((restaurant, index) => ({ restaurant, index }))
    .sort(
      (a, b) =>
        Number(!isRestaurantOrderable(a.restaurant)) -
          Number(!isRestaurantOrderable(b.restaurant)) || a.index - b.index
    )
    .map(({ restaurant }) => restaurant);

export interface ClosedCartGroup {
  group: CartRestaurantGroup;
  name: string;
  restaurant: Restaurant;
}

/** Cart groups whose restaurant is closed now (these block checkout). */
export const getClosedCartGroups = (
  groups: readonly CartRestaurantGroup[],
  restaurantsById: ReadonlyMap<string, Restaurant>
): ClosedCartGroup[] =>
  groups.flatMap((group) => {
    const restaurant = restaurantsById.get(group.restaurantId);
    if (!restaurant || isRestaurantOrderable(restaurant)) return [];
    return [
      {
        group,
        restaurant,
        name: restaurant.name || group.restaurantName,
      },
    ];
  });

const joinNames = (names: string[]) =>
  names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** Why checkout is blocked, naming the closed restaurant(s). Null if none. */
export const getClosedCheckoutMessage = (names: string[]): string | null => {
  if (names.length === 0) return null;
  return names.length === 1
    ? `${names[0]} is closed now. Remove its items to check out.`
    : `${joinNames(names)} are closed now. Remove their items to check out.`;
};
