import { ApiErrorBody } from '../../types/marketplace';

/**
 * GET a public marketplace endpoint. 400/404 responses carry
 * `{ "error": "..." }` (PLAN §5); surface that message when present.
 */
export const fetchPublicJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const body: ApiErrorBody = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Empty or non-JSON body: keep the status message.
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as T;
};
