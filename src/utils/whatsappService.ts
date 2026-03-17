/**
 * WhatsApp integration utility
 * Crafts messages and generates WhatsApp links
 */

export interface OrderMessage {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
  total: number;
  habitat: string;
  tower: string;
  customerName?: string;
  phoneNumber?: string;
  instructions?: string;
}

/**
 * Format order message for WhatsApp
 */
export const formatOrderMessage = (order: OrderMessage): string => {
  const itemsList = order.items
    .map(
      (item) =>
        `• ${item.name} ${item.size ? `(${item.size})` : ''} x${item.quantity} - ₹${item.price}`
    )
    .join('\n');

  let message = `🍕 *Order from Bob's Restaurant*

*Items:*
${itemsList}

*Delivery Address:*
${order.habitat} - Tower ${order.tower}

*Total: ₹${order.total.toFixed(2)}*`;

  if (order.instructions && order.instructions.trim()) {
    message += `

*Special Instructions:*
${order.instructions}`;
  }

  message += '\n\nPlease confirm this order. Thank you! 🙏';

  return message;
};

/**
 * Generate WhatsApp link with pre-filled message
 */
export const getWhatsAppLink = (
  phoneNumber: string,
  message: string
): string => {
  // Remove any special characters from phone number except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  // Ensure it starts with country code (91 for India)
  const formattedPhone = cleanPhone.startsWith('+')
    ? cleanPhone
    : `+91${cleanPhone}`;

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp with order message
 */
export const openWhatsApp = (phoneNumber: string, message: string): void => {
  const link = getWhatsAppLink(phoneNumber, message);
  window.open(link, '_blank');
};
