import { describe, expect, it } from 'vitest';
import {
  getPageTitle,
  getRestaurantEntry,
  isLocalHostname,
  isPageViewSentByPage,
  PRODUCTION_GA_MEASUREMENT_ID,
  resolveAnalyticsConfig,
} from './analyticsConfig';
import { MENU_FROM_LIST_STATE } from './marketplaceRoutes';

describe('resolveAnalyticsConfig', () => {
  it('uses the production id on a production build on a real host', () => {
    expect(
      resolveAnalyticsConfig({
        isProductionBuild: true,
        hostname: 'grokheads.in',
      })
    ).toEqual({
      enabled: true,
      measurementId: PRODUCTION_GA_MEASUREMENT_ID,
      debugMode: false,
    });
  });

  it('is disabled on dev builds and localhost without an explicit id', () => {
    const disabled = { enabled: false, measurementId: null, debugMode: false };
    expect(
      resolveAnalyticsConfig({
        isProductionBuild: false,
        hostname: 'localhost',
      })
    ).toEqual(disabled);
    expect(
      resolveAnalyticsConfig({ isProductionBuild: true, hostname: '127.0.0.1' })
    ).toEqual(disabled);
    expect(
      resolveAnalyticsConfig({
        isProductionBuild: false,
        hostname: 'grokheads.in',
        envMeasurementId: '  ',
      })
    ).toEqual(disabled);
  });

  it('uses an explicit id, in debug mode on dev builds and localhost', () => {
    expect(
      resolveAnalyticsConfig({
        isProductionBuild: false,
        hostname: 'localhost',
        envMeasurementId: ' G-TEST123 ',
      })
    ).toEqual({ enabled: true, measurementId: 'G-TEST123', debugMode: true });
    expect(
      resolveAnalyticsConfig({
        isProductionBuild: true,
        hostname: 'localhost',
        envMeasurementId: 'G-TEST123',
      }).debugMode
    ).toBe(true);
    expect(
      resolveAnalyticsConfig({
        isProductionBuild: true,
        hostname: 'grokheads.in',
        envMeasurementId: 'G-TEST123',
      })
    ).toEqual({ enabled: true, measurementId: 'G-TEST123', debugMode: false });
  });

  it('treats the Capacitor app (served from localhost) as production', () => {
    expect(
      resolveAnalyticsConfig({
        isProductionBuild: true,
        hostname: 'localhost',
        isNativeApp: true,
      })
    ).toEqual({
      enabled: true,
      measurementId: PRODUCTION_GA_MEASUREMENT_ID,
      debugMode: false,
    });
  });

  it('recognises local hostnames', () => {
    expect(isLocalHostname('localhost')).toBe(true);
    expect(isLocalHostname('app.localhost')).toBe(true);
    expect(isLocalHostname('[::1]')).toBe(true);
    expect(isLocalHostname('grokheads.in')).toBe(false);
  });
});

describe('getPageTitle', () => {
  it('names restaurant menus after the restaurant once known', () => {
    expect(getPageTitle('/m/market1/r/mutka-king', 'Mutka King')).toBe(
      'Mutka King · Grokheads'
    );
    expect(getPageTitle('/bobs/menu', "Bob's")).toBe("Bob's · Grokheads");
    expect(getPageTitle('/bobs/', "Bob's")).toBe("Bob's · Grokheads");
    expect(getPageTitle('/m/market1/r/mutka-king')).toBe('Grokheads');
    expect(getPageTitle('/bobs/foodList', '  ')).toBe('Grokheads');
  });

  it('maps the other routes', () => {
    expect(getPageTitle('/cart')).toBe('Cart · Grokheads');
    expect(getPageTitle('/checkout')).toBe('Checkout · Grokheads');
    expect(getPageTitle('/addresses')).toBe('Addresses · Grokheads');
    expect(getPageTitle('/addresses/new')).toBe('Addresses · Grokheads');
    expect(getPageTitle('/addresses/a1/edit')).toBe('Addresses · Grokheads');
    expect(getPageTitle('/bobs/admin')).toBe('Admin · Grokheads');
    expect(getPageTitle('/bobs/admin/login')).toBe('Admin · Grokheads');
    expect(getPageTitle('/')).toBe('Grokheads');
    expect(getPageTitle('/m/market1')).toBe('Grokheads');
    expect(getPageTitle('/bobs/landing')).toBe('Grokheads');
    // A restaurant name is ignored off the menu routes.
    expect(getPageTitle('/cart', 'Mutka King')).toBe('Cart · Grokheads');
  });

  it('leaves only menu page views to the menu page', () => {
    expect(isPageViewSentByPage('/m/market1/r/x')).toBe(true);
    expect(isPageViewSentByPage('/bobs')).toBe(true);
    expect(isPageViewSentByPage('/m/market1')).toBe(false);
    expect(isPageViewSentByPage('/cart')).toBe(false);
  });
});

describe('getRestaurantEntry', () => {
  it('is list only with the list marker state', () => {
    expect(getRestaurantEntry(MENU_FROM_LIST_STATE)).toBe('list');
    expect(getRestaurantEntry(null)).toBe('direct');
    expect(getRestaurantEntry(undefined)).toBe('direct');
    expect(getRestaurantEntry({ fromRestaurantList: 'yes' })).toBe('direct');
  });
});
