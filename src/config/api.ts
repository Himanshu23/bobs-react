// API Configuration
//export const API_BASE_URL = 'http://localhost:8080/api';
export const API_BASE_URL =
  'https://bobsbackend-cndzehbydyf2gyb4.centralindia-01.azurewebsites.net/api';

// API Endpoints
export const ENDPOINTS = {
  FOOD_ITEMS: `${API_BASE_URL}/food-items`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
} as const;
