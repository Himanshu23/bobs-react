import { describe, expect, it } from 'vitest';
import {
  getCuisineTags,
  getPromoText,
  getRestaurantImages,
  getRestaurantInfoRows,
  groupDishImagesByRestaurant,
  hasOwnRestaurantImage,
  resolveCardMeta,
  RESTAURANT_IMAGE_FALLBACK,
  SAMPLE_CARD_META,
  shouldAutoRotate,
} from './restaurantDisplay';

describe('getRestaurantImages', () => {
  const dishes = ['/d1.jpg', '/d2.jpg'];

  it('prefers imageUrls, trimmed, without blanks or duplicates', () => {
    expect(
      getRestaurantImages(
        {
          imageUrls: [' /a.jpg ', '', '   ', '/b.jpg', '/a.jpg'],
          imageUrl: '/single.jpg',
        },
        dishes
      )
    ).toEqual(['/a.jpg', '/b.jpg']);
  });

  it('falls back to imageUrl when imageUrls is missing, null or all blank', () => {
    expect(getRestaurantImages({ imageUrl: '/single.jpg' }, dishes)).toEqual([
      '/single.jpg',
    ]);
    expect(
      getRestaurantImages({ imageUrls: null, imageUrl: ' /single.jpg ' })
    ).toEqual(['/single.jpg']);
    expect(
      getRestaurantImages(
        { imageUrls: ['', ' '], imageUrl: '/single.jpg' },
        dishes
      )
    ).toEqual(['/single.jpg']);
  });

  it("then uses the restaurant's own dish images, de-duplicated, max 5", () => {
    expect(getRestaurantImages({ imageUrl: ' ' }, dishes)).toEqual(dishes);
    expect(
      getRestaurantImages({}, [
        '/1.jpg',
        ' /1.jpg',
        '',
        null,
        '/2.jpg',
        '/3.jpg',
        '/4.jpg',
        '/5.jpg',
        '/6.jpg',
      ])
    ).toEqual(['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg']);
  });

  it('ends with the single no-image picture', () => {
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

  it('caps at 5 by default and files items without restaurantId under bobs', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      image: `/${i}.jpg`,
    }));
    expect(groupDishImagesByRestaurant(items).get('bobs')).toEqual([
      '/0.jpg',
      '/1.jpg',
      '/2.jpg',
      '/3.jpg',
      '/4.jpg',
    ]);
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
