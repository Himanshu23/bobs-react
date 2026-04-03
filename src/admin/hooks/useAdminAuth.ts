import { validateAdminCredentials } from '../api/adminApi';

// Store admin session in session storage
const ADMIN_SESSION_KEY = 'admin_session';

export interface AdminSession {
  isAuthenticated: boolean;
  loginTime?: number;
}

export const useAdminAuth = () => {
  const getSession = (): AdminSession => {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return session ? JSON.parse(session) : { isAuthenticated: false };
  };

  const login = (id: string, password: string): boolean => {
    if (validateAdminCredentials(id, password)) {
      const session: AdminSession = {
        isAuthenticated: true,
        loginTime: Date.now(),
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const isAuthenticated = (): boolean => {
    return getSession().isAuthenticated;
  };

  return { login, logout, isAuthenticated, getSession };
};
