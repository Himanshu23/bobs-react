import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../../config/api';
import { getAuthState } from '../../admin/auth';
import {
  PromotionalAddonConfigDTO,
  SavePromotionalAddonConfigDTO,
} from '../../types/promotionalAddons';

const PROMOTIONAL_ADDON_CONFIG_KEY = ['promotionalAddons', 'config'];

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const { token } = getAuthState();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const fetchPromotionalAddonConfig =
  async (): Promise<PromotionalAddonConfigDTO> => {
    const response = await fetch(ENDPOINTS.PROMOTIONAL_ADDONS_CONFIG, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch promotional config: ${response.statusText}`
      );
    }
    return response.json();
  };

const savePromotionalAddonConfig = async (
  config: SavePromotionalAddonConfigDTO
): Promise<PromotionalAddonConfigDTO> => {
  const response = await fetch(ENDPOINTS.PROMOTIONAL_ADDONS_CONFIG, {
    method: config.id ? 'PUT' : 'POST',
    headers: getHeaders(),
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to save promotional config: ${response.statusText}`
    );
  }
  return response.json();
};

export const usePromotionalAddonConfig = () =>
  useQuery<PromotionalAddonConfigDTO, Error>({
    queryKey: PROMOTIONAL_ADDON_CONFIG_KEY,
    queryFn: fetchPromotionalAddonConfig,
    staleTime: 1000 * 60 * 5,
  });

export const useSavePromotionalAddonConfig = () => {
  const queryClient = useQueryClient();
  return useMutation<
    PromotionalAddonConfigDTO,
    Error,
    SavePromotionalAddonConfigDTO
  >({
    mutationFn: savePromotionalAddonConfig,
    onSuccess: (config) => {
      queryClient.setQueryData(PROMOTIONAL_ADDON_CONFIG_KEY, config);
    },
  });
};
