import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../config/api';

const AUTH_TOKEN_KEY = 'admin_auth_token';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
}

const loginToBackend = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
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
      return {
        isAuthenticated: true,
        username: data.username,
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
  };
};

export const isAuthenticated = (): boolean => {
  return getAuthState().isAuthenticated;
};
