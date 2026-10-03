// Customer browsing routes (D11). Market 1 is implicit today; the `/m/:marketId`
// prefix leaves room for a market picker later.

export const LEGACY_MENU_PATHS = ['/bobs', '/bobs/menu', '/bobs/foodList'];

export const marketPath = (marketId: string) =>
  `/m/${encodeURIComponent(marketId)}`;

export const restaurantPath = (marketId: string, slug: string) =>
  `${marketPath(marketId)}/r/${encodeURIComponent(slug)}`;

/**
 * Router state set when the list opens a menu. The menu's back arrow then
 * pops history instead of pushing the list again, so browser/Android back
 * doesn't bounce between list and menu.
 */
export const MENU_FROM_LIST_STATE = { fromRestaurantList: true } as const;

export const isOpenedFromList = (state: unknown): boolean =>
  !!state &&
  typeof state === 'object' &&
  (state as { fromRestaurantList?: unknown }).fromRestaurantList === true;

/** Restaurant list or a restaurant menu (where launch dialogs may show). */
export const isBrowsePath = (pathname: string) => {
  // React Router matches `/bobs/` like `/bobs`; do the same here.
  const path =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;
  return (
    path === '/' ||
    LEGACY_MENU_PATHS.includes(path) ||
    /^\/m\/[^/]+(\/r\/[^/]+)?$/.test(path)
  );
};
