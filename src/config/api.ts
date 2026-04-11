// API Configuration
//export const API_BASE_URL = 'http://localhost:8080/api';
export const API_BASE_URL =
  'https://bobsbackend-cndzehbydyf2gyb4.centralindia-01.azurewebsites.net/api';

export const API_BASE_SOCKET_URL =
  'https://bobsbackend-cndzehbydyf2gyb4.centralindia-01.azurewebsites.net';

// API Endpoints
export const ENDPOINTS = {
  FOOD_ITEMS: `${API_BASE_URL}/food-items`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  CREATE_ORDER: `${API_BASE_URL}/orders`,
} as const;
