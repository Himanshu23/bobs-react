/**
 * Print utility for text-based receipts
 */

interface CssRuleListLike {
  length: number;
  [index: number]: { cssText: string };
}

interface StyleSheetLike {
  cssRules: CssRuleListLike;
}

/**
 * The CSS text of the page's style sheets. MUI/Emotion styles live in
 * CSSOM rules (not always in <style> text in production), so the receipt's
 * layout (restaurant groups, subtotals) would be lost in the print window
 * without them. Cross-origin sheets (e.g. Google Fonts) throw on access and
 * are skipped.
 */
export const collectPageCss = (sheets: ArrayLike<StyleSheetLike>): string => {
  const chunks: string[] = [];
  for (let i = 0; i < sheets.length; i += 1) {
    try {
      const rules = sheets[i].cssRules;
      for (let j = 0; j < rules.length; j += 1) {
        chunks.push(rules[j].cssText);
      }
    } catch {
      // Cross-origin style sheet: not readable, skip it.
    }
  }
  return chunks.join('\n');
};

export const printReceipt = (element: HTMLElement | null): void => {
  if (!element) {
    console.error('Receipt element not found');
    return;
  }

  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  // The receipt markup, including its root (which carries the 58mm width).
  const htmlContent = element.outerHTML;
  const pageCss = collectPageCss(
    document.styleSheets as unknown as ArrayLike<StyleSheetLike>
  );

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Receipt</title>
        <style>${pageCss.replace(/<\/style/gi, '<\\/style')}</style>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Courier New', monospace;
            background: white;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
