/**
 * Authentication and HTTP header helpers
 * Common utilities for managing auth tokens and request headers
 */

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
