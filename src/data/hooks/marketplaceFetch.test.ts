import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicJson } from './marketplaceFetch';

const stubFetch = (response: {
  ok: boolean;
  status: number;
  statusText?: string;
  json: () => Promise<unknown>;
}) => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

type StatusError = Error & { status?: number };

const captureError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected the request to fail');
    },
    (error: StatusError) => error
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPublicJson', () => {
  it('returns the parsed JSON on success', async () => {
    const fetchMock = stubFetch({
      ok: true,
      status: 200,
      json: async () => [{ id: 'bobs' }],
    });
    await expect(
      fetchPublicJson('https://api.test/restaurants')
    ).resolves.toEqual([{ id: 'bobs' }]);
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/restaurants', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('uses the {error} body message and keeps the status', async () => {
    stubFetch({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: "Restaurant 'x' not found" }),
    });
    const error = await captureError(fetchPublicJson('u'));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Restaurant 'x' not found");
    expect(error.status).toBe(404);
  });

  it('falls back to the status text for an empty or non-JSON body', async () => {
    stubFetch({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input');
      },
    });
    const error = await captureError(fetchPublicJson('u'));
    expect(error.message).toBe('Request failed: 500 Server Error');
    expect(error.status).toBe(500);
  });

  it('falls back when the JSON body has no error field', async () => {
    stubFetch({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'nope' }),
    });
    const error = await captureError(fetchPublicJson('u'));
    expect(error.message).toBe('Request failed: 400 Bad Request');
  });

  it('propagates network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(fetchPublicJson('u')).rejects.toThrow('offline');
  });
});
