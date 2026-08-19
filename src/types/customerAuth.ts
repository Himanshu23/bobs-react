import { AddressLabel } from './address';

/** Mirrors backend Address entity used in OTP verify. */
export interface AddressDTO {
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

export interface SendOTPRequestDTO {
  phoneNumber: string;
}

export interface SendOTPResponseDTO {
  sessionId: string;
}

export interface VerifyOTPRequestDTO {
  phoneNumber: string;
  sessionId: string;
  otp: string;
  address: AddressDTO;
}

export interface Customer {
  id: string;
  phoneNumber: string;
  name?: string | null;
}

/** Backend: CustomeAuthResponseDTO */
export interface CustomerAuthResponseDTO {
  token: string;
  customer: Customer;
}
