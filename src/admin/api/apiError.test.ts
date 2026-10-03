import { describe, expect, it } from 'vitest';
import { ApiError, isConflictError, toApiError } from './apiError';

describe('toApiError', () => {
  it('uses the {"error"} message from a 400/404 body', async () => {
    const response = new Response(
      JSON.stringify({ error: "Market 'x' not found" }),
      { status: 404, statusText: 'Not Found' }
    );
    const error = await toApiError(response, 'Failed to save market');
    expect(error.message).toBe("Market 'x' not found");
  });

  it('falls back on an empty body (Spring default 400)', async () => {
    const response = new Response(null, {
      status: 400,
      statusText: 'Bad Request',
    });
    const error = await toApiError(response, 'Failed to update food item');
    expect(error.message).toBe('Failed to update food item (Bad Request)');
  });

  it('falls back on a non-JSON body and uses the status without statusText', async () => {
    const response = new Response('<html>oops</html>', { status: 500 });
    const error = await toApiError(response, 'Failed to load markets');
    expect(error.message).toBe('Failed to load markets (500)');
  });

  it('falls back when JSON has no usable error field', async () => {
    const response = new Response(JSON.stringify({ error: '  ' }), {
      status: 400,
      statusText: 'Bad Request',
    });
    const error = await toApiError(response, 'Failed');
    expect(error.message).toBe('Failed (Bad Request)');
  });

  it('keeps the status so a 409 conflict can be detected', async () => {
    const response = new Response(
      JSON.stringify({ error: 'Order was changed by someone else' }),
      { status: 409, statusText: 'Conflict' }
    );
    const error = await toApiError(response, 'Failed');
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe('Order was changed by someone else');
    expect(isConflictError(error)).toBe(true);
    expect(isConflictError(new Error('x'))).toBe(false);
    expect(isConflictError(new ApiError('x', 400))).toBe(false);
  });
});
