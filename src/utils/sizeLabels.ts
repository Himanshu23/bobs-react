import { FoodCategory } from '../types';

/** Categories whose portions read as cup sizes instead of Full/Half/Quarter. */
const CUP_SIZE_CATEGORIES: ReadonlySet<string> = new Set([
  FoodCategory.Coffee,
  FoodCategory.Shakes,
]);

const CUP_SIZE_LABELS: Readonly<Record<string, string>> = {
  Full: 'Large',
  Half: 'Medium',
  Quarter: 'Small',
};

/**
 * Display name of a portion size. The stored value stays Full/Half/Quarter
 * (cart, orders, pricing); Coffee and Shakes show Large/Medium/Small.
 */
export const getSizeLabel = (
  size: string | null | undefined,
  category: string | null | undefined
): string => {
  if (!size) return '';
  if (category && CUP_SIZE_CATEGORIES.has(category)) {
    return CUP_SIZE_LABELS[size] ?? size;
  }
  return size;
};
