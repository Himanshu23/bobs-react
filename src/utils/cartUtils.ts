import { CartItem, FoodItem, ItemOptions } from '../types';

export const createCartItem = (
  product: FoodItem,
  quantity: number,
  selectedSize: ItemOptions['size'],
  selectedType?: ItemOptions['style'],
  selectedBase?: ItemOptions['base']
): CartItem => {
  const price =
    (selectedSize
      ? product.priceOptions.nowPrice.size?.[selectedSize] || 0
      : 0) +
    (selectedType
      ? product.priceOptions.nowPrice.type?.[selectedType] || 0
      : 0) +
    (selectedBase
      ? product.priceOptions.nowPrice.base?.[selectedBase] || 0
      : 0);

  return {
    id: product.id,
    name: product.name,
    price,
    image: product.image,
    quantity,
    option: {
      size: selectedSize,
      style: selectedType,
      base: selectedBase,
    },
    product,
    description: product.description,
  };
};
