import { describe, expect, it } from 'vitest';
import {
  getCuisineTags,
  getPromoText,
  getRestaurantImages,
  getRestaurantInfoRows,
  groupDishImagesByRestaurant,
  hasOwnRestaurantImage,
  pickRandom,
  resolveCardMeta,
  RESTAURANT_IMAGE_FALLBACK,
  SAMPLE_CARD_META,
  shouldAutoRotate,
} from './restaurantDisplay';

describe('pickRandom', () => {
  it('picks without repeats, driven by the random source', () => {
    // 0 always takes the first remaining item → original order.
    expect(pickRandom(['a', 'b', 'c', 'd'], 2, () => 0)).toEqual(['a', 'b']);
    // 0.99 always swaps in the last remaining item: [d,b,c,a] then [d,a,c,b].
    expect(pickRandom(['a', 'b', 'c', 'd'], 2, () => 0.99)).toEqual(['d', 'a']);
  });

  it('returns everything when asking for more than there is', () => {
    expect(pickRandom(['a', 'b'], 5, () => 0).sort()).toEqual(['a', 'b']);
    expect(pickRandom([], 3)).toEqual([]);
  });

  it('does not change the input', () => {
    const input = ['a', 'b', 'c'];
    pickRandom(input, 3, () => 0.99);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});

describe('getRestaurantImages', () => {
  const dishes = ['/d1.jpg', '/d2.jpg'];
  const first = () => 0; // pickRandom keeps menu order

  it('puts the restaurant image first, then dish images', () => {
    expect(
      getRestaurantImages({ imageUrl: ' /single.jpg ' }, dishes, first)
    ).toEqual(['/single.jpg', '/d1.jpg', '/d2.jpg']);
  });

  it('uses imageUrls (trimmed, no blanks or duplicates) as the own images', () => {
    expect(
      getRestaurantImages(
        {
          imageUrls: [' /a.jpg ', '', '   ', '/b.jpg', '/a.jpg'],
          imageUrl: '/single.jpg',
        },
        dishes,
        first
      )
    ).toEqual(['/a.jpg', '/b.jpg', '/d1.jpg', '/d2.jpg']);
    expect(
      getRestaurantImages(
        { imageUrls: ['', ' '], imageUrl: '/single.jpg' },
        [],
        first
      )
    ).toEqual(['/single.jpg']);
  });

  it('shows only the restaurant image when no dish has one', () => {
    expect(getRestaurantImages({ imageUrl: '/single.jpg' })).toEqual([
      '/single.jpg',
    ]);
    expect(
      getRestaurantImages({ imageUrl: '/single.jpg' }, ['', null, '  '])
    ).toEqual(['/single.jpg']);
  });

  it('picks at most 5 random dish images, without repeating the own image', () => {
    const many = [
      '/single.jpg',
      ' /1.jpg',
      '/1.jpg',
      '/2.jpg',
      '/3.jpg',
    ].concat(['/4.jpg', '/5.jpg', '/6.jpg', '/7.jpg']);
    const images = getRestaurantImages({ imageUrl: '/single.jpg' }, many);
    expect(images[0]).toBe('/single.jpg');
    expect(images).toHaveLength(6);
    expect(new Set(images).size).toBe(6);
    images.slice(1).forEach((url) => expect(url).toMatch(/^\/[1-7]\.jpg$/));
  });

  it('uses random dish images when the restaurant has no image', () => {
    expect(getRestaurantImages({ imageUrl: ' ' }, dishes, () => 0.99)).toEqual([
      '/d2.jpg',
      '/d1.jpg',
    ]);
  });

  it('falls back to the no-image picture when there is nothing', () => {
    expect(getRestaurantImages({})).toEqual([RESTAURANT_IMAGE_FALLBACK]);
    expect(getRestaurantImages({ imageUrls: [] }, ['', '  '])).toEqual([
      RESTAURANT_IMAGE_FALLBACK,
    ]);
  });
});

describe('hasOwnRestaurantImage', () => {
  it('is true only for a non-blank imageUrls entry or imageUrl', () => {
    expect(hasOwnRestaurantImage({ imageUrls: ['/a.jpg'] })).toBe(true);
    expect(hasOwnRestaurantImage({ imageUrl: '/a.jpg' })).toBe(true);
    expect(hasOwnRestaurantImage({ imageUrls: [' '], imageUrl: '' })).toBe(
      false
    );
    expect(hasOwnRestaurantImage({})).toBe(false);
  });
});

describe('shouldAutoRotate', () => {
  it('rotates only with more than one image', () => {
    expect(shouldAutoRotate(0)).toBe(false);
    expect(shouldAutoRotate(1)).toBe(false);
    expect(shouldAutoRotate(2)).toBe(true);
  });
});

describe('groupDishImagesByRestaurant', () => {
  it('groups available items by restaurant in menu order, distinct, capped', () => {
    const items = [
      { restaurantId: 'r1', image: '/a.jpg' },
      { restaurantId: 'r2', image: '/x.jpg' },
      { restaurantId: 'r1', image: ' /a.jpg ' },
      { restaurantId: 'r1', image: '' },
      { restaurantId: 'r1', image: '/off.jpg', available: false },
      { restaurantId: 'r1', image: '/b.jpg', available: true },
      { restaurantId: 'r1', image: '/c.jpg' },
    ];
    const grouped = groupDishImagesByRestaurant(items, 2);
    expect(grouped.get('r1')).toEqual(['/a.jpg', '/b.jpg']);
    expect(grouped.get('r2')).toEqual(['/x.jpg']);
  });

  it('keeps all images by default and files items without restaurantId under bobs', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      image: `/${i}.jpg`,
    }));
    expect(groupDishImagesByRestaurant(items).get('bobs')).toHaveLength(8);
  });

  it('skips the admin form placeholder image', () => {
    expect(
      groupDishImagesByRestaurant([
        {
          restaurantId: 'r1',
          image:
            'https://x.blob.core.windows.net/dishesh/default-placeholder.jpg',
        },
        { restaurantId: 'r1', image: '/real.jpg' },
      ]).get('r1')
    ).toEqual(['/real.jpg']);
  });

  it('leaves out restaurants with no usable image', () => {
    expect(
      groupDishImagesByRestaurant([{ restaurantId: 'r1', image: ' ' }]).has(
        'r1'
      )
    ).toBe(false);
  });
});

describe('getPromoText', () => {
  it('trims the text and hides blanks', () => {
    expect(getPromoText({ promoText: ' 20% off above ₹299 ' })).toBe(
      '20% off above ₹299'
    );
    expect(getPromoText({ promoText: '   ' })).toBeNull();
    expect(getPromoText({ promoText: null })).toBeNull();
    expect(getPromoText({})).toBeNull();
  });
});

describe('resolveCardMeta', () => {
  it('shows sample values only in dev builds when no data is passed', () => {
    expect(resolveCardMeta(undefined, true)).toEqual({
      meta: SAMPLE_CARD_META,
      isSample: true,
    });
    expect(resolveCardMeta(undefined, false)).toBeNull();
    expect(resolveCardMeta({}, false)).toBeNull();
    expect(
      resolveCardMeta(
        { rating: null, deliveryTime: ' ', costForTwo: NaN },
        false
      )
    ).toBeNull();
  });

  it('shows real values in any build', () => {
    const meta = { rating: 4.5 };
    expect(resolveCardMeta(meta, false)).toEqual({ meta, isSample: false });
    expect(resolveCardMeta(meta, true)).toEqual({ meta, isSample: false });
    expect(resolveCardMeta({ deliveryTime: '25 min' }, false)).not.toBeNull();
    expect(resolveCardMeta({ costForTwo: 0 }, false)).not.toBeNull();
  });
});

describe('getRestaurantInfoRows', () => {
  it('lists the filled rows in display order', () => {
    expect(
      getRestaurantInfoRows({
        description: 'Tandoor since 1998',
        address: '12 Main Road',
        openingHours: '11 AM – 11 PM',
        fssaiNumber: '12345678901234',
        phone: '+919876543210',
      }).map((row) => [row.kind, row.value])
    ).toEqual([
      ['description', 'Tandoor since 1998'],
      ['address', '12 Main Road'],
      ['openingHours', '11 AM – 11 PM'],
      ['fssaiNumber', '12345678901234'],
      ['phone', '+919876543210'],
    ]);
  });

  it('leaves out empty, blank and null fields', () => {
    expect(
      getRestaurantInfoRows({
        description: '  ',
        address: null,
        openingHours: undefined,
        fssaiNumber: '',
        phone: ' 9643310092 ',
      })
    ).toEqual([{ kind: 'phone', label: 'Phone', value: '9643310092' }]);
    expect(getRestaurantInfoRows({ phone: '' })).toEqual([]);
  });
});

describe('getCuisineTags', () => {
  it('drops blank tags', () => {
    expect(
      getCuisineTags({ cuisineTags: ['North Indian', ' ', 'Chinese '] })
    ).toEqual(['North Indian', 'Chinese']);
    expect(getCuisineTags({ cuisineTags: null })).toEqual([]);
  });
});
