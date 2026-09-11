import { Customer, CustomerAuthResponseDTO } from '../types/customerAuth';

const CUSTOMER_AUTH_KEY = 'customer_auth';

export interface CustomerAuthState {
  isAuthenticated: boolean;
  token: string | null;
  customer: Customer | null;
}

export const saveCustomerAuth = (data: CustomerAuthResponseDTO): void => {
  localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(data));
};

export const clearCustomerAuth = (): void => {
  localStorage.removeItem(CUSTOMER_AUTH_KEY);
};

export const getCustomerAuthState = (): CustomerAuthState => {
  const stored = localStorage.getItem(CUSTOMER_AUTH_KEY);

  if (!stored) {
    return {
      isAuthenticated: false,
      token: null,
      customer: null,
    };
  }

  try {
    const data = JSON.parse(stored) as CustomerAuthResponseDTO;

    if (!data.token || !data.customer) {
      clearCustomerAuth();
      return {
        isAuthenticated: false,
        token: null,
        customer: null,
      };
    }

    return {
      isAuthenticated: true,
      token: data.token,
      customer: data.customer,
    };
  } catch {
    clearCustomerAuth();
    return {
      isAuthenticated: false,
      token: null,
      customer: null,
    };
  }
};

export const getCustomerAuthToken = (): string | null =>
  getCustomerAuthState().token;

export const isCustomerAuthenticated = (): boolean =>
  getCustomerAuthState().isAuthenticated;

export const logoutCustomer = (): void => {
  clearCustomerAuth();
};
