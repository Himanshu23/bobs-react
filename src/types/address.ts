export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface SavedAddress {
  id: string;
  label: AddressLabel;
  formattedAddress: string;
  line1: string;
  landmark: string;
  lat: number;
  lng: number;
  placeId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AddressBookState {
  addresses: SavedAddress[];
  selectedAddressId: string | null;
}

export function formatAddressForDelivery(address: SavedAddress): string {
  const parts = [
    address.line1.trim(),
    address.landmark.trim() ? `Landmark: ${address.landmark.trim()}` : '',
    address.formattedAddress.trim(),
  ].filter(Boolean);

  return parts.join(', ');
}
