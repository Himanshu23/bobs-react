/**
 * GST sales report → PDF (one section per restaurant). The figures come from
 * GET /reporting/tax; this file only lays them out. Table rows are built by
 * pure functions (tested); `downloadTaxReportPdf` draws them with jsPDF.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TaxOrderLine,
  TaxReport,
  TaxRestaurantSection,
  TaxTotals,
} from '../types/orders';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** `1234.5` → `Rs. 1,234.50` (Indian grouping; PDF fonts have no ₹ glyph). */
export const formatInr = (value: number | null | undefined): string => {
  const amount =
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const text = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}Rs. ${text}`;
};

/** `2026-10-04` → `04 Oct 2026`. */
export const formatIsoDate = (iso: string | null | undefined): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) return iso ?? '';
  return `${match[3]} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
};

/** Summary rows: label, amount. */
export const summaryRows = (
  totals: TaxTotals,
  foodRate: number,
  deliveryRate: number
): [string, string][] => [
  ['Orders', String(totals.orders)],
  ['Gross sales (menu prices)', formatInr(totals.grossSales)],
  ['Less: free items', formatInr(-totals.freeItems)],
  ['Less: promotional savings', formatInr(-totals.promotionalSavings)],
  ['Less: discounts', formatInr(-totals.discounts)],
  ['Net food sales (incl. GST)', formatInr(totals.netSales)],
  [`Taxable value @ ${foodRate}%`, formatInr(totals.taxableValue)],
  [`CGST @ ${foodRate / 2}%`, formatInr(totals.cgst)],
  [`SGST @ ${foodRate / 2}%`, formatInr(totals.sgst)],
  ['Delivery fees (incl. GST)', formatInr(totals.deliveryFees)],
  [
    `Delivery taxable value @ ${deliveryRate}%`,
    formatInr(totals.deliveryTaxableValue),
  ],
  [`Delivery CGST @ ${deliveryRate / 2}%`, formatInr(totals.deliveryCgst)],
  [`Delivery SGST @ ${deliveryRate / 2}%`, formatInr(totals.deliverySgst)],
  ['Total taxable value', formatInr(totals.totalTaxableValue)],
  ['Total GST', formatInr(totals.totalGst)],
  ['Total invoice value', formatInr(totals.totalInvoiceValue)],
];

export const DAY_HEAD = [
  'Date',
  'Orders',
  'Net sales',
  'Taxable',
  'CGST',
  'SGST',
  'Delivery',
  'Delivery GST',
  'Total',
];

export const dayRows = (section: TaxRestaurantSection): string[][] => [
  ...section.days.map(({ day, totals }) => [
    formatIsoDate(day),
    String(totals.orders),
    formatInr(totals.netSales),
    formatInr(totals.taxableValue),
    formatInr(totals.cgst),
    formatInr(totals.sgst),
    formatInr(totals.deliveryFees),
    formatInr(totals.deliveryCgst + totals.deliverySgst),
    formatInr(totals.totalInvoiceValue),
  ]),
  [
    'Total',
    String(section.totals.orders),
    formatInr(section.totals.netSales),
    formatInr(section.totals.taxableValue),
    formatInr(section.totals.cgst),
    formatInr(section.totals.sgst),
    formatInr(section.totals.deliveryFees),
    formatInr(section.totals.deliveryCgst + section.totals.deliverySgst),
    formatInr(section.totals.totalInvoiceValue),
  ],
];

export const ORDER_HEAD = [
  'Date & time',
  'Order',
  'Type',
  'Net sales',
  'Taxable',
  'CGST',
  'SGST',
  'Delivery',
  'Total',
];

const orderType = (line: TaxOrderLine): string => {
  const type =
    line.fulfillmentType === 'PICKUP'
      ? 'Pickup'
      : line.fulfillmentType === 'SCHEDULED'
        ? 'Scheduled'
        : 'Delivery';
  return line.directSale ? `${type} (direct)` : type;
};

export const orderRows = (section: TaxRestaurantSection): string[][] =>
  section.orders.map((line) => [
    line.createdAt ?? '',
    // Full id, so every line can be traced back to its order.
    line.orderId,
    orderType(line),
    formatInr(line.netSales),
    formatInr(line.taxableValue),
    formatInr(line.cgst),
    formatInr(line.sgst),
    formatInr(line.deliveryFee),
    formatInr(line.invoiceValue),
  ]);

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** `GST-report_matka-king_2026-10-01_2026-10-31.pdf` (or `_all-restaurants_`). */
export const taxReportFileName = (report: TaxReport): string => {
  const who =
    report.restaurants.length === 1
      ? slug(report.restaurants[0].restaurantName) || 'restaurant'
      : 'all-restaurants';
  return `GST-report_${who}_${report.from}_${report.to}.pdf`;
};

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

/** Draws the report. Throws if there are no sales in it. */
export const buildTaxReportPdf = (report: TaxReport): jsPDF => {
  if (report.restaurants.length === 0) {
    throw new Error('No sales in this period, so there is nothing to report.');
  }
  const doc: DocWithTable = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const generated = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const period = `${formatIsoDate(report.from)} to ${formatIsoDate(report.to)} (India time)`;

  report.restaurants.forEach((section, index) => {
    if (index > 0) doc.addPage();
    let y = margin;
    doc.setFont('helvetica', 'bold').setFontSize(16);
    doc.text('GST Sales Report', margin, y);
    y += 22;
    doc.setFontSize(12).text(section.restaurantName, margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal').setFontSize(9);
    const details = [
      section.gstin
        ? `GSTIN: ${section.gstin}`
        : 'GSTIN: not set (add it in Admin > Restaurants)',
      section.address ? `Address: ${section.address}` : null,
      section.fssaiNumber ? `FSSAI: ${section.fssaiNumber}` : null,
      `Period: ${period}`,
      `Generated: ${generated}`,
    ].filter((line): line is string => Boolean(line));
    details.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 515);
      doc.text(wrapped, margin, y);
      y += 12 * wrapped.length;
    });

    autoTable(doc, {
      startY: y + 6,
      head: [['Summary', 'Amount']],
      body: summaryRows(
        section.totals,
        report.foodGstRatePercent,
        report.deliveryGstRatePercent
      ),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [55, 65, 81] },
      columnStyles: { 1: { halign: 'right' } },
      tableWidth: 320,
      margin: { left: margin },
      didParseCell: (data) => {
        const label = String(data.row.raw && (data.row.raw as string[])[0]);
        if (data.section === 'body' && /^(Net food|Total)/.test(label)) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY ?? y) + 18,
      head: [DAY_HEAD],
      body: dayRows(section),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [55, 65, 81] },
      columnStyles: Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 7, 8].map((c) => [c, { halign: 'right' }])
      ),
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === section.days.length) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY ?? y) + 18,
      head: [ORDER_HEAD],
      body: orderRows(section),
      theme: 'striped',
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [55, 65, 81] },
      columnStyles: Object.fromEntries(
        [3, 4, 5, 6, 7, 8].map((c) => [c, { halign: 'right' }])
      ),
      margin: { left: margin, right: margin },
    });
  });

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(110);
    doc.text(
      `Menu prices include GST: food ${report.foodGstRatePercent}% (CGST + SGST), delivery ${report.deliveryGstRatePercent}%. ` +
        'Cancelled orders excluded. Orders spanning restaurants are split by each restaurant’s share.',
      margin,
      doc.internal.pageSize.getHeight() - 24,
      { maxWidth: 440 }
    );
    doc.text(
      `Page ${page} of ${pages}`,
      doc.internal.pageSize.getWidth() - margin,
      doc.internal.pageSize.getHeight() - 24,
      { align: 'right' }
    );
    doc.setTextColor(0);
  }

  return doc;
};

/** Builds the report and starts the download. */
export const downloadTaxReportPdf = (report: TaxReport): void => {
  buildTaxReportPdf(report).save(taxReportFileName(report));
};
