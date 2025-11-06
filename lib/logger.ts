interface LogPayload {
  module: string;
  action: string;
  ok: boolean;
  code?: string | number;
  err?: unknown;
  [key: string]: unknown;
}

export function log(payload: LogPayload) {
  const entry = {
    level: payload.ok ? 'info' : 'error',
    timestamp: new Date().toISOString(),
    ...payload,
  };
  console.log(JSON.stringify(entry));
}
