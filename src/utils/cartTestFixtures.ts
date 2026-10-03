// Shared fixtures for cart unit tests (not imported by app code).
import { CartItem, FoodCategory, FoodItem } from '../types';

export const makeFoodItem = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  id: 'dish-1',
  name: 'Paneer Tikka',
  description: '',
  veg: true,
  rating: 4,
  image: 'https://example.test/paneer.jpg',
  category: FoodCategory.Starters,
  priceOptions: {
    wasPrice: { size: { Full: 300, Half: 180 } },
    nowPrice: { size: { Full: 250, Half: 150 } },
  },
  ...overrides,
});

export const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => {
  const product = overrides.product ?? makeFoodItem();
  return {
    id: product.id,
    name: product.name,
    price: 250,
    image: product.image,
    product,
    quantity: 1,
    option: { size: 'Full' },
    restaurantId: 'bobs',
    restaurantName: "Bob's",
    marketId: 'market1',
    ...overrides,
  };
};
