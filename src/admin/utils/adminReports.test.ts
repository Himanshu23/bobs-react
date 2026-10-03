import { describe, expect, it } from 'vitest';
import { OrderStatus } from '../../types';
import { PayoutLine, PayoutReport } from '../types/orders';
import {
  averageOrderValue,
  buildMarkPaidRequest,
  buildQueryString,
  dateRangeError,
  formatMarkPaidResult,
  formatPayoutTotals,
  linesForRestaurant,
  payoutQueryString,
  salesQueryString,
  salesRowLabel,
  sumSalesRows,
  unpaidSelection,
  utcIsoDate,
  utcMonthStart,
} from './adminReports';

const line = (overrides: Partial<PayoutLine> = {}): PayoutLine => ({
  orderId: 'o1',
  restaurantId: 'bobs',
  restaurantName: "Bob's",
  createdAt: '2026-09-27T10:00:00Z',
  status: OrderStatus.COMPLETED,
  subtotal: 500,
  commissionAmount: 0,
  discountShareAmount: 0,
  payoutAmount: 500,
  payoutStatus: 'UNPAID',
  payoutRef: null,
  paidAt: null,
  ...overrides,
});

const report: PayoutReport = {
  from: '2026-09-01',
  to: '2026-09-30',
  totalOwed: 599.99,
  totalPaid: 1200,
  restaurants: [
    {
      restaurantId: 'bobs',
      restaurantName: "Bob's",
      owedAmount: 500,
      paidAmount: 1200,
      unpaidCount: 1,
      paidCount: 3,
    },
    {
      restaurantId: 'mutka-king',
      restaurantName: 'Mutka King',
      owedAmount: 99.99,
      paidAmount: 0,
      unpaidCount: 2,
      paidCount: 0,
    },
  ],
  lines: [
    line(),
    line({ orderId: 'o0', payoutStatus: 'PAID', payoutRef: 'UTR 1' }),
    line({
      orderId: 'o1',
      restaurantId: 'mutka-king',
      restaurantName: 'Mutka King',
      subtotal: 66.66,
      payoutAmount: 66.66,
    }),
    line({
      orderId: 'o2',
      restaurantId: 'mutka-king',
      restaurantName: 'Mutka King',
      subtotal: 33.33,
      payoutAmount: 33.33,
    }),
  ],
};

describe('dates (UTC days)', () => {
  it('gives UTC ISO dates, not local ones', () => {
    // 02:00 IST on 1 Oct is still 30 Sep in UTC.
    const now = new Date('2026-09-30T20:30:00Z');
    expect(utcIsoDate(now)).toBe('2026-09-30');
    expect(utcIsoDate(now, 7)).toBe('2026-09-23');
    expect(utcMonthStart(now)).toBe('2026-09-01');
  });

  it('checks the range like the server', () => {
    expect(dateRangeError('2026-09-10', '2026-09-01')).toMatch(/before/);
    expect(dateRangeError('2026-09-01', '2026-09-01')).toBeNull();
    expect(dateRangeError('', '2026-09-01')).toBeNull();
  });
});

describe('query strings', () => {
  it('leaves out empty params', () => {
    expect(buildQueryString({ a: '', b: undefined, c: null })).toBe('');
    expect(
      payoutQueryString({
        from: '2026-09-01',
        to: '2026-09-30',
        restaurantId: 'mutka-king',
        status: '',
      })
    ).toBe('?from=2026-09-01&to=2026-09-30&restaurantId=mutka-king');
    expect(
      salesQueryString({ from: '2026-09-01', groupBy: 'day', restaurantId: '' })
    ).toBe('?from=2026-09-01&groupBy=day');
  });
});

describe('payout totals and selection', () => {
  it('formats the headline totals', () => {
    expect(formatPayoutTotals(report)).toEqual({
      owed: '₹599.99',
      paid: '₹1,200.00',
      unpaidLines: 3,
      paidLines: 3,
    });
    expect(formatPayoutTotals(undefined)).toEqual({
      owed: '₹0.00',
      paid: '₹0.00',
      unpaidLines: 0,
      paidLines: 0,
    });
  });

  it('drills down per restaurant', () => {
    expect(
      linesForRestaurant(report, 'mutka-king').map((l) => l.orderId)
    ).toEqual(['o1', 'o2']);
    expect(linesForRestaurant(undefined, 'bobs')).toEqual([]);
  });

  it('previews only UNPAID lines, optionally the selected ones', () => {
    expect(unpaidSelection(report, 'bobs')).toEqual({ count: 1, amount: 500 });
    expect(unpaidSelection(report, 'mutka-king')).toEqual({
      count: 2,
      amount: 99.99,
    });
    expect(unpaidSelection(report, 'mutka-king', ['o2'])).toEqual({
      count: 1,
      amount: 33.33,
    });
    // o0 is already PAID.
    expect(unpaidSelection(report, 'bobs', ['o0'])).toEqual({
      count: 0,
      amount: 0,
    });
  });
});

describe('buildMarkPaidRequest', () => {
  const base = {
    restaurantId: 'mutka-king',
    payoutRef: '  UTR 1234 ',
    from: '2026-09-01',
    to: '2026-09-30',
  };

  it('sends the range when nothing is selected', () => {
    expect(buildMarkPaidRequest(base)).toEqual({
      request: {
        restaurantId: 'mutka-king',
        payoutRef: 'UTR 1234',
        from: '2026-09-01',
        to: '2026-09-30',
      },
    });
  });

  it('sends only the selected orderIds', () => {
    expect(buildMarkPaidRequest({ ...base, orderIds: ['o2'] })).toEqual({
      request: {
        restaurantId: 'mutka-king',
        payoutRef: 'UTR 1234',
        orderIds: ['o2'],
      },
    });
  });

  it('mirrors the server validation', () => {
    expect(buildMarkPaidRequest({ ...base, restaurantId: '' }).error).toMatch(
      /restaurant/i
    );
    expect(buildMarkPaidRequest({ ...base, payoutRef: '  ' }).error).toMatch(
      /reference/i
    );
    expect(buildMarkPaidRequest({ ...base, to: '' }).error).toMatch(
      /From and To/
    );
    expect(buildMarkPaidRequest({ ...base, from: '2026-10-01' }).error).toMatch(
      /before/
    );
  });

  it('describes the (idempotent) result', () => {
    expect(
      formatMarkPaidResult({
        restaurantId: 'mutka-king',
        payoutRef: 'UTR 1234',
        paidAt: '2026-09-30T12:00:00Z',
        linesMarkedPaid: 2,
        amountMarkedPaid: 1099.99,
      })
    ).toBe('Marked 2 lines paid for mutka-king: ₹1,099.99 (ref UTR 1234).');
    expect(
      formatMarkPaidResult({
        restaurantId: 'mutka-king',
        payoutRef: 'UTR 1234',
        paidAt: '2026-09-30T12:00:00Z',
        linesMarkedPaid: 0,
        amountMarkedPaid: 0,
      })
    ).toMatch(/already paid/);
  });
});

describe('sales report helpers', () => {
  it('computes the average order value', () => {
    expect(averageOrderValue({ orders: 3, grossSubtotal: 100 })).toBe(33.33);
    expect(averageOrderValue({ orders: 0, grossSubtotal: 50 })).toBe(0);
  });

  it('labels and sums rows', () => {
    const rows = [
      {
        restaurantId: 'bobs',
        restaurantName: "Bob's",
        day: null,
        orders: 42,
        items: 97,
        grossSubtotal: 21450,
        commission: 0,
        discountShare: 0,
        payout: 21450,
        freeClaimValue: 750,
      },
      {
        restaurantId: 'mutka-king',
        restaurantName: 'Mutka King',
        day: null,
        orders: 5,
        items: 9,
        grossSubtotal: 1650.1,
        commission: 0.2,
        discountShare: 0,
        payout: 1649.9,
        freeClaimValue: 0,
      },
    ];
    expect(salesRowLabel(rows[1])).toBe('Mutka King');
    expect(
      salesRowLabel({
        ...rows[0],
        restaurantId: null,
        restaurantName: null,
        day: '2026-09-27',
      })
    ).toBe('2026-09-27');
    expect(sumSalesRows(rows)).toEqual({
      orders: 47,
      items: 106,
      grossSubtotal: 23100.1,
      commission: 0.2,
      discountShare: 0,
      payout: 23099.9,
      freeClaimValue: 750,
    });
  });
});
