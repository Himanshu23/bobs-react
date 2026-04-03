import { useQueryClient } from '@tanstack/react-query';

// Query keys
const ADMIN_KEYS = {
  all: ['admin'] as const,
  dashboard: () => [...ADMIN_KEYS.all, 'dashboard'] as const,
};

// Queries
// export const useAdminDashboard = () => {
//   return useQuery<AdminDashboardData>({
//     queryKey: ADMIN_KEYS.dashboard(),
//     queryFn: getAdminDashboardData,
//   });
// };

// Mutations
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  //   return useMutation({
  //     mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
  //       updateAdminOrderStatus(orderId, status as any),
  //     onSuccess: (data) => {
  //       queryClient.setQueryData(ADMIN_KEYS.dashboard(), data);
  //     },
  //   });
  // };

  // export const useToggleMenuItemAvailability = () => {
  //   const queryClient = useQueryClient();

  //   return useMutation({
  //     mutationFn: (itemId: string) => toggleAdminMenuItemAvailability(itemId),
  //     onSuccess: (data) => {
  //       queryClient.setQueryData(ADMIN_KEYS.dashboard(), data);
  //     },
  //   });
  // };

  // export const useToggleDiscount = () => {
  //   const queryClient = useQueryClient();

  //   return useMutation({
  //     mutationFn: (discountId: string) => toggleAdminDiscount(discountId),
  //     onSuccess: (data) => {
  //       queryClient.setQueryData(ADMIN_KEYS.dashboard(), data);
  //     },
  //   });
  // };

  // export const useRefreshAdminData = () => {
  //   const queryClient = useQueryClient();

  //   return () => {
  //     queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.dashboard() });
  //   };
};
