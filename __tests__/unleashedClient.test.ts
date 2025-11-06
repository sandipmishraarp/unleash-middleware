import UnleashedClient from '@/server/utils/unleashedClient';

const crypto = require('node:crypto');

interface MockResponseInit {
  status?: number;
  headers?: Record<string, string>;
}

function createMockResponse(body: any, init: MockResponseInit = {}) {
  const status = init.status ?? 200;
  const headers = new Map<string, string>();
  if (init.headers) {
    for (const [key, value] of Object.entries(init.headers)) {
      headers.set(key.toLowerCase(), value);
    }
  }

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) ?? null,
    },
    async json() {
      return typeof body === 'string' ? JSON.parse(body) : body;
    },
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
  } as Response;
}

describe('UnleashedClient', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds canonical signature with ordered query parameters', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        createMockResponse({}, { status: 200, headers: { 'x-ratelimit-remaining': '10' } }),
      );

    const client = new UnleashedClient({
      baseUrl: 'https://api.example.com',
      apiId: 'test-id',
      apiKey: 'secret',
      fetchImpl: fetchMock,
    });

    await client.getPage('/Products', 1, { b: '2', a: '1' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    const signature = headers.get('api-auth-signature');
    const expectedUrl = new URL('https://api.example.com/Products?a=1&b=2&page=1');
    const expectedCanonical = `${expectedUrl.pathname}${expectedUrl.search}`.toLowerCase();
    const expectedSignature = crypto
      .createHmac('sha256', 'secret')
      .update(expectedCanonical)
      .digest('base64');

    expect(signature).toEqual(expectedSignature);
  });

  it('fetches all pages sequentially while respecting rate limiting headers', async () => {
    jest.useFakeTimers();
    const firstResponse = createMockResponse(
      {
        Items: [1],
        Pagination: { NumberOfPages: 2, PageNumber: 1, PageSize: 200, TotalItems: 2 },
      },
      {
        status: 200,
        headers: {
          'x-ratelimit-remaining': '0',
          'retry-after': '0',
        },
      },
    );
    const secondResponse = createMockResponse(
      {
        Items: [2],
        Pagination: { NumberOfPages: 2, PageNumber: 2, PageSize: 200, TotalItems: 2 },
      },
      {
        status: 200,
        headers: { 'x-ratelimit-remaining': '5' },
      },
    );

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    const client = new UnleashedClient({
      baseUrl: 'https://api.example.com',
      apiId: 'test-id',
      apiKey: 'secret',
      fetchImpl: fetchMock,
      initialBackoffMs: 10,
    });

    const promise = client.getAllPages<number>('/Products');
    await Promise.resolve();
    jest.advanceTimersByTime(10);
    const items = await promise;

    expect(items).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('page')).toBe('1');
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('page')).toBe('2');
  });

  it('retries on rate limit errors with exponential backoff', async () => {
    jest.useFakeTimers();
    const rateLimited = createMockResponse('Rate limit', {
      status: 429,
      headers: { 'retry-after': '0' },
    });
    const success = createMockResponse(
      { Items: [], Pagination: { NumberOfPages: 1 } },
      {
        status: 200,
        headers: { 'x-ratelimit-remaining': '5' },
      },
    );

    const fetchMock = jest.fn().mockResolvedValueOnce(rateLimited).mockResolvedValueOnce(success);

    const client = new UnleashedClient({
      baseUrl: 'https://api.example.com',
      apiId: 'test-id',
      apiKey: 'secret',
      fetchImpl: fetchMock,
      initialBackoffMs: 25,
    });

    const promise = client.getAllPages('/Products');
    await Promise.resolve();
    jest.advanceTimersByTime(25);
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
