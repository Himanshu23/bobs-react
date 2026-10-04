// Pure display helpers for the restaurant card and info sheet.
import { FoodItem } from '../types';
import { DEFAULT_RESTAURANT_ID, Restaurant } from '../types/marketplace';

/** Shown when a restaurant has no image at all, or an image fails to load. */
export const RESTAURANT_IMAGE_FALLBACK = '/imgs/no-image.jpeg';

/** Max dish photos used as a restaurant's card images. */
export const MAX_DISH_IMAGES = 5;

const clean = (value: string | null | undefined): string =>
  typeof value === 'string' ? value.trim() : '';

const distinct = (values: (string | null | undefined)[]): string[] =>
  Array.from(new Set(values.map(clean).filter(Boolean)));

/** The admin form's default dish image: not a real photo of the dish. */
const isPlaceholderImage = (url: string): boolean =>
  url.includes('default-placeholder');

/**
 * Distinct, non-blank dish images per restaurant, in the order the items are
 * given (menu order), at most `max` each (default: all). Unavailable items and
 * the placeholder image are skipped; items without a `restaurantId` belong to
 * the default restaurant (legacy data).
 */
export const groupDishImagesByRestaurant = (
  items: Pick<FoodItem, 'image' | 'available' | 'restaurantId'>[],
  max = Infinity
): Map<string, string[]> => {
  const byRestaurant = new Map<string, string[]>();
  items.forEach((item) => {
    if (item.available === false) return;
    const image = clean(item.image);
    if (!image || isPlaceholderImage(image)) return;
    const restaurantId = clean(item.restaurantId) || DEFAULT_RESTAURANT_ID;
    const images = byRestaurant.get(restaurantId) ?? [];
    if (images.length < max && !images.includes(image)) {
      images.push(image);
      byRestaurant.set(restaurantId, images);
    }
  });
  return byRestaurant;
};

/**
 * `count` items picked at random (partial Fisher–Yates), without repeats.
 * `random` returns [0, 1) like Math.random; tests pass a fixed sequence.
 */
export const pickRandom = <T>(
  values: T[],
  count: number,
  random: () => number = Math.random
): T[] => {
  const pool = [...values];
  const picked = Math.min(count, pool.length);
  for (let i = 0; i < picked; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, picked);
};

/** The restaurant's own images: `imageUrls` if any, else `imageUrl`. */
const ownImages = (
  restaurant: Pick<Restaurant, 'imageUrls' | 'imageUrl'>
): string[] => {
  const urls = distinct(restaurant.imageUrls ?? []);
  if (urls.length > 0) return urls;
  const single = clean(restaurant.imageUrl);
  return single ? [single] : [];
};

/**
 * Card carousel images: the restaurant's own image(s) first (`imageUrls`, else
 * `imageUrl`), then up to {@link MAX_DISH_IMAGES} of its dish images picked at
 * random. With no dish images only the restaurant's image is shown; with
 * neither, the single no-image picture.
 */
export const getRestaurantImages = (
  restaurant: Pick<Restaurant, 'imageUrls' | 'imageUrl'>,
  dishImages: (string | null | undefined)[] = [],
  random: () => number = Math.random
): string[] => {
  const own = ownImages(restaurant);
  const dishes = pickRandom(
    distinct(dishImages).filter((url) => !own.includes(url)),
    MAX_DISH_IMAGES,
    random
  );
  const images = [...own, ...dishes];
  return images.length > 0 ? images : [RESTAURANT_IMAGE_FALLBACK];
};

/** True when the restaurant record itself has an image (no dish lookup needed). */
export const hasOwnRestaurantImage = (
  restaurant: Pick<Restaurant, 'imageUrls' | 'imageUrl'>
): boolean => ownImages(restaurant).length > 0;

/** The carousel rotates (and shows dots) only with more than one image. */
export const shouldAutoRotate = (imageCount: number): boolean => imageCount > 1;

/** Trimmed offer text, or `null` when there's nothing to show. */
export const getPromoText = (
  restaurant: Pick<Restaurant, 'promoText'>
): string | null => clean(restaurant.promoText) || null;

/** Rating, delivery time and cost for two on the card. */
export interface RestaurantCardMeta {
  /** e.g. 4.2 (shown in the green badge). */
  rating?: number | null;
  /** e.g. "30-35 min". */
  deliveryTime?: string | null;
  /** In rupees, e.g. 300 → "₹300 for two". */
  costForTwo?: number | null;
}

export interface ResolvedCardMeta {
  meta: RestaurantCardMeta;
  /** True when the values are made-up samples (dev builds only). */
  isSample: boolean;
}

/** Made-up values so the metadata row can be judged in dev builds. */
export const SAMPLE_CARD_META: Readonly<Required<RestaurantCardMeta>> = {
  rating: 4.2,
  deliveryTime: '30-35 min',
  costForTwo: 300,
};

const hasMetaValue = (meta: RestaurantCardMeta | undefined): boolean =>
  Boolean(
    meta &&
      ((typeof meta.rating === 'number' && Number.isFinite(meta.rating)) ||
        clean(meta.deliveryTime) ||
        (typeof meta.costForTwo === 'number' &&
          Number.isFinite(meta.costForTwo)))
  );

/**
 * Which metadata to render. The backend has no rating/delivery time/cost
 * fields yet, so:
 * - real values passed in are always shown (any build);
 * - otherwise dev builds show sample values, so the design can be judged;
 * - otherwise (production) the row is hidden: customers never see fake data.
 */
export const resolveCardMeta = (
  meta: RestaurantCardMeta | undefined,
  isDev: boolean
): ResolvedCardMeta | null => {
  if (meta && hasMetaValue(meta)) return { meta, isSample: false };
  if (isDev) return { meta: { ...SAMPLE_CARD_META }, isSample: true };
  return null;
};

export type RestaurantInfoRowKind =
  | 'description'
  | 'address'
  | 'openingHours'
  | 'fssaiNumber'
  | 'phone';

export interface RestaurantInfoRow {
  kind: RestaurantInfoRowKind;
  label: string;
  value: string;
}

/** Info-sheet rows in display order; blank fields are left out. */
export const getRestaurantInfoRows = (
  restaurant: Pick<
    Restaurant,
    'description' | 'address' | 'openingHours' | 'fssaiNumber' | 'phone'
  >
): RestaurantInfoRow[] => {
  const rows: RestaurantInfoRow[] = [
    {
      kind: 'description',
      label: 'About',
      value: clean(restaurant.description),
    },
    { kind: 'address', label: 'Address', value: clean(restaurant.address) },
    {
      kind: 'openingHours',
      label: 'Opening hours',
      value: clean(restaurant.openingHours),
    },
    {
      kind: 'fssaiNumber',
      label: 'FSSAI licence no.',
      value: clean(restaurant.fssaiNumber),
    },
    { kind: 'phone', label: 'Phone', value: clean(restaurant.phone) },
  ];
  return rows.filter((row) => row.value !== '');
};

/** Cuisine tags without blanks, e.g. for "North Indian, Chinese". */
export const getCuisineTags = (
  restaurant: Pick<Restaurant, 'cuisineTags'>
): string[] => (restaurant.cuisineTags ?? []).map(clean).filter(Boolean);
