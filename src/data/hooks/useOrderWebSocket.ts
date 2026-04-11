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
  const [isConnected, setIsConnected] = useState(false);

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

    console.log('[WS-HOOK] HOOK_ACTIVE: useOrderWebSocket');
    console.log('[WS-HOOK] connecting', {
      sockJsUrl: `${WS_BASE_URL}/ws`,
      ts: new Date().toISOString(),
    });

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('[WS-HOOK] ✅ STOMP Connected');
        setIsConnected(true);

        const subOrders = client.subscribe(
          '/topic/orders.created',
          (frame: IMessage) => {
            try {
              const parsed: WebSocketMessage = JSON.parse(frame.body);
              console.log('[WS-HOOK] message received:', parsed.type);
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
      },

      onWebSocketClose: (event) => {
        setIsConnected(false);
        console.error('[WS-HOOK] ❌ WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
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
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    send,
    connect,
    disconnect,
  };
};
