/**
 * Pure helpers for the Payouts and Reporting tabs (tasks 5.4/5.5, contract
 * §5.9/§5.10).
 */
import {
  MarkPaidRequest,
  MarkPaidResponse,
  PayoutFilters,
  PayoutLine,
  PayoutReport,
  SalesFilters,
  SalesRow,
} from '../types/orders';
import { formatRupees, roundMoney } from './adminOrders';

// ------------------------------------------------------------------ dates

/**
 * Report days are UTC on the backend (§5 Phase 3 conventions, §9): `from`/`to`
 * are ISO dates, both inclusive, compared with the order's UTC `createdAt`.
 */
export const UTC_DAY_NOTE =
  'Dates are UTC days: orders placed between 00:00 and 05:30 IST count on the previous day.';

/** ISO date (yyyy-MM-dd) of the UTC day `daysAgo` days before `now`. */
export const utcIsoDate = (now: Date = new Date(), daysAgo = 0): string => {
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

/** First day of the UTC month of `now`. */
export const utcMonthStart = (now: Date = new Date()): string =>
  `${now.toISOString().slice(0, 7)}-01`;

/** Client-side check matching the server's `'to' must not be before 'from'`. */
export const dateRangeError = (from?: string, to?: string): string | null =>
  from && to && to < from ? "'To' must not be before 'From'" : null;

/** Builds `?a=b&…`, leaving out empty values. '' when nothing is set. */
export const buildQueryString = (
  params: Record<string, string | undefined | null>
): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      search.set(key, String(value).trim());
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const payoutQueryString = (filters: PayoutFilters): string =>
  buildQueryString({
    from: filters.from,
    to: filters.to,
    restaurantId: filters.restaurantId,
    status: filters.status,
  });

export const salesQueryString = (filters: SalesFilters): string =>
  buildQueryString({
    from: filters.from,
    to: filters.to,
    groupBy: filters.groupBy,
    restaurantId: filters.restaurantId,
  });

// ---------------------------------------------------------------- payouts

/** Drill-down lines for one restaurant (server order: newest first). */
export const linesForRestaurant = (
  report: Pick<PayoutReport, 'lines'> | undefined,
  restaurantId: string
): PayoutLine[] =>
  (report?.lines ?? []).filter((line) => line.restaurantId === restaurantId);

export interface UnpaidSelection {
  count: number;
  amount: number;
}

/**
 * The UNPAID lines of a restaurant that a mark-paid call would touch, from the
 * loaded report: the selected `orderIds`, or all of them when none are
 * selected. Used for the confirm dialog preview only; the server decides.
 */
export const unpaidSelection = (
  report: Pick<PayoutReport, 'lines'> | undefined,
  restaurantId: string,
  orderIds: string[] = []
): UnpaidSelection => {
  const lines = linesForRestaurant(report, restaurantId).filter(
    (line) =>
      line.payoutStatus === 'UNPAID' &&
      (orderIds.length === 0 || orderIds.includes(line.orderId))
  );
  return {
    count: lines.length,
    amount: roundMoney(
      lines.reduce((sum, l) => sum + (l.payoutAmount ?? 0), 0)
    ),
  };
};

export interface MarkPaidInput {
  restaurantId: string;
  payoutRef: string;
  from?: string;
  to?: string;
  /** Selected lines. When set, only these orders are sent. */
  orderIds?: string[];
}

export type MarkPaidBuildResult =
  | { request: MarkPaidRequest; error?: undefined }
  | { request?: undefined; error: string };

/**
 * Builds the mark-paid body (§5.9) with the server's own rules checked first:
 * restaurantId and payoutRef are required; send the selected orderIds, or else
 * a complete from/to range.
 */
export const buildMarkPaidRequest = (
  input: MarkPaidInput
): MarkPaidBuildResult => {
  const restaurantId = input.restaurantId.trim();
  const payoutRef = input.payoutRef.trim();
  if (!restaurantId) return { error: 'Pick a restaurant to mark paid' };
  if (!payoutRef)
    return { error: 'Enter a payout reference (e.g. UTR number)' };
  const orderIds = (input.orderIds ?? []).filter(Boolean);
  if (orderIds.length) {
    return { request: { restaurantId, payoutRef, orderIds } };
  }
  if (!input.from || !input.to) {
    return {
      error: 'Set both From and To dates, or select the lines to mark paid',
    };
  }
  const rangeError = dateRangeError(input.from, input.to);
  if (rangeError) return { error: rangeError };
  return {
    request: { restaurantId, payoutRef, from: input.from, to: input.to },
  };
};

/** Result text for a mark-paid call. It is idempotent, so 0 is normal. */
export const formatMarkPaidResult = (result: MarkPaidResponse): string => {
  const count = result.linesMarkedPaid ?? 0;
  if (count === 0) {
    return `No lines changed: everything in that selection was already paid (ref ${result.payoutRef}).`;
  }
  return `Marked ${count} line${count === 1 ? '' : 's'} paid for ${result.restaurantId}: ${formatRupees(result.amountMarkedPaid)} (ref ${result.payoutRef}).`;
};

/** Headline totals of a payout report. */
export const formatPayoutTotals = (
  report:
    | Pick<PayoutReport, 'totalOwed' | 'totalPaid' | 'restaurants'>
    | undefined
): { owed: string; paid: string; unpaidLines: number; paidLines: number } => ({
  owed: formatRupees(report?.totalOwed),
  paid: formatRupees(report?.totalPaid),
  unpaidLines: (report?.restaurants ?? []).reduce(
    (sum, r) => sum + (r.unpaidCount ?? 0),
    0
  ),
  paidLines: (report?.restaurants ?? []).reduce(
    (sum, r) => sum + (r.paidCount ?? 0),
    0
  ),
});

// ------------------------------------------------------------ sales report

/** Row label: the restaurant name (groupBy=restaurant) or the UTC day. */
export const salesRowLabel = (row: SalesRow): string =>
  row.day ?? row.restaurantName ?? row.restaurantId ?? '—';

/** Σ of the table rows (a footer row). */
export const sumSalesRows = (
  rows: SalesRow[]
): Omit<SalesRow, 'restaurantId' | 'restaurantName' | 'day'> =>
  rows.reduce(
    (acc, row) => ({
      orders: acc.orders + (row.orders ?? 0),
      items: acc.items + (row.items ?? 0),
      grossSubtotal: roundMoney(acc.grossSubtotal + (row.grossSubtotal ?? 0)),
      commission: roundMoney(acc.commission + (row.commission ?? 0)),
      discountShare: roundMoney(acc.discountShare + (row.discountShare ?? 0)),
      payout: roundMoney(acc.payout + (row.payout ?? 0)),
      freeClaimValue: roundMoney(
        acc.freeClaimValue + (row.freeClaimValue ?? 0)
      ),
    }),
    {
      orders: 0,
      items: 0,
      grossSubtotal: 0,
      commission: 0,
      discountShare: 0,
      payout: 0,
      freeClaimValue: 0,
    }
  );

/** Item sales per order for a row (0 when it has no orders). */
export const averageOrderValue = (
  row: Pick<SalesRow, 'orders' | 'grossSubtotal'>
): number =>
  row.orders ? roundMoney((row.grossSubtotal ?? 0) / row.orders) : 0;
