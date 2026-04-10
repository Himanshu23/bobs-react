import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Order, OrderStatus } from '../../types';
import { ENDPOINTS } from '../../config/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  const stored = localStorage.getItem('admin_auth_token');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.token;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Get headers with auth token
 */
const getHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const createOrder = async (order: Order): Promise<Order> => {
  const response = await fetch(ENDPOINTS.CREATE_ORDER, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    throw new Error(`Failed to create order: ${response.statusText}`);
  }

  const data: Order = await response.json();
  return data;
};

const fetchOrdersByDateRange = async (
  fromDate: string,
  toDate: string
): Promise<Order[]> => {
  const response = await fetch(
    `${ENDPOINTS.CREATE_ORDER}?fromDate=${fromDate}&toDate=${toDate}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }

  const data: Order[] = await response.json();
  return data;
};

const fetchOrdersByStatus = async (
  statuses: OrderStatus[]
): Promise<Order[]> => {
  const statusParams = statuses
    .map((status) => `status=${encodeURIComponent(status)}`)
    .join('&');
  const response = await fetch(`${ENDPOINTS.CREATE_ORDER}?${statusParams}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders by status: ${response.statusText}`);
  }

  const data: Order[] = await response.json();
  return data;
};

const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<Order> => {
  const response = await fetch(
    `${ENDPOINTS.CREATE_ORDER}/${orderId}/status?status=${encodeURIComponent(status)}`,
    {
      method: 'PATCH',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.statusText}`);
  }

  const data: Order = await response.json();
  return data;
};

export const useCreateOrder = () => {
  return useMutation<Order, Error, Order>({
    mutationFn: (order) => createOrder(order),
    onSuccess: (data) => {
      console.log('Order created successfully:', data);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
    },
  });
};

export const useOrdersByDateRange = (fromDate: string, toDate: string) => {
  return useQuery<Order[], Error>({
    queryKey: ['orders', fromDate, toDate],
    queryFn: () => fetchOrdersByDateRange(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useCurrentOrders = () => {
  return useQuery<Order[], Error>({
    queryKey: ['currentOrders'],
    queryFn: () =>
      fetchOrdersByStatus([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.COMPLETED,
      ]),
    staleTime: Infinity, // Keep cached data indefinitely
    refetchInterval: false, // No automatic polling
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, { orderId: string; status: OrderStatus }>({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: (data) => {
      console.log('Order status updated:', data);
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['currentOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
    },
  });
};
