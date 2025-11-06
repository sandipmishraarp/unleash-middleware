export const queueKey = 'queue:unleashed';

type KvLike = {
  rpush: (key: string, value: string) => Promise<number>;
  lpop: (key: string) => Promise<string | null>;
  llen: (key: string) => Promise<number>;
  set: (
    key: string,
    value: string,
    options: { nx?: boolean; ex?: number }
  ) => Promise<string | null>;
};

/**
 * Fallback in‑memory KV implementation used when Vercel KV isn’t configured.
 */
function createMemoryKv(): KvLike {
  const lists = new Map<string, string[]>();
  const singles = new Map<string, { value: string; expiresAt?: number }>();

  return {
    async rpush(key, value) {
      const list = lists.get(key) ?? [];
      list.push(value);
      lists.set(key, list);
      return list.length;
    },
    async lpop(key) {
      const list = lists.get(key) ?? [];
      const value = list.shift() ?? null;
      lists.set(key, list);
      return value;
    },
    async llen(key) {
      return (lists.get(key) ?? []).length;
    },
    async set(key, value, options) {
      const now = Date.now();
      const existing = singles.get(key);
      if (
        options?.nx &&
        existing &&
        (!existing.expiresAt || existing.expiresAt > now)
      ) {
        return null;
      }
      const expiresAt = options?.ex ? now + options.ex * 1000 : undefined;
      singles.set(key, { value, expiresAt });
      return 'OK';
    },
  };
}

const missingKvEnv =
  !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN;
const memoryKv = createMemoryKv();

/**
 * Returns a KV instance. When KV environment variables are present,
 * it dynamically imports Vercel’s KV client; otherwise, it falls back
 * to the in‑memory mock.
 */
export async function getKv(): Promise<KvLike> {
  if (missingKvEnv) {
    console.warn('[kv] KV env missing – using in‑memory KV mock');
    return memoryKv;
  }
  // Dynamically import Vercel KV so build succeeds without @vercel/kv installed
  const { kv: vercelKv } = await import('@vercel/kv');
  return vercelKv as unknown as KvLike;
}
