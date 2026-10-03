import { describe, expect, it } from 'vitest';
import { selectProductTotalQuantity } from './selectors';
import { makeCartItem } from '../utils/cartTestFixtures';
import type { RootState } from './store';

const stateWith = (items: ReturnType<typeof makeCartItem>[]) =>
  ({
    cart: { items, totalItems: 0 },
    food: { items: [], status: 'idle', error: null },
  }) as unknown as RootState;

describe('selectProductTotalQuantity', () => {
  const state = stateWith([
    makeCartItem({ quantity: 2 }),
    makeCartItem({ option: { size: 'Half' }, quantity: 1 }),
    makeCartItem({ restaurantId: 'pizza', quantity: 5 }),
    makeCartItem({
      quantity: 3,
      restaurantId: undefined,
      restaurantName: undefined,
      marketId: undefined,
    }),
    makeCartItem({ id: 'other', quantity: 7 }),
  ]);

  it('counts all variants across restaurants without a restaurantId', () => {
    expect(selectProductTotalQuantity('dish-1')(state)).toBe(11);
  });

  it('counts only the given restaurant, treating legacy lines as Bob’s', () => {
    expect(selectProductTotalQuantity('dish-1', 'bobs')(state)).toBe(6);
    expect(selectProductTotalQuantity('dish-1', 'pizza')(state)).toBe(5);
    expect(selectProductTotalQuantity('dish-1', 'nowhere')(state)).toBe(0);
  });
});
