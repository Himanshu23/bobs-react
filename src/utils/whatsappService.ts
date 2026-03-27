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
  deliveryMethod?: 'pickup' | 'delivery';
  flatNumber?: string;
  discountCode?: string;
  discountName?: string;
  discountAmount?: number;
  tax?: number;
  scheduledTime?: string;
}

const formatScheduledTime = (time: string): string => {
  const [hoursText, minutes] = time.split(':');
  const hours = Number(hoursText);

  if (Number.isNaN(hours) || !minutes) {
    return time;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes} ${period}`;
};

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

*Customer:* ${order.customerName || 'Guest'}

*Items:*
${itemsList}`;

  if (order.deliveryMethod === 'pickup') {
    message += `

*Order Type:* Pickup 🎉
*Location:* Bob's Kitchen`;
  } else {
    message += `

*Delivery Address:*
${order.habitat}`;
  }

  if (order.scheduledTime) {
    message += `

*Scheduled For:* ${formatScheduledTime(order.scheduledTime)}`;
  }

  if (order.discountAmount && order.discountAmount > 0) {
    message += `

*Discount Applied:* ${order.discountName || 'Offer'}${
      order.discountCode ? ` (${order.discountCode})` : ''
    }
*Discount Value:* -₹${order.discountAmount.toFixed(2)}`;
  }

  if (order.tax && order.tax > 0) {
    message += `

*Tax (shown only, not charged):* ~~₹${order.tax.toFixed(2)}~~`;
  }

  message += `

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
