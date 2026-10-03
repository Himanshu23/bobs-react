/**
 * React Query hooks for payouts (§5.9) and the sales report (§5.10). All calls
 * go through fetchWithAdminAuth; `{"error"}` bodies surface as the message.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../../config/api';
import { fetchWithAdminAuth } from '../../utils/authHelpers';
import { toApiError } from '../api/apiError';
import {
  MarkPaidRequest,
  MarkPaidResponse,
  PayoutFilters,
  PayoutReport,
  SalesFilters,
  SalesReport,
} from '../types/orders';
import {
  dateRangeError,
  payoutQueryString,
  salesQueryString,
} from '../utils/adminReports';

export const ADMIN_PAYOUTS_KEY = ['admin', 'payouts'] as const;
export const ADMIN_SALES_KEY = ['admin', 'sales'] as const;

const getJson = async <T>(url: string, fallbackError: string): Promise<T> => {
  const response = await fetchWithAdminAuth(url, { method: 'GET' });
  if (!response.ok) {
    throw await toApiError(response, fallbackError);
  }
  return response.json();
};

export const usePayoutReport = (filters: PayoutFilters) =>
  useQuery<PayoutReport, Error>({
    queryKey: [...ADMIN_PAYOUTS_KEY, filters],
    queryFn: () =>
      getJson<PayoutReport>(
        `${ENDPOINTS.ADMIN_PAYOUTS}${payoutQueryString(filters)}`,
        'Failed to load payouts'
      ),
    enabled: !dateRangeError(filters.from, filters.to),
    staleTime: 30000,
    retry: false,
  });

export const useMarkPayoutsPaid = () => {
  const queryClient = useQueryClient();
  return useMutation<MarkPaidResponse, Error, MarkPaidRequest>({
    mutationFn: async (request) => {
      const response = await fetchWithAdminAuth(
        ENDPOINTS.ADMIN_PAYOUTS_MARK_PAID,
        { method: 'POST', body: JSON.stringify(request) }
      );
      if (!response.ok) {
        throw await toApiError(response, 'Failed to mark payouts paid');
      }
      return response.json();
    },
    // Idempotent on the server, but don't retry a money write automatically.
    retry: false,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PAYOUTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['currentOrders'] });
    },
  });
};

export const useSalesReport = (filters: SalesFilters) =>
  useQuery<SalesReport, Error>({
    queryKey: [...ADMIN_SALES_KEY, filters],
    queryFn: () =>
      getJson<SalesReport>(
        `${ENDPOINTS.REPORTING_SALES}${salesQueryString(filters)}`,
        'Failed to load the sales report'
      ),
    enabled: !dateRangeError(filters.from, filters.to),
    staleTime: 30000,
    retry: false,
  });
