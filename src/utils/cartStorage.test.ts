import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCartFromLocalStorage,
  migrateStoredCart,
  saveCartToLocalStorage,
} from './cartStorage';
import { makeCartItem } from './cartTestFixtures';

/** A pre-multi-restaurant saved cart line (no restaurant fields). */
const legacyLine = () => {
  const legacy: Record<string, unknown> = {
    ...makeCartItem({ quantity: 2, isFreeClaim: false }),
  };
  delete legacy.restaurantId;
  delete legacy.restaurantName;
  delete legacy.marketId;
  return legacy;
};

const stubLocalStorage = (initial: Record<string, string> = {}) => {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
  return store;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('migrateStoredCart', () => {
  it('assigns legacy items to Bob’s in market1', () => {
    const [item] = migrateStoredCart([legacyLine()]);
    expect(item).toMatchObject({
      id: 'dish-1',
      quantity: 2,
      option: { size: 'Full' },
      restaurantId: 'bobs',
      restaurantName: "Bob's",
      marketId: 'market1',
    });
  });

  it('keeps items that already have restaurant data', () => {
    const current = makeCartItem({
      restaurantId: 'pizza',
      restaurantName: 'Pizza Place',
      marketId: 'market1',
    });
    expect(migrateStoredCart([current])).toEqual([current]);
  });

  it('drops malformed entries and non-array data', () => {
    expect(migrateStoredCart({ items: [] })).toEqual([]);
    expect(migrateStoredCart(null)).toEqual([]);
    expect(
      migrateStoredCart([null, 'x', { id: 'a' }, legacyLine()])
    ).toHaveLength(1);
  });
});

describe('migrateStoredCart field types', () => {
  it('drops lines with a non-integer, zero or non-numeric quantity', () => {
    const lines = [
      { ...legacyLine(), quantity: 1.5 },
      { ...legacyLine(), quantity: 0 },
      { ...legacyLine(), quantity: -1 },
      { ...legacyLine(), quantity: '2' },
      { ...legacyLine(), quantity: NaN },
    ];
    expect(migrateStoredCart(lines)).toEqual([]);
  });

  it('drops lines with a non-finite or non-numeric price', () => {
    const lines = [
      { ...legacyLine(), price: '250' },
      { ...legacyLine(), price: NaN },
      { ...legacyLine(), price: Infinity },
      { ...legacyLine(), id: 42 },
    ];
    expect(migrateStoredCart(lines)).toEqual([]);
  });

  it('keeps a zero-price (free claim) line', () => {
    expect(
      migrateStoredCart([{ ...legacyLine(), price: 0, isFreeClaim: true }])
    ).toHaveLength(1);
  });

  it('refills restaurant fields that are not non-empty strings', () => {
    const [item] = migrateStoredCart([
      {
        ...legacyLine(),
        restaurantId: 7,
        restaurantName: null,
        marketId: '',
      },
    ]);
    expect(item).toMatchObject({
      restaurantId: 'bobs',
      restaurantName: "Bob's",
      marketId: 'market1',
    });
  });

  it('keeps valid restaurant fields and refills only the bad ones', () => {
    const [item] = migrateStoredCart([
      {
        ...legacyLine(),
        restaurantId: 'pizza',
        restaurantName: { bad: true },
        marketId: 'market1',
      },
    ]);
    expect(item).toMatchObject({
      restaurantId: 'pizza',
      restaurantName: 'pizza',
      marketId: 'market1',
    });
  });

  it('ignores a malformed product restaurantId', () => {
    const [item] = migrateStoredCart([
      {
        ...legacyLine(),
        product: { ...(legacyLine().product as object), restaurantId: 99 },
      },
    ]);
    expect(item.restaurantId).toBe('bobs');
  });
});

describe('getCartFromLocalStorage', () => {
  it('migrates a cart saved by the previous app version', () => {
    stubLocalStorage({ bob_cart_items: JSON.stringify([legacyLine()]) });
    const items = getCartFromLocalStorage();
    expect(items).toHaveLength(1);
    expect(items[0].restaurantId).toBe('bobs');
    expect(items[0].marketId).toBe('market1');
  });

  it('round-trips a saved cart', () => {
    stubLocalStorage();
    const items = [makeCartItem({ restaurantId: 'pizza' })];
    saveCartToLocalStorage(items);
    expect(getCartFromLocalStorage()).toEqual(items);
  });

  it('returns an empty cart for corrupt JSON', () => {
    stubLocalStorage({ bob_cart_items: '{not json' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(getCartFromLocalStorage()).toEqual([]);
  });
});
