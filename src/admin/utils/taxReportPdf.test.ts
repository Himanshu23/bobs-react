import { describe, expect, it } from 'vitest';
import { TaxReport, TaxTotals } from '../types/orders';
import {
  buildTaxReportPdf,
  dayRows,
  formatInr,
  formatIsoDate,
  orderRows,
  summaryRows,
  taxReportFileName,
} from './taxReportPdf';

const totals = (over: Partial<TaxTotals> = {}): TaxTotals => ({
  orders: 2,
  grossSales: 900,
  freeItems: 150,
  promotionalSavings: 30,
  discounts: 50,
  netSales: 670,
  taxableValue: 638.1,
  cgst: 15.95,
  sgst: 15.95,
  deliveryFees: 20,
  deliveryTaxableValue: 16.95,
  deliveryCgst: 1.53,
  deliverySgst: 1.52,
  totalTaxableValue: 655.05,
  totalGst: 34.95,
  totalInvoiceValue: 690,
  ...over,
});

const report = (names = ['Matka King']): TaxReport => ({
  from: '2026-10-01',
  to: '2026-10-31',
  timezone: 'Asia/Kolkata',
  foodGstRatePercent: 5,
  deliveryGstRatePercent: 18,
  restaurants: names.map((name, i) => ({
    restaurantId: `r${i}`,
    restaurantName: name,
    gstin: i === 0 ? '09ABCDE1234F1Z5' : null,
    address: 'Sector 18, Noida',
    totals: totals(),
    days: [{ day: '2026-10-04', totals: totals() }],
    orders: [
      {
        orderId: '6ac25e84764cd5a839f3b5af',
        createdAt: '2026-10-04 19:41',
        day: '2026-10-04',
        fulfillmentType: 'PICKUP',
        directSale: true,
        grossSales: 650,
        freeItems: 0,
        promotionalSavings: 0,
        discount: 0,
        netSales: 650,
        taxableValue: 619.05,
        cgst: 15.48,
        sgst: 15.47,
        deliveryFee: 0,
        deliveryTaxableValue: 0,
        deliveryCgst: 0,
        deliverySgst: 0,
        invoiceValue: 650,
      },
    ],
  })),
});

describe('formatting', () => {
  it('formats rupees with Indian grouping and no ₹ glyph', () => {
    expect(formatInr(123456.5)).toBe('Rs. 1,23,456.50');
    expect(formatInr(-50)).toBe('-Rs. 50.00');
    expect(formatInr(undefined)).toBe('Rs. 0.00');
  });

  it('formats ISO dates', () => {
    expect(formatIsoDate('2026-10-04')).toBe('04 Oct 2026');
  });
});

describe('table rows', () => {
  it('summary shows the deductions as negatives and GST split by half-rates', () => {
    const rows = summaryRows(totals(), 5, 18);
    expect(rows).toContainEqual(['Less: free items', '-Rs. 150.00']);
    expect(rows).toContainEqual(['CGST @ 2.5%', 'Rs. 15.95']);
    expect(rows).toContainEqual(['Delivery SGST @ 9%', 'Rs. 1.52']);
    expect(rows[rows.length - 1]).toEqual([
      'Total invoice value',
      'Rs. 690.00',
    ]);
  });

  it('day rows end with a total row', () => {
    const rows = dayRows(report().restaurants[0]);
    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBe('04 Oct 2026');
    expect(rows[1][0]).toBe('Total');
    expect(rows[1][7]).toBe('Rs. 3.05'); // delivery CGST + SGST
  });

  it('order rows show the full order id and mark direct sales', () => {
    expect(orderRows(report().restaurants[0])[0].slice(0, 4)).toEqual([
      '2026-10-04 19:41',
      '6ac25e84764cd5a839f3b5af',
      'Pickup (direct)',
      'Rs. 650.00',
    ]);
  });
});

describe('file', () => {
  it('names the file after the restaurant and period', () => {
    expect(taxReportFileName(report())).toBe(
      'GST-report_matka-king_2026-10-01_2026-10-31.pdf'
    );
    expect(taxReportFileName(report(['A', "Bob's"]))).toBe(
      'GST-report_all-restaurants_2026-10-01_2026-10-31.pdf'
    );
  });

  it('builds a PDF with one section per restaurant', () => {
    const doc = buildTaxReportPdf(report(['Matka King', "Bob's"]));
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('refuses an empty report', () => {
    expect(() => buildTaxReportPdf({ ...report(), restaurants: [] })).toThrow(
      /No sales/
    );
  });
});
