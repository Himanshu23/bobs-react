import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../config/api';
import { decodeJwtClaims, isJwtExpired } from '../utils/jwt';

const AUTH_TOKEN_KEY = 'admin_auth_token';

export interface LoginCredentials {
  username: string;
  password: string;
}

/** Login response. Only `token` is sent; username and role come from its claims. */
export interface AuthResponse {
  token: string;
  username?: string;
  role?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  role: string | null;
  token: string | null;
}

const loginToBackend = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await fetch(ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Invalid username or password');
    }

    const data: AuthResponse = await response.json();
    return data;
  } catch (error) {
    console.log({ error });
  }
  return Promise.reject(new Error('Login failed. Please try again.'));
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: (credentials) => loginToBackend(credentials),
    onSuccess: (data) => {
      // Store token and username in localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(data));
      // Invalidate any cached queries
      queryClient.clear();
      console.log('Login successful:', data.username);
    },
    onError: (error) => {
      console.error('Login failed:', error.message);
    },
  });
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getAuthState = (): AuthState => {
  const stored = localStorage.getItem(AUTH_TOKEN_KEY);
  if (stored) {
    try {
      const data: AuthResponse = JSON.parse(stored);
      // The role is a claim in the token (e.g. "admin"); the server reads the
      // same claim, so normalise it the way the server does (ROLE_ADMIN).
      const claims = decodeJwtClaims(data.token);
      return {
        isAuthenticated: true,
        username: claims?.sub ?? data.username ?? null,
        role: claims?.role ? claims.role.toUpperCase() : null,
        token: data.token,
      };
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
  return {
    isAuthenticated: false,
    username: null,
    token: null,
    role: null,
  };
};

export const isAuthenticated = (): boolean => {
  return getAuthState().isAuthenticated;
};

export const getRole = (): string | null => {
  return getAuthState().role;
};

/** Logged in with an unexpired token whose role claim is admin. */
export const isAuthenticatedAndAdmin = (): boolean => {
  const state = getAuthState();
  return (
    state.isAuthenticated &&
    state.role === 'ADMIN' &&
    !isJwtExpired(decodeJwtClaims(state.token))
  );
};
