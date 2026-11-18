import { describe, expect, it } from 'vitest';
import { FoodItem } from '../types';
import {
  getAvailableSizes,
  getLowestWasPrice,
  getPriceForSize,
} from './priceUtils';

const dish = (
  nowSize: FoodItem['priceOptions']['nowPrice']['size'],
  wasSize: NonNullable<FoodItem['priceOptions']['wasPrice']>['size'] = {}
): FoodItem =>
  ({
    id: 'd1',
    name: 'Dish',
    priceOptions: {
      wasPrice: { size: wasSize },
      nowPrice: { size: nowSize },
    },
  }) as unknown as FoodItem;

describe('getAvailableSizes', () => {
  it('lists only sizes with a price, Full to Quarter', () => {
    expect(getAvailableSizes(dish({ Quarter: 80, Full: 250 }))).toEqual([
      'Full',
      'Quarter',
    ]);
  });

  it('leaves out sizes stored as 0 by older saves', () => {
    expect(getAvailableSizes(dish({ Full: 0, Half: 150, Quarter: 0 }))).toEqual(
      ['Half']
    );
  });

  it('is empty when no size has a price', () => {
    expect(getAvailableSizes(dish({}))).toEqual([]);
  });
});

describe('getLowestWasPrice', () => {
  it('ignores was prices of 0', () => {
    expect(getLowestWasPrice(dish({ Full: 250 }, { Full: 300, Half: 0 }))).toBe(
      300
    );
  });
});

describe('dish without was prices (wasPrice null)', () => {
  const noWas = {
    ...dish({ Full: 280 }),
    priceOptions: { wasPrice: null, nowPrice: { size: { Full: 280 } } },
  } as unknown as FoodItem;

  it('has no strike-through price and does not throw', () => {
    expect(getLowestWasPrice(noWas)).toBeUndefined();
    expect(getPriceForSize(noWas, 'Full')).toEqual({
      wasPrice: undefined,
      nowPrice: 280,
    });
  });
});
