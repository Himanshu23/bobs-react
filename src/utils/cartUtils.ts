import { CartItem, FoodItem, ItemOptions } from '../types';
import { PromotionalAddonItemDTO } from '../types/promotionalAddons';

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

export const createPromotionalAddonCartItem = (
  promoItem: PromotionalAddonItemDTO,
  product: FoodItem,
  quantity = 1
): CartItem => ({
  id: promoItem.foodItemId,
  name: promoItem.name,
  price: promoItem.promotionalPrice,
  originalPrice: promoItem.originalPrice,
  image: promoItem.image,
  description: promoItem.description,
  product,
  quantity,
  option: {
    size: promoItem.size,
    style: promoItem.style,
    base: promoItem.base,
  },
  isPromotionalAddon: true,
});
