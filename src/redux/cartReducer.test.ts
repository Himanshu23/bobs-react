import { beforeAll, describe, expect, it, vi } from 'vitest';
import { makeCartItem } from '../utils/cartTestFixtures';

// The store reads/writes localStorage; give it an in-memory one.
beforeAll(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
});

const loadStore = async () => import('./store');

describe('cart reducer', () => {
  it('keeps the same food id from two restaurants as separate lines', async () => {
    const { cartReducer, addToCart } = await loadStore();
    let state = cartReducer({ items: [], totalItems: 0 }, { type: 'init' });
    state = cartReducer(state, addToCart(makeCartItem()));
    state = cartReducer(
      state,
      addToCart(
        makeCartItem({ restaurantId: 'pizza', restaurantName: 'Pizza Place' })
      )
    );
    state = cartReducer(state, addToCart(makeCartItem({ quantity: 2 })));

    expect(state.items).toHaveLength(2);
    expect(state.items[0]).toMatchObject({ restaurantId: 'bobs', quantity: 3 });
    expect(state.items[1]).toMatchObject({
      restaurantId: 'pizza',
      quantity: 1,
    });
    expect(state.totalItems).toBe(4);
  });

  it('stamps Bob’s on items added without restaurant data', async () => {
    const { cartReducer, addToCart } = await loadStore();
    const state = cartReducer(
      { items: [], totalItems: 0 },
      addToCart(
        makeCartItem({
          restaurantId: undefined,
          restaurantName: undefined,
          marketId: undefined,
        })
      )
    );
    expect(state.items[0]).toMatchObject({
      restaurantId: 'bobs',
      restaurantName: "Bob's",
      marketId: 'market1',
    });
  });

  it('removes only the targeted restaurant line', async () => {
    const { cartReducer, addToCart, removeFromCart } = await loadStore();
    let state = cartReducer({ items: [], totalItems: 0 }, { type: 'init' });
    state = cartReducer(state, addToCart(makeCartItem()));
    state = cartReducer(
      state,
      addToCart(makeCartItem({ restaurantId: 'pizza' }))
    );
    state = cartReducer(
      state,
      removeFromCart({
        id: 'dish-1',
        option: { size: 'Full' },
        restaurantId: 'pizza',
      })
    );
    expect(state.items.map((item) => item.restaurantId)).toEqual(['bobs']);
    expect(state.totalItems).toBe(1);
  });

  it('starts a new cart with only the new item (market guard confirm)', async () => {
    const { cartReducer, addToCart, startNewCartWith } = await loadStore();
    let state = cartReducer(
      { items: [], totalItems: 0 },
      addToCart(makeCartItem({ quantity: 3 }))
    );
    state = cartReducer(
      state,
      startNewCartWith(
        makeCartItem({
          id: 'm2-dish',
          restaurantId: 'far',
          restaurantName: 'Far Away',
          marketId: 'market2',
        })
      )
    );
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({
      id: 'm2-dish',
      marketId: 'market2',
    });
    expect(state.totalItems).toBe(1);
  });

  const sumQuantities = (state: {
    items: { quantity: number }[];
    totalItems: number;
  }) => state.items.reduce((sum, item) => sum + item.quantity, 0);

  it('keeps totalItems equal to the sum of quantities across actions', async () => {
    const {
      cartReducer,
      addToCart,
      updateQuantity,
      removeFromCart,
      removePromotionalAddons,
      clearCart,
    } = await loadStore();
    let state = cartReducer({ items: [], totalItems: 0 }, { type: 'init' });
    const check = () => expect(state.totalItems).toBe(sumQuantities(state));

    state = cartReducer(state, addToCart(makeCartItem({ quantity: 2 })));
    state = cartReducer(
      state,
      addToCart(makeCartItem({ restaurantId: 'pizza', quantity: 3 }))
    );
    state = cartReducer(
      state,
      addToCart(makeCartItem({ isPromotionalAddon: true, price: 9 }))
    );
    state = cartReducer(
      state,
      addToCart(makeCartItem({ isFreeClaim: true, price: 0 }))
    );
    check();
    expect(state.totalItems).toBe(7);

    state = cartReducer(
      state,
      updateQuantity({
        id: 'dish-1',
        option: { size: 'Full' },
        quantity: 5,
        isPromotionalAddon: false,
        isFreeClaim: false,
        restaurantId: 'pizza',
      })
    );
    check();
    expect(state.items[1].quantity).toBe(5);

    // Unknown line: no change.
    state = cartReducer(
      state,
      updateQuantity({
        id: 'missing',
        option: { size: 'Full' },
        quantity: 9,
      })
    );
    check();

    state = cartReducer(
      state,
      removeFromCart({
        id: 'dish-1',
        option: { size: 'Full' },
        isPromotionalAddon: false,
        isFreeClaim: true,
        restaurantId: 'bobs',
      })
    );
    check();
    expect(state.items.some((item) => item.isFreeClaim)).toBe(false);

    state = cartReducer(state, removePromotionalAddons());
    check();
    expect(state.items.some((item) => item.isPromotionalAddon)).toBe(false);
    expect(state.totalItems).toBe(7);

    state = cartReducer(state, clearCart());
    expect(state).toEqual({ items: [], totalItems: 0 });
  });

  it('ignores adding a promo add-on that is already in the cart', async () => {
    const { cartReducer, addToCart } = await loadStore();
    const promo = makeCartItem({ isPromotionalAddon: true, price: 9 });
    let state = cartReducer({ items: [], totalItems: 0 }, addToCart(promo));
    state = cartReducer(state, addToCart(promo));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(1);
    expect(state.totalItems).toBe(1);
  });

  it('never merges a regular add into a promo or free-claim line', async () => {
    const { cartReducer, addToCart } = await loadStore();
    let state = cartReducer(
      { items: [], totalItems: 0 },
      addToCart(makeCartItem({ isPromotionalAddon: true, price: 9 }))
    );
    state = cartReducer(
      state,
      addToCart(makeCartItem({ isFreeClaim: true, price: 0 }))
    );
    state = cartReducer(state, addToCart(makeCartItem({ quantity: 2 })));
    expect(state.items).toHaveLength(3);
    expect(state.items[2]).toMatchObject({ price: 250, quantity: 2 });
    expect(state.items[0].quantity).toBe(1);
    expect(state.totalItems).toBe(4);
  });

  it('removes the regular line, not an earlier promo line of the same dish', async () => {
    const { cartReducer, addToCart, removeFromCart } = await loadStore();
    let state = cartReducer(
      { items: [], totalItems: 0 },
      addToCart(makeCartItem({ isPromotionalAddon: true, price: 9 }))
    );
    state = cartReducer(state, addToCart(makeCartItem()));
    state = cartReducer(
      state,
      removeFromCart({
        id: 'dish-1',
        option: { size: 'Full' },
        isPromotionalAddon: false,
        isFreeClaim: false,
        restaurantId: 'bobs',
      })
    );
    expect(state.items).toHaveLength(1);
    expect(state.items[0].isPromotionalAddon).toBe(true);
  });
});
