export interface CheckoutFormState {
  deliveryMethod: 'delivery' | 'pickup';
  habitat: string;
  tower: string;
  flatNumber: string;
  customAddress: string;
  customerName: string;
  customerInstructions: string;
  orderTiming: 'asap' | 'scheduled';
  scheduledTime: string;
}

const CHECKOUT_STORAGE_KEY = 'bob_checkout_form';

export const getCheckoutFormFromLocalStorage = (): CheckoutFormState | null => {
  try {
    const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved) as CheckoutFormState;
  } catch (error) {
    console.error('Failed to retrieve checkout form from localStorage:', error);
    return null;
  }
};

export const saveCheckoutFormToLocalStorage = (
  formState: CheckoutFormState
): void => {
  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(formState));
  } catch (error) {
    console.error('Failed to save checkout form to localStorage:', error);
  }
};
