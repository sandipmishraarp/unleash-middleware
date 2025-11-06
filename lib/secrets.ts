import crypto from 'node:crypto';
import prisma from './db';

const ALGORITHM = 'aes-256-gcm';

const deriveKey = () => {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is not set');
  }

  if (rawKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }

  return crypto.createHash('sha256').update(rawKey).digest();
};

export const encrypt = (plainText: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
};

export const decrypt = (cipherText: string) => {
  const [ivString, encryptedString, authTagString] = cipherText.split(':');
  const iv = Buffer.from(ivString, 'base64');
  const encrypted = Buffer.from(encryptedString, 'base64');
  const authTag = Buffer.from(authTagString, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, deriveKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

export const saveSecret = async (key: string, value: string) => {
  const encryptedValue = encrypt(value);
  await prisma.secret.upsert({
    where: { key },
    update: { value: encryptedValue },
    create: { key, value: encryptedValue },
  });
};

export const getSecret = async (key: string) => {
  const secret = await prisma.secret.findUnique({ where: { key } });
  if (!secret) {
    return null;
  }

  try {
    return decrypt(secret.value);
  } catch (error) {
    console.error('Failed to decrypt secret', { key, error });
    return null;
  }
};

export const hasSecret = async (key: string) => {
  const secret = await prisma.secret.findUnique({ where: { key } });
  return Boolean(secret);
};
