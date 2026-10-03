/**
 * Authentication and HTTP header helpers
 * Common utilities for managing auth tokens and request headers
 */

import { logout } from '../admin/auth';
import { getCustomerAuthToken } from '../customer/auth';

/**
 * Get admin auth token from localStorage
 */
export const getAuthToken = (): string | null => {
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
 * Prefer customer token for storefront calls; fall back to admin token.
 */
export const getRequestAuthToken = (): string | null => {
  return getCustomerAuthToken() || getAuthToken();
};

/**
 * Get headers with auth token for API requests
 */
export const getHeaders = (): Record<string, string> => {
  const token = getRequestAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Headers for ADMIN-only endpoints. Uses only the admin token, never the
 * customer token, so an admin browser that also holds a customer session
 * still authenticates as admin.
 */
export const getAdminHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const redirectToLogin = (): void => {
  logout();
  if (typeof window !== 'undefined') {
    window.location.replace('/bobs/admin/login');
  }
};

const buildAdminHeaders = (
  initHeaders?: Record<string, string> | Headers
): Record<string, string> => {
  const headers = { ...getAdminHeaders() };

  if (initHeaders instanceof Headers) {
    initHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (initHeaders) {
    Object.entries(initHeaders).forEach(([key, value]) => {
      headers[key] = value;
    });
  }

  return headers;
};

/**
 * fetch() for ADMIN-only endpoints. Sends the admin token only. When the
 * admin token is missing, or the backend rejects it (401/403), the admin
 * session is cleared and the browser goes to the admin login page.
 */
export const fetchWithAdminAuth = async (
  input: string,
  init: { [key: string]: unknown } = {}
): Promise<Response> => {
  if (!getAuthToken()) {
    redirectToLogin();
    throw new Error('Admin session missing. Please log in again.');
  }

  const response = await fetch(input, {
    ...init,
    headers: buildAdminHeaders(
      init.headers as Record<string, string> | Headers | undefined
    ),
  });

  if (response.status === 401 || response.status === 403) {
    redirectToLogin();
  }

  return response;
};
