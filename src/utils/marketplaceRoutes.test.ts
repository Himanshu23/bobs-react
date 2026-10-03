import { describe, expect, it } from 'vitest';
import {
  getHeaderMode,
  isBrowsePath,
  isRestaurantMenuPath,
  isOpenedFromList,
  marketPath,
  MENU_FROM_LIST_STATE,
  restaurantPath,
} from './marketplaceRoutes';

describe('route builders', () => {
  it('builds market and restaurant paths', () => {
    expect(marketPath('market1')).toBe('/m/market1');
    expect(restaurantPath('market1', 'bobs')).toBe('/m/market1/r/bobs');
  });

  it('encodes unsafe characters in ids and slugs', () => {
    expect(marketPath('market 1')).toBe('/m/market%201');
    expect(restaurantPath('m/1', 'a b?c')).toBe('/m/m%2F1/r/a%20b%3Fc');
  });

  it('produces paths that isBrowsePath recognises', () => {
    expect(isBrowsePath(restaurantPath('m/1', 'a/b'))).toBe(true);
  });
});

describe('isBrowsePath', () => {
  it.each([
    '/',
    '/bobs',
    '/bobs/',
    '/bobs/menu',
    '/bobs/foodList/',
    '/m/market1',
    '/m/market1/',
    '/m/market1/r/bobs',
    '/m/market1/r/bobs/',
  ])('is true for %s', (path) => {
    expect(isBrowsePath(path)).toBe(true);
  });

  it.each([
    '',
    '/cart',
    '/checkout',
    '/bobs/admin',
    '/bobs/landing',
    '/m',
    '/m/',
    '/m/market1/r',
    '/m/market1/r/',
    '/m/market1/r/bobs/extra',
    '/m//r/bobs',
  ])('is false for %s', (path) => {
    expect(isBrowsePath(path)).toBe(false);
  });
});

describe('isOpenedFromList', () => {
  it('recognises only the list navigation state', () => {
    expect(isOpenedFromList(MENU_FROM_LIST_STATE)).toBe(true);
    expect(isOpenedFromList(null)).toBe(false);
    expect(isOpenedFromList(undefined)).toBe(false);
    expect(isOpenedFromList({ fromRestaurantList: 'yes' })).toBe(false);
    expect(isOpenedFromList('fromRestaurantList')).toBe(false);
  });
});

describe('getHeaderMode', () => {
  it.each([
    '/bobs',
    '/bobs/',
    '/bobs/menu',
    '/bobs/foodList',
    '/m/x/r/y',
    '/m/market1/r/bobs/',
  ])('uses the restaurant header on the menu route %s', (path) => {
    expect(getHeaderMode(path)).toBe('restaurant');
    expect(isRestaurantMenuPath(path)).toBe(true);
  });

  it.each([
    '/',
    '/m/x',
    '/m/x/r',
    '/m/x/r/y/extra',
    '/cart',
    '/checkout',
    '/addresses',
    '/bobs/admin',
    '/bobs/admin/login',
    '/bobs/landing',
  ])('keeps the default header on %s', (path) => {
    expect(getHeaderMode(path)).toBe('default');
    expect(isRestaurantMenuPath(path)).toBe(false);
  });
});
