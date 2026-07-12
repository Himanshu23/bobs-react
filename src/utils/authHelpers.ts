/**
 * Authentication and HTTP header helpers
 * Common utilities for managing auth tokens and request headers
 */

import { logout } from '../admin/auth';

/**
 * Get auth token from localStorage
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
 * Get headers with auth token for API requests
 */
export const getHeaders = (): Record<string, string> => {
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

const buildHeaders = (
  initHeaders?: Record<string, string> | Headers
): Record<string, string> => {
  const headers = { ...getHeaders() };

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

export const fetchWithAuth = async (
  input: string,
  init: { [key: string]: unknown } = {}
): Promise<Response> => {
  const response = await fetch(input, {
    ...init,
    headers: buildHeaders(
      init.headers as Record<string, string> | Headers | undefined
    ),
  });

  if (response.status === 403) {
    redirectToLogin();
  }

  return response;
};
