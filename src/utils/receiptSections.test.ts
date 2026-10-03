import { describe, expect, it } from 'vitest';
import { makeCartItem, makeFoodItem } from './cartTestFixtures';
import { buildReceiptLayout } from './receiptSections';
import { collectPageCss } from './printService';

const chai = makeCartItem({
  id: 'chai',
  name: 'Kulhad Chai',
  price: 33.33,
  quantity: 3,
  product: makeFoodItem({
    id: 'chai',
    name: 'Kulhad Chai',
    restaurantId: 'mutka-king',
  }),
  restaurantId: 'mutka-king',
  restaurantName: 'Mutka King',
});

describe('buildReceiptLayout', () => {
  it('groups by restaurant in first-added order with subtotals', () => {
    const paneer = makeCartItem({ quantity: 2 });
    const naan = makeCartItem({
      id: 'naan',
      name: 'Butter Naan',
      price: 40,
      option: { size: 'Full', base: 'Paratha' },
    });
    const layout = buildReceiptLayout([paneer, chai, naan]);

    expect(layout.showHeadings).toBe(true);
    expect(layout.showSubtotals).toBe(true);
    expect(layout.sections.map((s) => s.restaurantName)).toEqual([
      "Bob's",
      'Mutka King',
    ]);
    expect(layout.sections[0].subtotal).toBe(540);
    expect(layout.sections[0].lines.map((l) => l.detail)).toEqual([
      'Full x2 @ ₹250',
      'Full Paratha x1 @ ₹40',
    ]);
    expect(layout.sections[1]).toMatchObject({ subtotal: 99.99 });
    expect(layout.sections[1].lines[0].amount).toBe(99.99);
  });

  it("hides headings and subtotals on a Bob's-only receipt", () => {
    const layout = buildReceiptLayout([makeCartItem()]);
    expect(layout.showHeadings).toBe(false);
    expect(layout.showSubtotals).toBe(false);
  });

  it('shows the heading for a single non-Bob’s restaurant', () => {
    const layout = buildReceiptLayout([chai]);
    expect(layout.showHeadings).toBe(true);
    expect(layout.showSubtotals).toBe(false);
  });

  it("puts items without a restaurant (old carts) under Bob's and marks free items", () => {
    const layout = buildReceiptLayout([
      makeCartItem({
        restaurantId: undefined,
        restaurantName: undefined,
        marketId: undefined,
        isFreeClaim: true,
        price: 0,
      }),
    ]);
    expect(layout.sections[0].restaurantId).toBe('bobs');
    expect(layout.sections[0].lines[0].detail).toBe('Full x1 @ FREE');
  });
});

describe('collectPageCss', () => {
  it('joins readable rules and skips cross-origin sheets', () => {
    const readable = {
      cssRules: [{ cssText: '.a{color:red}' }, { cssText: '.b{}' }],
    };
    const crossOrigin = {
      get cssRules(): never {
        throw new Error('SecurityError');
      },
    };
    expect(collectPageCss([readable, crossOrigin])).toBe('.a{color:red}\n.b{}');
  });
});
