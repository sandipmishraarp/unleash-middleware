
import '@testing-library/jest-dom';
import 'whatwg-fetch';

if (typeof globalThis.Request === 'undefined' && typeof window !== 'undefined') {
  globalThis.Request = window.Request;
}

if (typeof globalThis.Response === 'undefined' && typeof window !== 'undefined') {
  globalThis.Response = window.Response;
}

if (typeof globalThis.Headers === 'undefined' && typeof window !== 'undefined') {
  globalThis.Headers = window.Headers;
}

if (typeof globalThis.Response !== 'undefined') {
  const responseAny = globalThis.Response as unknown as {
    json?: (data: unknown, init?: ResponseInit) => Response;
  };
  if (typeof responseAny.json !== 'function') {
    responseAny.json = (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
        ...init,
      });
  }
}

