import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { formatAddressForDelivery, SavedAddress } from '../types/address';
import {
  createAddressId,
  getAddressBookFromLocalStorage,
  getSelectedAddress,
  saveAddressBookToLocalStorage,
} from '../utils/addressStorage';
import {
  getCheckoutFormFromLocalStorage,
  saveCheckoutFormToLocalStorage,
} from '../utils/checkoutStorage';

interface AddressContextValue {
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
  selectedAddressId: string | null;
  selectAddress: (id: string) => void;
  saveAddress: (
    input: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
    }
  ) => SavedAddress;
  deleteAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextValue | null>(null);

function syncCheckoutCustomAddress(address: SavedAddress | null) {
  const existing = getCheckoutFormFromLocalStorage();
  const base = existing ?? {
    deliveryMethod: 'delivery' as const,
    habitat: '',
    tower: '',
    flatNumber: '',
    customAddress: '',
    customerName: '',
  };

  saveCheckoutFormToLocalStorage({
    ...base,
    customAddress: address
      ? formatAddressForDelivery(address)
      : base.customAddress,
  });
}

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [book, setBook] = useState(() => getAddressBookFromLocalStorage());

  const persist = useCallback((next: typeof book) => {
    setBook(next);
    saveAddressBookToLocalStorage(next);
    syncCheckoutCustomAddress(getSelectedAddress(next));
  }, []);

  const selectAddress = useCallback(
    (id: string) => {
      const exists = book.addresses.some((address) => address.id === id);
      if (!exists) {
        return;
      }

      persist({
        ...book,
        selectedAddressId: id,
      });
    },
    [book, persist]
  );

  const saveAddress = useCallback(
    (
      input: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'> & {
        id?: string;
      }
    ): SavedAddress => {
      const now = Date.now();
      const existing = input.id
        ? book.addresses.find((address) => address.id === input.id)
        : undefined;

      const saved: SavedAddress = {
        id: existing?.id ?? createAddressId(),
        label: input.label,
        formattedAddress: input.formattedAddress,
        line1: input.line1,
        landmark: input.landmark,
        lat: input.lat,
        lng: input.lng,
        placeId: input.placeId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      const addresses = existing
        ? book.addresses.map((address) =>
            address.id === saved.id ? saved : address
          )
        : [...book.addresses, saved];

      persist({
        addresses,
        selectedAddressId: saved.id,
      });

      return saved;
    },
    [book, persist]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      const addresses = book.addresses.filter((address) => address.id !== id);
      const selectedAddressId =
        book.selectedAddressId === id
          ? (addresses[0]?.id ?? null)
          : book.selectedAddressId;

      persist({ addresses, selectedAddressId });
    },
    [book, persist]
  );

  const value = useMemo<AddressContextValue>(
    () => ({
      addresses: book.addresses,
      selectedAddressId: book.selectedAddressId,
      selectedAddress: getSelectedAddress(book),
      selectAddress,
      saveAddress,
      deleteAddress,
    }),
    [book, selectAddress, saveAddress, deleteAddress]
  );

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};

export const useAddressBook = (): AddressContextValue => {
  const context = useContext(AddressContext);

  if (!context) {
    throw new Error('useAddressBook must be used within AddressProvider');
  }

  return context;
};
