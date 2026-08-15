import { AddressBookState, SavedAddress } from '../types/address';

const ADDRESS_STORAGE_KEY = 'bob_saved_addresses';
const CONFIRM_SHOWN_KEY = 'bob_address_confirm_shown';

const emptyState = (): AddressBookState => ({
  addresses: [],
  selectedAddressId: null,
});

export const getAddressBookFromLocalStorage = (): AddressBookState => {
  try {
    const saved = localStorage.getItem(ADDRESS_STORAGE_KEY);

    if (!saved) {
      return emptyState();
    }

    const parsed = JSON.parse(saved) as AddressBookState;

    if (!Array.isArray(parsed.addresses)) {
      return emptyState();
    }

    return {
      addresses: parsed.addresses,
      selectedAddressId: parsed.selectedAddressId ?? null,
    };
  } catch (error) {
    console.error('Failed to read saved addresses:', error);
    return emptyState();
  }
};

export const saveAddressBookToLocalStorage = (
  state: AddressBookState
): void => {
  try {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save addresses:', error);
  }
};

export const getSelectedAddress = (
  state: AddressBookState = getAddressBookFromLocalStorage()
): SavedAddress | null => {
  if (!state.selectedAddressId) {
    return null;
  }

  return (
    state.addresses.find((address) => address.id === state.selectedAddressId) ??
    null
  );
};

export const hasShownAddressConfirmThisSession = (): boolean => {
  try {
    return sessionStorage.getItem(CONFIRM_SHOWN_KEY) === '1';
  } catch {
    return false;
  }
};

export const markAddressConfirmShownThisSession = (): void => {
  try {
    sessionStorage.setItem(CONFIRM_SHOWN_KEY, '1');
  } catch {
    // ignore
  }
};

export const createAddressId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};
