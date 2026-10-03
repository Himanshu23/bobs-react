/** An Error from a failed API response, with its HTTP status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** True for a 409: the record changed concurrently (optimistic check, §5). */
export const isConflictError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 409;

/**
 * Builds an Error from a failed admin response. Marketplace endpoints (and the
 * food-item restaurantId check) return `{"error": "..."}` on 400/404/409 (§5);
 * other failures have an empty or non-JSON body, so fall back to a generic
 * message. The result is an {@link ApiError} carrying the HTTP status.
 */
export const toApiError = async (
  response: Response,
  fallback: string
): Promise<ApiError> => {
  try {
    const text = await response.text();
    if (text) {
      const body = JSON.parse(text) as { error?: unknown };
      if (typeof body?.error === 'string' && body.error.trim()) {
        return new ApiError(body.error, response.status);
      }
    }
  } catch {
    // Not JSON: use the fallback below.
  }
  const status = response.statusText || String(response.status);
  return new ApiError(`${fallback} (${status})`, response.status);
};
