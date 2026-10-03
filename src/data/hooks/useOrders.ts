import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Order, OrderStatus } from '../../types';
import { ENDPOINTS } from '../../config/api';
import { fetchWithAdminAuth, getHeaders } from '../../utils/authHelpers';
import { toApiError } from '../../admin/api/apiError';
import {
  AdminFullOrder,
  AdminOrderListResponse,
} from '../../admin/types/orders';
import { replaceOrderInList } from '../../admin/utils/adminOrders';
import {
  ADMIN_PAYOUTS_KEY,
  ADMIN_SALES_KEY,
} from '../../admin/hooks/useAdminReports';

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

// Admin endpoints below return the full order shape (§5.5) and surface the
// backend's {"error"} message (incl. 409 conflicts) via toApiError.

const fetchOrdersByDateRange = async (
  fromDate: string,
  toDate: string
): Promise<AdminOrderListResponse> => {
  const response = await fetchWithAdminAuth(
    `${ENDPOINTS.CREATE_ORDER}?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw await toApiError(response, 'Failed to fetch orders');
  }

  return response.json();
};

const fetchOrdersByStatus = async (
  statuses: OrderStatus[]
): Promise<AdminOrderListResponse> => {
  const statusParams = statuses
    .map((status) => `status=${encodeURIComponent(status)}`)
    .join('&');
  const response = await fetchWithAdminAuth(
    `${ENDPOINTS.CREATE_ORDER}?${statusParams}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw await toApiError(response, 'Failed to fetch orders by status');
  }

  return response.json();
};

const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<AdminFullOrder> => {
  const response = await fetchWithAdminAuth(
    `${ENDPOINTS.CREATE_ORDER}/${encodeURIComponent(orderId)}/status?status=${encodeURIComponent(status)}`,
    {
      method: 'PATCH',
    }
  );

  if (!response.ok) {
    throw await toApiError(response, 'Failed to update order status');
  }

  return response.json();
};

/** PATCH /orders/{id}/restaurants/{restaurantId}/status (§5.8). */
const updateRestaurantOrderStatus = async (
  orderId: string,
  restaurantId: string,
  status: OrderStatus
): Promise<AdminFullOrder> => {
  const response = await fetchWithAdminAuth(
    `${ENDPOINTS.CREATE_ORDER}/${encodeURIComponent(orderId)}/restaurants/${encodeURIComponent(restaurantId)}/status?status=${encodeURIComponent(status)}`,
    {
      method: 'PATCH',
    }
  );

  if (!response.ok) {
    throw await toApiError(response, 'Failed to update restaurant status');
  }

  return response.json();
};

const deleteOrder = async (orderId: string): Promise<void> => {
  const response = await fetchWithAdminAuth(
    `${ENDPOINTS.CREATE_ORDER}/${orderId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw await toApiError(response, 'Failed to delete order');
  }
};

type QueryClient = ReturnType<typeof useQueryClient>;

/** Put the returned order into the cached lists at once, then refetch. */
const applyUpdatedOrder = (queryClient: QueryClient, order: AdminFullOrder) => {
  queryClient.setQueriesData<AdminOrderListResponse>(
    { queryKey: ['currentOrders'] },
    (data) => replaceOrderInList(data, order)
  );
  queryClient.setQueriesData<AdminOrderListResponse>(
    { queryKey: ['orders'] },
    (data) => replaceOrderInList(data, order)
  );
  invalidateOrderData(queryClient);
};

/** Status changes also move sub-orders in/out of payouts and sales (CANCELLED). */
const invalidateOrderData = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['currentOrders'] });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ADMIN_PAYOUTS_KEY });
  queryClient.invalidateQueries({ queryKey: ADMIN_SALES_KEY });
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
  return useQuery<AdminOrderListResponse, Error>({
    queryKey: ['orders', fromDate, toDate],
    queryFn: () => fetchOrdersByDateRange(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useCurrentOrders = () => {
  return useQuery<AdminOrderListResponse, Error>({
    queryKey: ['currentOrders'],
    queryFn: () =>
      fetchOrdersByStatus([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        // READY is now a derived overall status (every restaurant ready).
        OrderStatus.READY,
        OrderStatus.COMPLETED,
      ]),
    staleTime: Infinity, // Keep cached data indefinitely
    refetchInterval: false, // No automatic polling
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

/**
 * Overall status (PATCH /orders/{id}/status). It also sets every non-CANCELLED
 * sub-order to the same status (§5.8).
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AdminFullOrder,
    Error,
    { orderId: string; status: OrderStatus }
  >({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    retry: false,
    onSuccess: (data) => applyUpdatedOrder(queryClient, data),
    onError: (error) => {
      console.error('Error updating order status:', error);
      // A 409/404 means our copy is stale: reload it.
      invalidateOrderData(queryClient);
    },
  });
};

/**
 * One restaurant's sub-order status. The server re-derives the overall status
 * and returns the full order (§5.8). 409 → the order changed; we refetch.
 */
export const useUpdateRestaurantOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AdminFullOrder,
    Error,
    { orderId: string; restaurantId: string; status: OrderStatus }
  >({
    mutationFn: ({ orderId, restaurantId, status }) =>
      updateRestaurantOrderStatus(orderId, restaurantId, status),
    retry: false,
    onSuccess: (data) => applyUpdatedOrder(queryClient, data),
    onError: (error) => {
      console.error('Error updating restaurant status:', error);
      invalidateOrderData(queryClient);
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (orderId) => deleteOrder(orderId),
    onSuccess: () => {
      console.log('Order deleted successfully');
      invalidateOrderData(queryClient);
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
    },
  });
};
