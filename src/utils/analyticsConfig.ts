// Pure analytics decisions (no react-ga4, no DOM), unit-tested in
// analyticsConfig.test.ts: which GA property to use, the page title per
// route, and how a restaurant menu was entered.

import { isOpenedFromList, isRestaurantMenuPath } from './marketplaceRoutes';

/** Production GA4 property, used by production builds when no env id is set. */
export const PRODUCTION_GA_MEASUREMENT_ID = 'G-2WN4J8KR01';

export const SITE_NAME = 'Grokheads';

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'];

export interface AnalyticsEnvironment {
  /** `import.meta.env.VITE_GA_MEASUREMENT_ID`. */
  envMeasurementId?: string;
  /** `import.meta.env.PROD`. */
  isProductionBuild: boolean;
  /** `window.location.hostname` ('' when there is no window). */
  hostname: string;
  /**
   * Capacitor app. It is served from `https://localhost` (Android) or
   * `capacitor://localhost` (iOS) but is real production traffic.
   */
  isNativeApp?: boolean;
}

export interface AnalyticsConfig {
  enabled: boolean;
  measurementId: string | null;
  /** GA4 `debug_mode`: events show in Admin → DebugView. */
  debugMode: boolean;
}

export const isLocalHostname = (hostname: string) =>
  LOCAL_HOSTNAMES.includes(hostname) || hostname.endsWith('.localhost');

/**
 * - `VITE_GA_MEASUREMENT_ID` set: always used. On a dev build or a local
 *   (non-app) host, `debug_mode` is on so events land in DebugView.
 * - Not set: production builds on a real host (or the native app) use the
 *   production id; dev builds and localhost send nothing.
 */
export const resolveAnalyticsConfig = ({
  envMeasurementId,
  isProductionBuild,
  hostname,
  isNativeApp = false,
}: AnalyticsEnvironment): AnalyticsConfig => {
  const explicitId = envMeasurementId?.trim();
  const isLocal = !isNativeApp && isLocalHostname(hostname);

  if (explicitId) {
    return {
      enabled: true,
      measurementId: explicitId,
      debugMode: !isProductionBuild || isLocal,
    };
  }

  if (isProductionBuild && !isLocal) {
    return {
      enabled: true,
      measurementId: PRODUCTION_GA_MEASUREMENT_ID,
      debugMode: false,
    };
  }

  return { enabled: false, measurementId: null, debugMode: false };
};

const withSiteName = (name: string) => `${name} · ${SITE_NAME}`;

const withoutTrailingSlash = (pathname: string) =>
  pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

/**
 * `document.title` for a route. On a restaurant menu pass the restaurant
 * name once it is known; until then (and when it can't be resolved) the
 * plain site name is used.
 */
export const getPageTitle = (
  pathname: string,
  restaurantName?: string | null
): string => {
  const path = withoutTrailingSlash(pathname);
  if (isRestaurantMenuPath(path)) {
    const name = restaurantName?.trim();
    return name ? withSiteName(name) : SITE_NAME;
  }
  if (path === '/cart') return withSiteName('Cart');
  if (path === '/checkout') return withSiteName('Checkout');
  if (path === '/addresses' || path.startsWith('/addresses/')) {
    return withSiteName('Addresses');
  }
  if (path === '/bobs/admin' || path.startsWith('/bobs/admin/')) {
    return withSiteName('Admin');
  }
  return SITE_NAME;
};

/**
 * Restaurant menu routes send their own page_view once the restaurant name
 * is known (RestaurantMenuPage); the app layout sends it for the rest.
 */
export const isPageViewSentByPage = (pathname: string) =>
  isRestaurantMenuPath(pathname);

export type RestaurantEntry = 'list' | 'direct';

/** `list` when the restaurant list opened the menu, else `direct`. */
export const getRestaurantEntry = (locationState: unknown): RestaurantEntry =>
  isOpenedFromList(locationState) ? 'list' : 'direct';
