import { useMutation } from '@tanstack/react-query';
import { ENDPOINTS } from '../../config/api';
import { saveCustomerAuth } from '../../customer/auth';
import {
  CustomerAuthResponseDTO,
  SendOTPRequestDTO,
  SendOTPResponseDTO,
  VerifyOTPRequestDTO,
} from '../../types/customerAuth';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string;
      error?: string;
    };
    return body.message || body.error || response.statusText;
  } catch {
    return response.statusText || 'Request failed';
  }
}

const sendOtp = async (
  payload: SendOTPRequestDTO
): Promise<SendOTPResponseDTO> => {
  const response = await fetch(ENDPOINTS.CUSTOMER_SEND_OTP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as SendOTPResponseDTO;
};

const verifyOtp = async (
  payload: VerifyOTPRequestDTO
): Promise<CustomerAuthResponseDTO> => {
  const response = await fetch(ENDPOINTS.CUSTOMER_VERIFY_OTP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as CustomerAuthResponseDTO;
};

export const useSendOtp = () => {
  return useMutation<SendOTPResponseDTO, Error, SendOTPRequestDTO>({
    mutationFn: sendOtp,
    onError: (error) => {
      console.error('Send OTP failed:', error.message);
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation<CustomerAuthResponseDTO, Error, VerifyOTPRequestDTO>({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      saveCustomerAuth(data);
    },
    onError: (error) => {
      console.error('Verify OTP failed:', error.message);
    },
  });
};
