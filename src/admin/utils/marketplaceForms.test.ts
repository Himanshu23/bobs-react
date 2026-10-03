import { describe, expect, it } from 'vitest';
import {
  bobsCollisionWarning,
  buildRestaurantOptions,
  emptyMarketForm,
  emptyRestaurantForm,
  hasErrors,
  itemVisibilityIssue,
  marketDeactivationWarnings,
  marketFormToRequest,
  marketToForm,
  resolveRestaurantId,
  restaurantDeactivationWarnings,
  restaurantFormToRequest,
  restaurantToForm,
  slugify,
  validateMarketForm,
  validateRestaurantForm,
} from './marketplaceForms';

const validMarket = {
  ...emptyMarketForm(),
  name: 'Market 1',
  centerLat: '28.6139',
  centerLng: '77.2090',
  radiusKm: '6',
};

describe('validateMarketForm', () => {
  it('accepts a valid market', () => {
    expect(hasErrors(validateMarketForm(validMarket))).toBe(false);
  });

  it('requires name, center and radius', () => {
    const errors = validateMarketForm(emptyMarketForm());
    expect(errors.name).toBeDefined();
    expect(errors.centerLat).toBeDefined();
    expect(errors.centerLng).toBeDefined();
    expect(errors.radiusKm).toBeDefined();
  });

  it('checks lat/lng ranges', () => {
    const errors = validateMarketForm({
      ...validMarket,
      centerLat: '90.1',
      centerLng: '-180.5',
    });
    expect(errors.centerLat).toMatch(/-90 and 90/);
    expect(errors.centerLng).toMatch(/-180 and 180/);
    expect(
      hasErrors(
        validateMarketForm({
          ...validMarket,
          centerLat: '-90',
          centerLng: '180',
        })
      )
    ).toBe(false);
  });

  it('needs radius > 0 and fee >= 0', () => {
    expect(validateMarketForm({ ...validMarket, radiusKm: '0' }).radiusKm).toBe(
      'Radius must be greater than 0'
    );
    expect(
      validateMarketForm({ ...validMarket, deliveryFee: '-1' }).deliveryFee
    ).toBeDefined();
    expect(
      validateMarketForm({ ...validMarket, deliveryFee: '0' }).deliveryFee
    ).toBeUndefined();
    expect(
      validateMarketForm({ ...validMarket, deliveryFee: '' }).deliveryFee
    ).toBeUndefined();
  });

  it('defaults the delivery fee to 20', () => {
    expect(emptyMarketForm().deliveryFee).toBe('20');
  });
});

describe('marketFormToRequest', () => {
  it('converts numbers and sends blank optionals as null', () => {
    expect(
      marketFormToRequest({ ...validMarket, deliveryFee: '', displayOrder: '' })
    ).toEqual({
      name: 'Market 1',
      center: { lat: 28.6139, lng: 77.209 },
      radiusKm: 6,
      deliveryFee: null,
      displayOrder: null,
      active: true,
    });
  });

  it('round-trips an existing market', () => {
    const market = {
      id: 'market1',
      name: 'Market 1',
      center: { lat: 1, lng: 2 },
      radiusKm: 6,
      deliveryFee: 25,
      active: false,
      displayOrder: 3,
    };
    expect(marketFormToRequest(marketToForm(market))).toEqual({
      name: 'Market 1',
      center: { lat: 1, lng: 2 },
      radiusKm: 6,
      deliveryFee: 25,
      active: false,
      displayOrder: 3,
    });
  });
});

describe('slugify', () => {
  it('matches the backend slug rule', () => {
    expect(slugify("Bob's Café")).toBe('bobs-cafe');
    expect(slugify("Bob's Café & Grill")).toBe('bobs-cafe-grill');
    expect(slugify('  --Pizza  Place-- ')).toBe('pizza-place');
    expect(slugify('!!!')).toBe('');
  });
});

describe('validateRestaurantForm', () => {
  const validRestaurant = {
    ...emptyRestaurantForm('market1'),
    name: "Bob's",
    phone: '+919876543210',
  };

  it('accepts a valid restaurant without location', () => {
    expect(hasErrors(validateRestaurantForm(validRestaurant))).toBe(false);
  });

  it('requires name, phone and market', () => {
    const errors = validateRestaurantForm(emptyRestaurantForm());
    expect(errors.name).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.marketId).toBeDefined();
  });

  it('needs both coordinates once one is given', () => {
    const errors = validateRestaurantForm({
      ...validRestaurant,
      locationLat: '28.6',
    });
    expect(errors.locationLat).toBeUndefined();
    expect(errors.locationLng).toBe('Longitude is required');
  });

  it('checks percentages are 0..100', () => {
    const errors = validateRestaurantForm({
      ...validRestaurant,
      commissionPercent: '101',
      discountSharePercent: '-1',
    });
    expect(errors.commissionPercent).toBeDefined();
    expect(errors.discountSharePercent).toBeDefined();
  });

  it('rejects a slug with no letters or digits', () => {
    expect(
      validateRestaurantForm({ ...validRestaurant, slug: '---' }).slug
    ).toBeDefined();
  });

  it('builds a request with trimmed tags and null location', () => {
    const request = restaurantFormToRequest({
      ...validRestaurant,
      cuisineTags: [' Chinese ', ''],
    });
    expect(request.location).toBeNull();
    expect(request.cuisineTags).toEqual(['Chinese']);
    expect(request.commissionPercent).toBe(0);
  });

  it('round-trips an existing restaurant', () => {
    const restaurant = {
      id: 'bobs',
      name: "Bob's",
      slug: 'bobs',
      marketId: 'market1',
      phone: '+91',
      address: '12 Main Road',
      location: { lat: 28.6, lng: 77.2 },
      imageUrl: 'https://x/y.jpg',
      cuisineTags: ['North Indian'],
      commissionPercent: 5,
      discountSharePercent: 10,
      active: true,
      displayOrder: 1,
    };
    expect(restaurantFormToRequest(restaurantToForm(restaurant))).toEqual({
      name: "Bob's",
      slug: 'bobs',
      marketId: 'market1',
      phone: '+91',
      address: '12 Main Road',
      location: { lat: 28.6, lng: 77.2 },
      imageUrl: 'https://x/y.jpg',
      cuisineTags: ['North Indian'],
      commissionPercent: 5,
      discountSharePercent: 10,
      active: true,
      displayOrder: 1,
    });
  });
});

describe('deactivation warnings', () => {
  it('adds the whole-menu warning only for bobs', () => {
    expect(restaurantDeactivationWarnings('bobs', "Bob's")).toHaveLength(2);
    expect(restaurantDeactivationWarnings('r2', 'Pizza')).toHaveLength(1);
  });

  it('adds the legacy warning only for market1', () => {
    expect(marketDeactivationWarnings('market1', 'M1', 3)).toHaveLength(2);
    expect(marketDeactivationWarnings('m2', 'M2', 0)[0]).toMatch(/\(0\)/);
  });
});

describe('itemVisibilityIssue', () => {
  const restaurants = {
    bobs: { active: true, marketId: 'market1' },
    closed: { active: false, marketId: 'market1' },
    far: { active: true, marketId: 'm2' },
  };

  it('resolves legacy restaurant ids to bobs', () => {
    expect(resolveRestaurantId(undefined)).toBe('bobs');
    expect(resolveRestaurantId('')).toBe('bobs');
    expect(resolveRestaurantId('r1')).toBe('r1');
  });

  it('flags inactive restaurants and markets', () => {
    const markets = { market1: { active: true }, m2: { active: false } };
    expect(itemVisibilityIssue('bobs', restaurants, markets)).toBeNull();
    expect(itemVisibilityIssue('closed', restaurants, markets)).toBe(
      'restaurant-inactive'
    );
    expect(itemVisibilityIssue('far', restaurants, markets)).toBe(
      'market-inactive'
    );
  });

  it('treats a restaurant without a record as being in market1', () => {
    expect(
      itemVisibilityIssue(undefined, {}, { market1: { active: false } })
    ).toBe('market-inactive');
    expect(itemVisibilityIssue('unknown', {}, {})).toBeNull();
  });
});

describe('restaurant round trip with null fields', () => {
  it('keeps null optionals as null (not "")', () => {
    const restaurant = {
      id: 'r2',
      name: 'Pizza Place',
      slug: 'pizza-place',
      marketId: 'market1',
      phone: '+91',
      address: null,
      location: null,
      imageUrl: null,
      cuisineTags: null,
      commissionPercent: 0,
      discountSharePercent: 0,
      active: true,
      displayOrder: 0,
    };
    expect(restaurantFormToRequest(restaurantToForm(restaurant))).toEqual({
      name: 'Pizza Place',
      slug: 'pizza-place',
      marketId: 'market1',
      phone: '+91',
      address: null,
      location: null,
      imageUrl: null,
      cuisineTags: [],
      commissionPercent: 0,
      discountSharePercent: 0,
      active: true,
      displayOrder: 0,
    });
  });
});

describe('buildRestaurantOptions', () => {
  it('always offers bobs, even with no restaurant records', () => {
    expect(buildRestaurantOptions([])).toEqual([
      { id: 'bobs', label: "Bob's (default)" },
    ]);
  });

  it('uses the bobs record when it exists and adds an unknown current id', () => {
    const options = buildRestaurantOptions(
      [
        { id: 'bobs', name: "Bob's", active: true },
        { id: 'r2', name: 'Pizza', active: false },
      ],
      'ghost'
    );
    expect(options.map((option) => option.id)).toEqual(['bobs', 'r2', 'ghost']);
    expect(options[1].label).toBe('Pizza (inactive)');
  });
});

describe('bobsCollisionWarning', () => {
  it("warns for a Bob's name or bobs slug when no bobs record exists", () => {
    expect(
      bobsCollisionWarning({ name: "Bob's", slug: '' }, [])
    ).not.toBeNull();
    expect(
      bobsCollisionWarning({ name: 'Other', slug: 'BOBS' }, [])
    ).not.toBeNull();
    expect(bobsCollisionWarning({ name: 'Pizza', slug: '' }, [])).toBeNull();
  });

  it('does not warn once the bobs record exists', () => {
    expect(
      bobsCollisionWarning({ name: "Bob's", slug: '' }, [{ id: 'bobs' }])
    ).toBeNull();
  });
});
