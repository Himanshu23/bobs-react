import { useMutation } from '@tanstack/react-query';
import { ENDPOINTS } from '../../config/api';
import { ApiErrorBody } from '../../types/marketplace';
import { CreateOrderRequest, PublicOrder } from '../../types/order';
import { getHeaders } from '../../utils/authHelpers';
import { PlaceOrderError } from '../../utils/checkoutOrder';

/**
 * `POST /api/orders` (public, §5.6). Returns the public order shape (201).
 * D12: for a pickup from two or more restaurants the server creates one order
 * per restaurant; the response is the first one plus `checkoutGroupId` and
 * `groupOrders` (all of them). Use `getCheckoutOrders`/`summarizePlacedCheckout`
 * from `utils/checkoutOrder` to read it.
 * Failures throw `PlaceOrderError`: `status` 0 for a network error, else the
 * HTTP status with the server's `{"error"}` text when there is one.
 */
export const placeOrder = async (
  order: CreateOrderRequest
): Promise<PublicOrder> => {
  let response: Response;
  try {
    response = await fetch(ENDPOINTS.CREATE_ORDER, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(order),
    });
  } catch {
    throw new PlaceOrderError(0);
  }

  if (!response.ok) {
    let serverMessage: string | undefined;
    try {
      const body: ApiErrorBody = await response.json();
      serverMessage = body?.error || undefined;
    } catch {
      // Empty or non-JSON body (e.g. the bare 400 kept for old errors).
    }
    throw new PlaceOrderError(response.status, serverMessage);
  }

  return (await response.json()) as PublicOrder;
};

/** Customer checkout's "place order" mutation (replaces `useCreateOrder` there). */
export const usePlaceOrder = () =>
  useMutation<PublicOrder, PlaceOrderError, CreateOrderRequest>({
    mutationFn: placeOrder,
    onError: (error) => {
      console.error('Error placing order:', error);
    },
  });
