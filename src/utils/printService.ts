/**
 * Print utility for text-based receipts
 */

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

  // Get the HTML content from the element
  const htmlContent = element.innerHTML;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Receipt</title>
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
