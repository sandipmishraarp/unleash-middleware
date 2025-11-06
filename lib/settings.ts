import { decrypt, encrypt } from './crypto';
import prisma from './prisma';

export type SettingKey = 'ROAR_USERNAME' | 'ROAR_SECRET';

export async function getSetting(key: SettingKey): Promise<string | null> {
  const record = await prisma.secret.findUnique({ where: { key } });
  if (!record) {
    return null;
  }
  try {
    return decrypt(record.value);
  } catch (error) {
    console.error('Failed to decrypt setting', key, error);
    return null;
  }
}

export async function setSetting(key: SettingKey, value: string) {
  const encrypted = encrypt(value);
  await prisma.secret.upsert({
    where: { key },
    update: { value: encrypted },
    create: { key, value: encrypted },
  });
}

export async function listSecrets(): Promise<Array<{ key: SettingKey; hasValue: boolean }>> {
  const records = (await prisma.secret.findMany({
    where: { key: { in: ['ROAR_USERNAME', 'ROAR_SECRET'] } },
    select: { key: true },
  })) as Array<{ key: SettingKey }>;
  const keys: SettingKey[] = ['ROAR_USERNAME', 'ROAR_SECRET'];
  return keys.map((key) => ({
    key,
    hasValue: records.some((record) => record.key === key),
  }));
}
