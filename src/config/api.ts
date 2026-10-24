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
  MARKETS: `${API_BASE_URL}/markets`,
  RESTAURANTS: `${API_BASE_URL}/restaurants`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  CUSTOMER_SEND_OTP: `${API_BASE_URL}/auth/customer/send-otp`,
  CUSTOMER_VERIFY_OTP: `${API_BASE_URL}/auth/customer/verify-otp`,
  CREATE_ORDER: `${API_BASE_URL}/orders`,
  ADMIN_PAYOUTS: `${API_BASE_URL}/admin/payouts`,
  ADMIN_PAYOUTS_MARK_PAID: `${API_BASE_URL}/admin/payouts/mark-paid`,
  REPORTING_SALES: `${API_BASE_URL}/reporting/sales`,
  REPORTING_TAX: `${API_BASE_URL}/reporting/tax`,
  SEND_VOICE: `${API_BASE_URL}/voice`,
  CATEGORIES: `${API_BASE_URL}/expense-categories`,
  EXPENSES: `${API_BASE_URL}/expenses`,
  PROMOTIONAL_ADDONS: `${API_BASE_URL}/promotional-addons/available`,
  PROMOTIONAL_ADDONS_CONFIG: `${API_BASE_URL}/promotional-addons/config`,
  PROMOTIONAL_ADDONS_VALIDATE: `${API_BASE_URL}/promotional-addons/validate`,
} as const;

/** Public legal pages (static HTML on the website; absolute so they also open from the app). */
export const LEGAL_URLS = {
  privacy: 'https://www.grokheads.com/privacy',
  terms: 'https://www.grokheads.com/terms',
  dataDeletion: 'https://www.grokheads.com/data-deletion',
} as const;

/**
 * Customer login with a WhatsApp code before the first order. Off until the
 * WhatsApp `bobs_auth` template is approved and a permanent token is set on the
 * backend; set VITE_WHATSAPP_LOGIN_ENABLED=true (or change the default) to turn it on.
 */
export const WHATSAPP_LOGIN_ENABLED =
  import.meta.env.VITE_WHATSAPP_LOGIN_ENABLED === 'true';
