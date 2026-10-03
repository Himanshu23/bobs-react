import { describe, expect, it } from 'vitest';
import {
  createCartItem,
  createPromotionalAddonCartItem,
  findCartLineIndex,
  getCartItemsTotal,
  getCartLineKey,
  getMarketGuardDecision,
  groupCartByRestaurant,
  isSameCartLine,
  normalizeCartItem,
  resolveCartRestaurant,
} from './cartUtils';
import { makeCartItem, makeFoodItem } from './cartTestFixtures';

const pizzaPlace = { id: 'pizza', name: 'Pizza Place', marketId: 'market1' };

describe('cart line identity', () => {
  const bobsLine = makeCartItem();
  const pizzaLine = makeCartItem({
    restaurantId: 'pizza',
    restaurantName: 'Pizza Place',
  });

  it('matches id + option + restaurant', () => {
    expect(
      isSameCartLine(bobsLine, {
        id: 'dish-1',
        option: { size: 'Full' },
        restaurantId: 'bobs',
      })
    ).toBe(true);
  });

  it('does not collide when the same food id comes from two restaurants', () => {
    const items = [bobsLine, pizzaLine];
    expect(
      findCartLineIndex(items, {
        id: 'dish-1',
        option: { size: 'Full' },
        restaurantId: 'pizza',
      })
    ).toBe(1);
    expect(
      findCartLineIndex(items, {
        id: 'dish-1',
        option: { size: 'Full' },
        restaurantId: 'other',
      })
    ).toBe(-1);
    expect(getCartLineKey(bobsLine)).not.toBe(getCartLineKey(pizzaLine));
  });

  it('treats an undefined restaurantId as a wildcard (older callers)', () => {
    expect(
      isSameCartLine(pizzaLine, { id: 'dish-1', option: { size: 'Full' } })
    ).toBe(true);
  });

  it('treats a line without restaurantId as Bob’s', () => {
    const legacy = makeCartItem({
      restaurantId: undefined,
      restaurantName: undefined,
      marketId: undefined,
    });
    expect(
      isSameCartLine(legacy, {
        id: 'dish-1',
        option: { size: 'Full' },
        restaurantId: 'bobs',
      })
    ).toBe(true);
  });

  it('keeps option, isFreeClaim and isPromotionalAddon matching', () => {
    const promo = makeCartItem({ isPromotionalAddon: true, price: 9 });
    const free = makeCartItem({ isFreeClaim: true, price: 0 });
    const items = [bobsLine, promo, free];

    expect(
      findCartLineIndex(items, { id: 'dish-1', option: { size: 'Half' } })
    ).toBe(-1);
    expect(
      findCartLineIndex(items, {
        id: 'dish-1',
        option: { size: 'Full' },
        isPromotionalAddon: true,
      })
    ).toBe(1);
    expect(
      findCartLineIndex(items, {
        id: 'dish-1',
        option: { size: 'Full' },
        isFreeClaim: true,
      })
    ).toBe(2);
    expect(
      isSameCartLine(bobsLine, {
        id: 'dish-1',
        option: { size: 'Full', style: 'Dry' },
      })
    ).toBe(false);
  });
});

describe('creating cart items', () => {
  it('stamps the browsed restaurant on a regular item', () => {
    const item = createCartItem(
      makeFoodItem({ restaurantId: 'pizza' }),
      2,
      'Half',
      undefined,
      undefined,
      pizzaPlace
    );
    expect(item).toMatchObject({
      price: 150,
      quantity: 2,
      restaurantId: 'pizza',
      restaurantName: 'Pizza Place',
      marketId: 'market1',
    });
  });

  it('falls back to the product restaurant, and to Bob’s for legacy items', () => {
    expect(
      createCartItem(makeFoodItem({ restaurantId: 'pizza' }), 1, 'Full')
    ).toMatchObject({ restaurantId: 'pizza', marketId: 'market1' });
    expect(createCartItem(makeFoodItem(), 1, 'Full')).toMatchObject({
      restaurantId: 'bobs',
      restaurantName: "Bob's",
      marketId: 'market1',
    });
  });

  it('ignores a browsed restaurant that does not own the product', () => {
    expect(resolveCartRestaurant({ restaurantId: 'bobs' }, pizzaPlace).id).toBe(
      'bobs'
    );
  });

  it('stamps the restaurant on promotional add-ons', () => {
    const item = createPromotionalAddonCartItem(
      {
        foodItemId: 'dish-1',
        name: 'Paneer Tikka',
        promotionalPrice: 9,
        originalPrice: 150,
        image: '',
        description: '',
        size: 'Half',
      } as Parameters<typeof createPromotionalAddonCartItem>[0],
      makeFoodItem({ restaurantId: 'pizza' }),
      1,
      pizzaPlace
    );
    expect(item).toMatchObject({
      isPromotionalAddon: true,
      restaurantId: 'pizza',
      restaurantName: 'Pizza Place',
    });
  });
});

describe('market guard (D5)', () => {
  it('allows adding to an empty cart', () => {
    expect(getMarketGuardDecision([], 'market2')).toEqual({ type: 'allow' });
  });

  it('allows adding from the same market', () => {
    expect(getMarketGuardDecision([makeCartItem()], 'market1')).toEqual({
      type: 'allow',
    });
  });

  it('reports a conflict when adding from another market', () => {
    expect(getMarketGuardDecision([makeCartItem()], 'market2')).toEqual({
      type: 'conflict',
      cartMarketId: 'market1',
    });
  });

  it('treats legacy items and a missing incoming market as market1', () => {
    const legacy = makeCartItem({ marketId: undefined });
    expect(getMarketGuardDecision([legacy], undefined)).toEqual({
      type: 'allow',
    });
    expect(getMarketGuardDecision([legacy], 'market2')).toEqual({
      type: 'conflict',
      cartMarketId: 'market1',
    });
  });
});

describe('grouping and totals', () => {
  const items = [
    makeCartItem({ price: 250, quantity: 2 }),
    makeCartItem({
      id: 'pizza-1',
      price: 400,
      quantity: 1,
      restaurantId: 'pizza',
      restaurantName: 'Pizza Place',
    }),
    makeCartItem({
      option: { size: 'Half' },
      price: 150,
      quantity: 1,
    }),
    makeCartItem({ isPromotionalAddon: true, price: 9, quantity: 1 }),
    makeCartItem({
      id: 'legacy',
      price: 100,
      quantity: 3,
      restaurantId: undefined,
      restaurantName: undefined,
      marketId: undefined,
    }),
  ];

  it('groups by restaurant in first-added order with subtotals', () => {
    const groups = groupCartByRestaurant(items);
    expect(groups.map((group) => group.restaurantId)).toEqual([
      'bobs',
      'pizza',
    ]);
    expect(groups[0]).toMatchObject({
      restaurantName: "Bob's",
      marketId: 'market1',
      itemCount: 7,
      subtotal: 500 + 150 + 9 + 300,
    });
    expect(groups[0].items).toHaveLength(4);
    expect(groups[1]).toMatchObject({ itemCount: 1, subtotal: 400 });
  });

  it('keeps the grand total equal to the sum of subtotals', () => {
    const groups = groupCartByRestaurant(items);
    const sum = groups.reduce((total, group) => total + group.subtotal, 0);
    expect(getCartItemsTotal(items)).toBe(1359);
    expect(sum).toBe(getCartItemsTotal(items));
  });

  it('returns no groups for an empty cart', () => {
    expect(groupCartByRestaurant([])).toEqual([]);
  });
});

describe('normalizeCartItem', () => {
  it('uses the product restaurant when the item has none', () => {
    const item = makeCartItem({
      product: makeFoodItem({ restaurantId: 'pizza' }),
      restaurantId: undefined,
      restaurantName: undefined,
      marketId: undefined,
    });
    expect(normalizeCartItem(item)).toMatchObject({
      restaurantId: 'pizza',
      restaurantName: 'pizza',
      marketId: 'market1',
    });
  });

  it('returns complete items unchanged', () => {
    const item = makeCartItem();
    expect(normalizeCartItem(item)).toBe(item);
  });
});

describe('resolveCartRestaurant fallbacks', () => {
  const known = new Map([
    ['pizza', { id: 'pizza', name: 'Pizza Place', marketId: 'market2' }],
  ]);

  it('prefers the browsed restaurant when it owns the product', () => {
    expect(
      resolveCartRestaurant({ restaurantId: 'pizza' }, pizzaPlace, known)
    ).toBe(pizzaPlace);
  });

  it('uses the browsed restaurant for a product without restaurantId', () => {
    expect(resolveCartRestaurant({}, pizzaPlace)).toBe(pizzaPlace);
  });

  it('uses the restaurants cache instead of the market1 default', () => {
    expect(
      resolveCartRestaurant({ restaurantId: 'pizza' }, null, known)
    ).toEqual({ id: 'pizza', name: 'Pizza Place', marketId: 'market2' });
  });

  it('falls back to id/market1 for an unknown restaurant', () => {
    expect(
      resolveCartRestaurant({ restaurantId: 'new-place' }, null, known)
    ).toEqual({ id: 'new-place', name: 'new-place', marketId: 'market1' });
  });

  it('falls back to Bob’s for a missing product or empty restaurantId', () => {
    const bobs = { id: 'bobs', name: "Bob's", marketId: 'market1' };
    expect(resolveCartRestaurant(undefined)).toEqual(bobs);
    expect(resolveCartRestaurant({ restaurantId: '' })).toEqual(bobs);
  });
});

describe('getCartLineKey', () => {
  it('is unique for every distinct cart line', () => {
    const lines = [
      makeCartItem(),
      makeCartItem({ restaurantId: 'pizza' }),
      makeCartItem({ option: { size: 'Half' } }),
      makeCartItem({ option: { size: 'Full', style: 'Dry' } }),
      makeCartItem({ option: { size: 'Full', base: 'Paratha' } }),
      makeCartItem({ isPromotionalAddon: true }),
      makeCartItem({ isFreeClaim: true }),
      makeCartItem({ id: 'dish-2' }),
    ];
    const keys = lines.map(getCartLineKey);
    expect(new Set(keys).size).toBe(lines.length);
  });

  it('is the same for a legacy line and its migrated Bob’s line', () => {
    const legacy = makeCartItem({
      restaurantId: undefined,
      restaurantName: undefined,
      marketId: undefined,
    });
    expect(getCartLineKey(legacy)).toBe(getCartLineKey(makeCartItem()));
  });
});

describe('flag matching', () => {
  it('treats a missing stored flag as false when the key says false', () => {
    const regular = makeCartItem();
    expect(regular.isPromotionalAddon).toBeUndefined();
    expect(
      isSameCartLine(regular, {
        id: 'dish-1',
        option: { size: 'Full' },
        isPromotionalAddon: false,
        isFreeClaim: false,
      })
    ).toBe(true);
    expect(
      isSameCartLine(makeCartItem({ isPromotionalAddon: true }), {
        id: 'dish-1',
        option: { size: 'Full' },
        isPromotionalAddon: false,
      })
    ).toBe(false);
  });
});
