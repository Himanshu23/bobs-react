// API Configuration
const DEFAULT_LOCAL_API_BASE = 'http://localhost:8080/api';
const DEFAULT_PROD_API_BASE =
  'https://bobsbackend-cndzehbydyf2gyb4.centralindia-01.azurewebsites.net/api';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.MODE === 'development'
    ? DEFAULT_LOCAL_API_BASE
    : DEFAULT_PROD_API_BASE);

export const API_BASE_SOCKET_URL =
  import.meta.env.VITE_API_BASE_SOCKET_URL ?? 'http://localhost:8080';

// API Endpoints
export const ENDPOINTS = {
  FOOD_ITEMS: `${API_BASE_URL}/food-items`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  CREATE_ORDER: `${API_BASE_URL}/orders`,
  SEND_VOICE: `${API_BASE_URL}/voice`,
} as const;
