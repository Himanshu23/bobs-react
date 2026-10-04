import { describe, expect, it } from 'vitest';
import {
  getClosedBannerText,
  getClosedCartGroups,
  getClosedCheckoutMessage,
  getNextOpensText,
  isRestaurantOrderable,
  sortOpenFirst,
} from './restaurantHours';
import { CartRestaurantGroup } from './cartUtils';
import { FALLBACK_DEFAULT_RESTAURANT, Restaurant } from '../types/marketplace';

const restaurant = (overrides: Partial<Restaurant>): Restaurant => ({
  id: 'r1',
  name: 'R1',
  slug: 'r1',
  marketId: 'market1',
  phone: '1',
  displayOrder: 0,
  ...overrides,
});

const group = (restaurantId: string): CartRestaurantGroup => ({
  restaurantId,
  restaurantName: `${restaurantId} (cart)`,
  marketId: 'market1',
  items: [],
  itemCount: 1,
  subtotal: 100,
});

describe('isRestaurantOrderable', () => {
  it('is false only when the server says openNow: false', () => {
    expect(isRestaurantOrderable({ openNow: true })).toBe(true);
    expect(isRestaurantOrderable({ openNow: false })).toBe(false);
  });

  it('treats a missing openNow (older backend) or unknown restaurant as open', () => {
    expect(isRestaurantOrderable({})).toBe(true);
    expect(isRestaurantOrderable({ openNow: null })).toBe(true);
    expect(isRestaurantOrderable(undefined)).toBe(true);
    expect(isRestaurantOrderable(null)).toBe(true);
    expect(isRestaurantOrderable(FALLBACK_DEFAULT_RESTAURANT)).toBe(true);
  });
});

describe('banner text', () => {
  it('shows nothing for an open restaurant', () => {
    expect(getClosedBannerText({ openNow: true })).toBeNull();
    expect(getClosedBannerText({})).toBeNull();
    expect(getNextOpensText({ openNow: true })).toBeNull();
  });

  it('shows the next opening when closed by schedule', () => {
    const closed = {
      openNow: false,
      closedReason: 'SCHEDULE' as const,
      nextOpensLabel: 'Opens tomorrow at 11:00 AM',
    };
    expect(getClosedBannerText(closed)).toBe(
      'Closed now · Opens tomorrow at 11:00 AM'
    );
    expect(getNextOpensText(closed)).toBe('Opens tomorrow at 11:00 AM');
  });

  it('says "Not accepting orders right now" when paused', () => {
    expect(
      getClosedBannerText({
        openNow: false,
        closedReason: 'PAUSED',
        nextOpensLabel: 'Not accepting orders right now',
      })
    ).toBe('Not accepting orders right now');
    expect(
      getClosedBannerText({ openNow: false, closedReason: 'PAUSED' })
    ).toBe('Not accepting orders right now');
  });

  it('falls back to "Closed now" without a useful label', () => {
    expect(
      getClosedBannerText({ openNow: false, nextOpensLabel: 'Closed' })
    ).toBe('Closed now');
    expect(getClosedBannerText({ openNow: false, nextOpensLabel: ' ' })).toBe(
      'Closed now'
    );
    expect(getNextOpensText({ openNow: false, nextOpensLabel: 'Closed' })).toBe(
      null
    );
  });
});

describe('sortOpenFirst', () => {
  it('moves closed restaurants last and keeps the API order otherwise', () => {
    const list = [
      restaurant({ id: 'a', openNow: false }),
      restaurant({ id: 'b' }),
      restaurant({ id: 'c', openNow: true }),
      restaurant({ id: 'd', openNow: false }),
      restaurant({ id: 'e', openNow: true }),
    ];
    expect(sortOpenFirst(list).map((r) => r.id)).toEqual([
      'b',
      'c',
      'e',
      'a',
      'd',
    ]);
    // Input untouched.
    expect(list.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('closed cart groups', () => {
  const byId = new Map<string, Restaurant>([
    ['open', restaurant({ id: 'open', name: 'Open One', openNow: true })],
    ['legacy', restaurant({ id: 'legacy', name: 'Legacy' })],
    ['shut', restaurant({ id: 'shut', name: 'Shut One', openNow: false })],
    ['shut2', restaurant({ id: 'shut2', name: '', openNow: false })],
  ]);

  it('returns only groups whose restaurant is closed', () => {
    const closed = getClosedCartGroups(
      [group('open'), group('shut'), group('legacy'), group('unknown')],
      byId
    );
    expect(closed.map((c) => [c.group.restaurantId, c.name])).toEqual([
      ['shut', 'Shut One'],
    ]);
  });

  it("falls back to the cart's restaurant name", () => {
    expect(getClosedCartGroups([group('shut2')], byId)[0].name).toBe(
      'shut2 (cart)'
    );
  });

  it('builds the checkout block message', () => {
    expect(getClosedCheckoutMessage([])).toBeNull();
    expect(getClosedCheckoutMessage(['Shut One'])).toBe(
      'Shut One is closed now. Remove its items to check out.'
    );
    expect(getClosedCheckoutMessage(['A', 'B', 'C'])).toBe(
      'A, B and C are closed now. Remove their items to check out.'
    );
  });
});
