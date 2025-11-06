import { getSetting } from './settings';
import { ROAR_BASE_URL, ROAR_FAKE } from './env';
import { log } from './logger';

export interface RoarAuthResult {
  ok: boolean;
  message?: string;
  token?: string;
}

export interface RoarUpsertResult {
  targetId: string;
}

export async function getCredentials() {
  const [username, secret] = await Promise.all([
    getSetting('ROAR_USERNAME'),
    getSetting('ROAR_SECRET'),
  ]);
  return { username, secret };
}

export async function auth(): Promise<RoarAuthResult> {
  const creds = await getCredentials();
  if (!creds.username || !creds.secret) {
    return { ok: false, message: 'Missing credentials' };
  }
  if (ROAR_FAKE) {
    return { ok: true, message: 'Fake mode: credentials present' };
  }
  if (!ROAR_BASE_URL) {
    return { ok: false, message: 'ROAR_BASE_URL not set' };
  }
  try {
    const response = await fetch(`${ROAR_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: creds.username,
        password: creds.secret,
      }),
    });
    if (!response.ok) {
      return { ok: false, message: `Auth failed with status ${response.status}` };
    }
    const result = await response.json();
    return { ok: true, token: result.data.token };
  } catch (error) {
    log({ module: 'roar', action: 'auth', ok: false, err: error });
    return { ok: false, message: 'Auth request failed' };
  }
}

export async function upsertSalesOrder(payload: unknown): Promise<RoarUpsertResult> {
  const creds = await getCredentials();

  if (!creds.username || !creds.secret) {
    throw new Error('Missing ROar credentials');
  }
  if (ROAR_FAKE) {
    return { targetId: `fake-${Date.now()}` };
  }
  if (!ROAR_BASE_URL) {
    throw new Error('ROAR_BASE_URL not set');
  }
  const login = await auth();
  try {
    const response = await fetch(`${ROAR_BASE_URL}/create-sales-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        clientid: creds.username,
        clientsecret: creds.secret,
        Authorization: `Bearer ${login.token}`,
      },
      body: JSON.stringify(payload),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await response.json()) as { success: boolean; message: string; data: any };

    if (!result.success) {
      throw new Error(result.message);
    }

    return {
      targetId: result.data._id,
    };
  } catch (error) {
    log({ module: 'roar', action: 'upsertSalesOrder', ok: false, err: error });
    throw new Error(
      error instanceof Error ? `upsertSalesOrder: ${error.message}` : 'Unknown error'
    );
  }
}
