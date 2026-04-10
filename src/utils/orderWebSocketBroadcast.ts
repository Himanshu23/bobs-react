/**
 * Utility for broadcasting order updates to all connected devices via WebSocket
 */

let stompClient: any = null;

/**
 * Initialize the broadcast client (called once by useOrderWebSocket)
 */
export const initBroadcastClient = (client: any): void => {
  stompClient = client;
  console.log('[ORDER-BROADCAST] Client initialized');
};

/**
 * Broadcast order status update to all connected devices
 * This ensures multi-device synchronization when an order status changes
 */
export const broadcastOrderStatusUpdate = (orderId: string, status: string, orderData?: any): void => {
  if (!stompClient || !stompClient.connected) {
    console.warn('[ORDER-BROADCAST] STOMP client not connected, cannot broadcast');
    return;
  }

  try {
    const message = {
      type: 'order_status',
      orderId,
      status,
      timestamp: new Date().toISOString(),
      data: orderData,
    };

    // Publish to topic so all connected clients receive the update
    stompClient.publish({
      destination: '/app/orders.status-update', // Backend should forward to /topic/orders.status
      body: JSON.stringify(message),
    });

    console.log('[ORDER-BROADCAST] ✅ Status update broadcasted:', {
      orderId,
      status,
      timestamp: message.timestamp,
    });
  } catch (error) {
    console.error('[ORDER-BROADCAST] Failed to broadcast:', error);
  }
};

/**
 * Broadcast order acceptance (convenience function)
 */
export const broadcastOrderAccepted = (orderId: string, orderData?: any): void => {
  broadcastOrderStatusUpdate(orderId, 'PREPARING', orderData);
};

/**
 * Broadcast order completion
 */
export const broadcastOrderCompleted = (orderId: string, orderData?: any): void => {
  broadcastOrderStatusUpdate(orderId, 'COMPLETED', orderData);
};

/**
 * Broadcast order cancellation
 */
export const broadcastOrderCancelled = (orderId: string, orderData?: any): void => {
  broadcastOrderStatusUpdate(orderId, 'CANCELLED', orderData);
};
