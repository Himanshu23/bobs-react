import { FoodCategory } from '../types';

const CUP_SIZE_LABELS: Readonly<Record<string, string>> = {
  Full: 'Large',
  Half: 'Medium',
  Quarter: 'Small',
};

/** Ice cream comes as a taco, cone or cup (dearest to cheapest). */
const ICE_CREAM_LABELS: Readonly<Record<string, string>> = {
  Full: 'Taco',
  Half: 'Cone',
  Quarter: 'Cup',
};

/** Categories whose portions have their own names instead of Full/Half/Quarter. */
const SIZE_LABELS_BY_CATEGORY: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  [FoodCategory.Coffee]: CUP_SIZE_LABELS,
  [FoodCategory.Shakes]: CUP_SIZE_LABELS,
  [FoodCategory.IceCream]: ICE_CREAM_LABELS,
};

/**
 * Display name of a portion size. The stored value stays Full/Half/Quarter
 * (cart, orders, pricing); Coffee and Shakes show Large/Medium/Small and
 * Ice Cream shows Taco/Cone/Cup.
 */
export const getSizeLabel = (
  size: string | null | undefined,
  category: string | null | undefined
): string => {
  if (!size) return '';
  const labels = category ? SIZE_LABELS_BY_CATEGORY[category] : undefined;
  return labels?.[size] ?? size;
};
