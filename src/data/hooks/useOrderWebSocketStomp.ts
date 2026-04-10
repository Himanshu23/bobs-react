import { useEffect, useRef, useCallback } from 'react';
import { Order } from '../../types';

/**
 * STOMP message frame structure
 */
interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Order event wrapped with deduplication metadata
 */
interface OrderEvent {
  order: Order;
  messageId?: string;
  timestamp: number;
}

/**
 * Deduplication tracker for preventing duplicate orders on reconnect
 */
class DeduplicationManager {
  private seenOrderIds = new Map<string, number>();
  private seenMessageIds = new Set<string>();
  private readonly DEDUPE_WINDOW_MS = 60000; // 1 minute window

  isDuplicate(order: Order, messageId?: string): boolean {
    // Check message ID first (highest priority)
    if (messageId && this.seenMessageIds.has(messageId)) {
      return true;
    }

    // Check order ID with timestamp window
    if (order.id) {
      const lastSeenTime = this.seenOrderIds.get(order.id);
      if (lastSeenTime && Date.now() - lastSeenTime < this.DEDUPE_WINDOW_MS) {
        return true;
      }
    }

    return false;
  }

  addOrder(order: Order, messageId?: string): void {
    if (order.id) {
      this.seenOrderIds.set(order.id, Date.now());
    }
    if (messageId) {
      this.seenMessageIds.add(messageId);
    }
  }

  cleanup(): void {
    const now = Date.now();
    // Remove old entries outside the dedupe window
    for (const [orderId, timestamp] of this.seenOrderIds.entries()) {
      if (now - timestamp > this.DEDUPE_WINDOW_MS) {
        this.seenOrderIds.delete(orderId);
      }
    }
  }

  reset(): void {
    this.seenOrderIds.clear();
    this.seenMessageIds.clear();
  }
}

const WS_BASE_URL =
  typeof window !== 'undefined' ? `ws://localhost:8080` : 'ws://localhost:8080';

/**
 * Hook for STOMP-based WebSocket connection to /topic/orders.created
 * Includes deduplication, exponential backoff reconnect, and robust error handling
 */
export const useOrderWebSocketStomp = (
  onNewOrder?: (order: Order) => void,
  onOrderUpdate?: (order: Order) => void,
  onError?: (error: Error) => void
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000);
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const dedupeManagerRef = useRef(new DeduplicationManager());
  const subscriptionIdRef = useRef<string | null>(null);
  const stompHandshakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const handshakeTimeoutMs = 5000; // 5 second timeout for STOMP CONNECT

  /**
   * Parse a STOMP frame from raw text
   */
  const parseStompFrame = (data: string): StompFrame | null => {
    try {
      const lines = data.split('\n');
      const command = lines[0];

      if (!command) return null;

      const headers: Record<string, string> = {};
      let bodyStart = 0;

      // Parse headers
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          bodyStart = i + 1;
          break;
        }
        const [key, value] = line.split(':');
        if (key && value) {
          headers[key] = value;
        }
      }

      const body = lines.slice(bodyStart).join('\n').replace(/\0$/, '');

      return { command, headers, body };
    } catch (error) {
      console.error('Error parsing STOMP frame:', error);
      return null;
    }
  };

  /**
   * Send a STOMP frame
   */
  const sendStompFrame = useCallback((frame: StompFrame) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send frame');
      return;
    }

    let frameStr = frame.command + '\n';

    // Add headers
    for (const [key, value] of Object.entries(frame.headers)) {
      frameStr += `${key}:${value}\n`;
    }

    frameStr += '\n';
    if (frame.body) {
      frameStr += frame.body;
    }
    frameStr += '\0'; // STOMP frame terminator

    wsRef.current.send(frameStr);
  }, []);

  /**
   * Handle incoming STOMP MESSAGE frame
   */
  const handleOrderMessage = useCallback(
    (frame: StompFrame) => {
      if (!frame.body) return;

      try {
        const messageId = frame.headers['message-id'];
        const messageData = JSON.parse(frame.body) as OrderEvent;

        const dedupeManager = dedupeManagerRef.current;

        // Check for duplicates
        if (dedupeManager.isDuplicate(messageData.order, messageId)) {
          console.log(
            `Ignored duplicate order: ${messageData.order.id} (messageId: ${messageId})`
          );
          return;
        }

        // Track this order/message as seen
        dedupeManager.addOrder(messageData.order, messageId);

        // Determine if this is a new order or update
        const isNewOrder =
          !messageData.order.id ||
          messageData.order.status === 'PENDING' ||
          messageData.order.status === 'CONFIRMED';

        if (isNewOrder && onNewOrder) {
          console.log('New order received:', messageData.order);
          onNewOrder(messageData.order);
        } else if (onOrderUpdate) {
          console.log('Order updated:', messageData.order);
          onOrderUpdate(messageData.order);
        }
      } catch (error) {
        console.error('Error processing order message:', error);
        if (onError) {
          onError(
            error instanceof Error ? error : new Error('Failed to parse order')
          );
        }
      }
    },
    [onNewOrder, onOrderUpdate, onError]
  );

  /**
   * Handle incoming STOMP frames
   */
  const handleStompMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const frame = parseStompFrame(event.data);
        if (!frame) return;

        switch (frame.command) {
          case 'CONNECTED':
            // Clear the handshake timeout since we got the CONNECTED frame
            if (stompHandshakeTimeoutRef.current) {
              clearTimeout(stompHandshakeTimeoutRef.current);
              stompHandshakeTimeoutRef.current = null;
            }
            console.log('STOMP CONNECTED:', {
              version: frame.headers['version'],
              server: frame.headers['server'],
              timestamp: new Date().toISOString(),
            });
            // Subscribe to orders topic
            subscriptionIdRef.current = `sub-${Date.now()}`;
            sendStompFrame({
              command: 'SUBSCRIBE',
              headers: {
                id: subscriptionIdRef.current,
                destination: '/topic/orders.created',
                ack: 'auto',
              },
            });
            break;

          case 'MESSAGE':
            handleOrderMessage(frame);
            break;

          case 'ERROR':
            console.error('STOMP ERROR frame:', {
              message: frame.body,
              headers: frame.headers,
              timestamp: new Date().toISOString(),
            });
            if (onError) {
              onError(new Error(`STOMP Error: ${frame.body}`));
            }
            // Close connection on STOMP error
            if (wsRef.current) {
              wsRef.current.close(1000, 'STOMP error received');
            }
            break;

          case 'RECEIPT':
            console.log('STOMP RECEIPT:', frame.headers['receipt-id']);
            break;

          default:
            console.log('Unknown STOMP frame:', frame.command);
        }
      } catch (error) {
        console.error('Error handling STOMP message:', error);
      }
    },
    [handleOrderMessage, sendStompFrame, onError]
  );

  /**
   * Connect to WebSocket and establish STOMP
   */
  const connect = useCallback(() => {
    try {
      const wsUrl = `${WS_BASE_URL}/ws`;
      console.log('Establishing WebSocket connection:', {
        url: wsUrl,
        baseUrl: WS_BASE_URL,
        windowOrigin:
          typeof window !== 'undefined' ? window.location.origin : 'N/A',
        timestamp: new Date().toISOString(),
      });
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected:', {
          url: ws.url,
          readyState: ws.readyState,
          timestamp: new Date().toISOString(),
        });

        // Set timeout for STOMP handshake
        stompHandshakeTimeoutRef.current = setTimeout(() => {
          console.error(
            'STOMP handshake timeout - no CONNECTED frame received',
            {
              url: ws.url,
              readyState: ws.readyState,
              timeout: handshakeTimeoutMs,
            }
          );
          if (onError) {
            onError(
              new Error(
                `STOMP handshake timeout (${handshakeTimeoutMs}ms) - server may not be responding`
              )
            );
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1008, 'STOMP handshake timeout');
          }
        }, handshakeTimeoutMs);

        // Send STOMP CONNECT frame
        sendStompFrame({
          command: 'CONNECT',
          headers: {
            'accept-version': '1.0,1.1,1.2',
            'heart-beat': '10000,10000',
          },
        });

        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
      };

      ws.onmessage = handleStompMessage;

      ws.onerror = (event: Event) => {
        const wsError = event.target as WebSocket;
        console.error('WebSocket error:', {
          url: wsError.url,
          readyState: wsError.readyState,
          readyStateLabel: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][
            wsError.readyState
          ],
          timestamp: new Date().toISOString(),
        });
        const errorMsg = new Error(
          `WebSocket connection error: ${wsError.url} (readyState: ${wsError.readyState})`
        );
        if (onError) {
          onError(errorMsg);
        }
      };

      ws.onclose = (closeEvent) => {
        console.log('WebSocket closed:', {
          code: closeEvent.code,
          reason: closeEvent.reason,
          wasClean: closeEvent.wasClean,
          url: ws.url,
          timestamp: new Date().toISOString(),
        });
        // Clear handshake timeout if still pending
        if (stompHandshakeTimeoutRef.current) {
          clearTimeout(stompHandshakeTimeoutRef.current);
          stompHandshakeTimeoutRef.current = null;
        }
        subscriptionIdRef.current = null;
        attemptReconnect();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      attemptReconnect();
    }
  }, [handleStompMessage, sendStompFrame, onError]);

  /**
   * Attempt reconnection with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current += 1;
      const exponentialDelay =
        1000 * Math.pow(2, reconnectAttemptsRef.current - 1);
      const delay = Math.min(exponentialDelay, 30000); // Cap at 30s
      reconnectDelayRef.current = delay;

      console.log(
        `[Reconnect ${reconnectAttemptsRef.current}/${maxReconnectAttempts}] Retrying in ${delay}ms`
      );

      setTimeout(() => {
        connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      if (onError) {
        onError(new Error('Failed to reconnect after max attempts'));
      }
    }
  }, [connect, onError]);

  /**
   * Disconnect gracefully
   */
  const disconnect = useCallback(() => {
    // Clear handshake timeout
    if (stompHandshakeTimeoutRef.current) {
      clearTimeout(stompHandshakeTimeoutRef.current);
      stompHandshakeTimeoutRef.current = null;
    }

    if (
      subscriptionIdRef.current &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      // Unsubscribe first
      sendStompFrame({
        command: 'UNSUBSCRIBE',
        headers: {
          id: subscriptionIdRef.current,
        },
      });
      subscriptionIdRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [sendStompFrame]);

  /**
   * Initialize connection and cleanup interval
   */
  useEffect(() => {
    connect();

    // Cleanup old dedupe entries periodically
    cleanupIntervalRef.current = setInterval(() => {
      dedupeManagerRef.current.cleanup();
    }, 30000); // Cleanup every 30s

    return () => {
      disconnect();
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    resetDeduplication: () => dedupeManagerRef.current.reset(),
  };
};
