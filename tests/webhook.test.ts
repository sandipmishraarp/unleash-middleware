import crypto from 'crypto';

const mockSet = jest.fn();
const mockRpush = jest.fn();

jest.mock('@vercel/kv', () => ({
  kv: {
    set: (...args: unknown[]) => mockSet(...args),
    rpush: (...args: unknown[]) => mockRpush(...args),
  },
}));

describe('Unleashed webhook route', () => {
  beforeEach(() => {
    jest.resetModules();
    mockSet.mockReset().mockResolvedValue(true);
    mockRpush.mockReset().mockResolvedValue(undefined);
  });

  async function loadRoute() {
    return import('@/app/api/webhooks/unleashed/route');
  }

  it('rejects invalid signatures when secret configured', async () => {
    process.env.UNLEASHED_WEBHOOK_SECRET = 'test-secret';
    process.env.KV_REST_API_URL = 'http://localhost';
    process.env.KV_REST_API_TOKEN = 'token';
    const body = JSON.stringify({
      EventType: 'SalesOrderCreated',
      ResourceType: 'SalesOrder',
      SalesOrderGuid: 'abc',
    });
    const { POST } = await loadRoute();
    const request = new Request('http://localhost/api/webhooks/unleashed', {
      method: 'POST',
      body,
      headers: {
        'x-unleashed-signature': crypto
          .createHmac('sha256', 'other-secret')
          .update(body)
          .digest('hex'),
      },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockRpush).not.toHaveBeenCalled();
  });

  it('enqueues payload on valid signature', async () => {
    process.env.UNLEASHED_WEBHOOK_SECRET = 'test-secret';
    process.env.KV_REST_API_URL = 'http://localhost';
    process.env.KV_REST_API_TOKEN = 'token';
    const body = JSON.stringify({
      EventType: 'SalesOrderCreated',
      ResourceType: 'SalesOrder',
      SalesOrderGuid: 'abc',
    });
    const signature = crypto.createHmac('sha256', 'test-secret').update(body).digest('hex');
    const { POST } = await loadRoute();
    const response = await POST(
      new Request('http://localhost/api/webhooks/unleashed', {
        method: 'POST',
        body,
        headers: {
          'x-unleashed-signature': signature,
        },
      })
    );
    expect(response.status).toBe(202);
    expect(mockRpush).toHaveBeenCalledTimes(1);
  });
});
