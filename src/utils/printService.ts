/**
 * Print utility for 58mm thermal printer receipts as image
 */

// Load html2canvas from CDN
const loadHtml2Canvas = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => {
      resolve((window as any).html2canvas);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const printReceiptAsImage = async (
  element: HTMLElement | null
): Promise<string> => {
  if (!element) {
    console.error('Receipt element not found');
    throw new Error('Receipt element not found');
  }

  try {
    const html2canvas = await loadHtml2Canvas();

    // Convert element to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: 220, // 58mm in pixels at 96dpi
      windowHeight: element.offsetHeight,
    });

    // Convert canvas to image data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error loading html2canvas:', error);
    throw error;
  }
};

export const printReceipt = (element: HTMLElement | null): void => {
  if (!element) {
    console.error('Receipt element not found');
    return;
  }

  printReceiptAsImage(element)
    .then((imageUrl) => {
      const printWindow = window.open('', '', 'width=600,height=800');
      if (!printWindow) {
        console.error('Failed to open print window');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f5f5f5;
                font-family: Arial, sans-serif;
              }
              .print-container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                text-align: center;
              }
              img {
                max-width: 58mm;
                width: 220px;
                height: auto;
                display: block;
                border: 2px solid #ddd;
                margin: 0 auto 20px;
                image-rendering: pixelated;
              }
              .button-group {
                display: flex;
                gap: 10px;
                justify-content: center;
              }
              button {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.3s;
              }
              .print-btn {
                background: #1976d2;
                color: white;
              }
              .print-btn:hover {
                background: #1565c0;
              }
              .close-btn {
                background: #f5f5f5;
                color: #333;
                border: 1px solid #ddd;
              }
              .close-btn:hover {
                background: #efefef;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <h3>Receipt Preview</h3>
              <img src="${imageUrl}" alt="Receipt" />
              <div class="button-group">
                <button class="print-btn" onclick="window.print()">🖨️ Print</button>
                <button class="close-btn" onclick="window.close()">✕ Close</button>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    })
    .catch((error) => {
      console.error('Error converting receipt to image:', error);
      alert('Error preparing receipt for printing. Please try again.');
    });
};
