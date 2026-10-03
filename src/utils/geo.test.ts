import { describe, expect, it } from 'vitest';
import { Market } from '../types/marketplace';
import {
  getServiceabilityMessage,
  haversineDistanceKm,
  isWithinDeliveryArea,
  resolveDeliveryArea,
} from './geo';

const market: Market = {
  id: 'market1',
  name: 'Market 1',
  center: { lat: 28.6139, lng: 77.209 },
  radiusKm: 3,
  deliveryFee: 20,
  displayOrder: 0,
};

describe('resolveDeliveryArea', () => {
  it('uses the market center and radius from the API', () => {
    expect(resolveDeliveryArea(market)).toEqual({
      marketId: 'market1',
      name: 'Market 1',
      center: { lat: 28.6139, lng: 77.209 },
      radiusKm: 3,
      isFallback: false,
    });
  });

  it('falls back to the old constants when the market is missing', () => {
    const area = resolveDeliveryArea(undefined);
    expect(area.isFallback).toBe(true);
    expect(area.center).toEqual({ lat: 28.639909, lng: 77.376881 });
    expect(area.radiusKm).toBe(6);
  });

  it('falls back when the market data is unusable', () => {
    expect(resolveDeliveryArea({ ...market, radiusKm: 0 }).isFallback).toBe(
      true
    );
    expect(
      resolveDeliveryArea({
        ...market,
        center: null as unknown as Market['center'],
      }).isFallback
    ).toBe(true);
  });
});

describe('isWithinDeliveryArea (same rule as the server)', () => {
  const area = resolveDeliveryArea(market);

  it('accepts the center and points inside the radius', () => {
    expect(isWithinDeliveryArea(28.6139, 77.209, area)).toBe(true);
    // ~2.2 km north.
    expect(isWithinDeliveryArea(28.6339, 77.209, area)).toBe(true);
  });

  it('rejects points outside the radius', () => {
    // ~5.6 km north.
    expect(isWithinDeliveryArea(28.6639, 77.209, area)).toBe(false);
  });

  it('follows the market radius, not a hard-coded 6 km', () => {
    const wide = resolveDeliveryArea({ ...market, radiusKm: 10 });
    expect(isWithinDeliveryArea(28.6639, 77.209, wide)).toBe(true);
  });

  it('uses the earth radius 6371 km', () => {
    // One degree of latitude ≈ 111.19 km.
    expect(haversineDistanceKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
  });

  it('describes the distance', () => {
    expect(getServiceabilityMessage(28.6139, 77.209, area)).toBe(
      'Within delivery range (0.0 km).'
    );
    expect(getServiceabilityMessage(28.6639, 77.209, area)).toMatch(
      /^Outside our 3 km delivery area \(5\.6 km away\)\.$/
    );
  });
});
