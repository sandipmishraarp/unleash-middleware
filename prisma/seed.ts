import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error("ENCRYPTION_KEY must be provided to run the seed script");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

async function main() {
  const placeholders = ["UNLEASHED_API_ID", "UNLEASHED_API_KEY"];
  const encryptedEmpty = encrypt("");

  for (const key of placeholders) {
    await prisma.secret.upsert({
      where: { key },
      update: { value: encryptedEmpty },
      create: { key, value: encryptedEmpty },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
