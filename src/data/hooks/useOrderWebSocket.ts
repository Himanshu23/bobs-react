import { useEffect, useRef, useCallback, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Order } from '../../types';
import { playNotificationSound } from '../../utils/notificationSound';
import { API_BASE_SOCKET_URL } from '../../config/api';

interface WebSocketMessage {
  type: 'new_order' | 'order_updated' | 'order_status';
  data: Order;
  timestamp?: string;
}

const WS_BASE_URL = API_BASE_SOCKET_URL;

export const useOrderWebSocket = (
  onNewOrder?: (order: Order) => void,
  onOrderUpdate?: (order: Order) => void
) => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isPageVisibleRef = useRef(true);
  const lastMessageTimeRef = useRef<number>(Date.now());

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case 'new_order':
          if (message.data.id && seenOrderIdsRef.current.has(message.data.id)) {
            console.log(`[WS-HOOK] duplicate ignored: ${message.data.id}`);
            return;
          }
          if (message.data.id) seenOrderIdsRef.current.add(message.data.id);
          onNewOrder?.(message.data);
          void playNotificationSound();
          break;
        case 'order_updated':
        case 'order_status':
          onOrderUpdate?.(message.data);
          break;
        default:
          console.log('[WS-HOOK] unknown message type:', message.type);
      }
    },
    [onNewOrder, onOrderUpdate]
  );

  const disconnect = useCallback(() => {
    // Clear any pending timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    subscriptionsRef.current.forEach((s) => {
      try {
        s.unsubscribe();
      } catch {
        // no-op
      }
    });
    subscriptionsRef.current = [];

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    seenOrderIdsRef.current.clear();
    setIsConnected(false);
    console.log('[WS-HOOK] disconnected');
  }, []);

  const connect = useCallback(() => {
    if (clientRef.current?.active) {
      console.log('[WS-HOOK] client already active');
      return;
    }

    if (!isPageVisibleRef.current) {
      console.log('[WS-HOOK] page not visible, deferring connection');
      return;
    }

    console.log('[WS-HOOK] HOOK_ACTIVE: useOrderWebSocket');
    console.log('[WS-HOOK] connecting', {
      sockJsUrl: `${WS_BASE_URL}/ws`,
      ts: new Date().toISOString(),
    });

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      reconnectDelay: 3000, // Faster reconnection attempts
      // maxReconnectAttempts: 10, // More reconnection attempts

      onConnect: () => {
        console.log('[WS-HOOK] ✅ STOMP Connected');
        setIsConnected(true);
        lastMessageTimeRef.current = Date.now();

        const subOrders = client.subscribe(
          '/topic/orders.created',
          (frame: IMessage) => {
            try {
              const parsed: WebSocketMessage = JSON.parse(frame.body);
              console.log('[WS-HOOK] message received:', parsed.type);
              lastMessageTimeRef.current = Date.now();
              handleMessage(parsed);
            } catch (err) {
              console.error('[WS-HOOK] message parse error:', err, frame.body);
            }
          }
        );

        const subErrors = client.subscribe(
          '/user/queue/errors',
          (frame: IMessage) => {
            console.error('[WS-HOOK] backend error queue:', frame.body);
          }
        );

        subscriptionsRef.current = [subOrders, subErrors];
      },

      onStompError: (frame) => {
        console.error(
          '[WS-HOOK] ❌ STOMP broker error:',
          frame.headers['message'],
          frame.body
        );
      },

      onWebSocketError: (event) => {
        console.error('[WS-HOOK] ❌ WebSocket error:', event);
        setIsConnected(false);
      },

      onWebSocketClose: (event) => {
        setIsConnected(false);
        console.error('[WS-HOOK] ❌ WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        // Attempt immediate reconnect if page is visible (after short delay)
        if (isPageVisibleRef.current && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            console.log('[WS-HOOK] attempting reconnect after close...');
            connect();
          }, 1000);
        }
      },

      onDisconnect: () => {
        setIsConnected(false);
        console.log('[WS-HOOK] ⚠️ STOMP Disconnected');
      },
    });

    clientRef.current = client;
    client.activate();
  }, [handleMessage]);

  const send = useCallback((message: WebSocketMessage) => {
    const client = clientRef.current;
    if (client?.connected) {
      client.publish({
        destination: '/app/orders.create',
        body: JSON.stringify(message),
      });
      console.log('[WS-HOOK] published to /app/orders.create');
      return true;
    }
    console.warn('[WS-HOOK] publish skipped: not connected');
    return false;
  }, []);

  useEffect(() => {
    // Handle visibility change (page goes to background/foreground)
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log('[WS-HOOK] visibility change:', isVisible);
      isPageVisibleRef.current = isVisible;

      if (isVisible) {
        // Page came back to foreground - reconnect immediately
        console.log('[WS-HOOK] page visible, reconnecting WebSocket...');
        if (!clientRef.current?.active) {
          connect();
        } else {
          // Already connected, just log it
          console.log('[WS-HOOK] WebSocket already active');
        }
      } else {
        // Page going to background - disconnect to save resources
        console.log('[WS-HOOK] page hidden, disconnecting WebSocket...');
        disconnect();
      }
    };

    // Handle focus/blur events (tab visibility)
    const handleFocus = () => {
      console.log('[WS-HOOK] window focus event');
      isPageVisibleRef.current = true;
      if (!clientRef.current?.active) {
        connect();
      }
    };

    const handleBlur = () => {
      console.log('[WS-HOOK] window blur event');
      isPageVisibleRef.current = false;
      disconnect();
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    connect();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    send,
    connect,
    disconnect,
  };
};
