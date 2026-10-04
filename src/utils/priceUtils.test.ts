import { describe, expect, it } from 'vitest';
import { FoodItem } from '../types';
import { getAvailableSizes, getLowestWasPrice } from './priceUtils';

const dish = (
  nowSize: FoodItem['priceOptions']['nowPrice']['size'],
  wasSize: FoodItem['priceOptions']['wasPrice']['size'] = {}
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
