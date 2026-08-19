import { AddressDTO } from '../types/customerAuth';
import { SavedAddress } from '../types/address';

export function toAddressDTO(address: SavedAddress): AddressDTO {
  return {
    id: address.id,
    label: address.label,
    formattedAddress: address.formattedAddress,
    line1: address.line1,
    landmark: address.landmark,
    lat: address.lat,
    lng: address.lng,
    placeId: address.placeId,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

/** India mobile: 10 digits starting with 6–9. */
export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
}

export function isValidIndianPhone(input: string): boolean {
  const phone = normalizeIndianPhone(input);
  return /^[6-9]\d{9}$/.test(phone);
}

/** E.164-style value sent to the backend. */
export function toApiPhoneNumber(input: string): string {
  return `+91${normalizeIndianPhone(input)}`;
}

export function formatIndianPhoneDisplay(input: string): string {
  const phone = normalizeIndianPhone(input);
  if (phone.length !== 10) {
    return input;
  }

  return `${phone.slice(0, 5)} ${phone.slice(5)}`;
}
