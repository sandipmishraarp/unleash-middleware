import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getKv, queueKey } from '@/lib/kv';
import { log } from '@/lib/logger';
import { UNLEASHED_WEBHOOK_SECRET } from '@/lib/env';

const payloadSchema = z.object({
  eventType: z.string(),
  data: z.any().optional(),
  occurredAt: z.string().optional(),
  resourceGuid: z.string().optional(),
});

function verifySignature(rawBody: string, signature?: string, timestamp?: string) {
  if (!UNLEASHED_WEBHOOK_SECRET) {
    log({
      module: 'webhook',
      action: 'unleashed:signature',
      ok: false,
      message: 'secret not configured',
    });
    return true;
  }
  if (!signature) {
    return false;
  }
  const signedPayload = `${timestamp}.${rawBody}`;

  const hmac = crypto
    .createHmac('sha256', UNLEASHED_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(hmac, 'base64'));
}

export async function POST(request: Request) {
  const rawBodyString = await request.text();
  const signature = request.headers.get('x-unleashed-signature');
  const timestamp = request.headers.get('x-unleashed-timestamp');

  if (!verifySignature(rawBodyString, signature ?? undefined, timestamp ?? undefined)) {
    log({ module: 'webhook', action: 'unleashed:verify', ok: false, code: 401 });
    return NextResponse.json({ error: 'signature mismatch' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawBody: any;
  try {
    rawBody = JSON.parse(rawBodyString);
  } catch (e) {
    log({ module: 'webhook', action: 'unleashed:json-parse', ok: false, err: e });
    return NextResponse.json({ error: 'invalid JSON format' }, { status: 400 });
  }

  const payload = payloadSchema.safeParse(rawBody);
  if (!payload.success) {
    log({ module: 'webhook', action: 'unleashed:validate', ok: false, err: payload.error });
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
  let data: {
    salesOrderGuid: string;
  };
  try {
    data = JSON.parse(payload.data.data) as {
      salesOrderGuid: string;
    };
  } catch (error) {
    log({ module: 'webhook', action: 'unleashed:json', ok: false, err: error });
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const kv = await getKv();
  const envelope = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    eventType: payload.data.eventType,
    resourceType: 'SalesOrder',
    resourceGuid: data.salesOrderGuid ?? 'unknown',
    occurredAt: payload.data.occurredAt,
    body: data,
    attempts: 0,
  };

  const dedupeKey = `dedupe:${envelope.resourceType}:${envelope.resourceGuid}:${envelope.eventType}:${
    envelope.occurredAt?.slice(0, 16) ?? 'unknown'
  }`;
  const deduped = await kv.set(dedupeKey, envelope.id, {
    nx: true,
    ex: 600,
  });
  if (!deduped) {
    log({ module: 'webhook', action: 'unleashed:dedupe', ok: true, message: 'duplicate dropped' });
    return NextResponse.json({ ok: true, deduped: true }, { status: 202 });
  }

  await kv.rpush(queueKey, JSON.stringify(envelope));
  log({ module: 'webhook', action: 'unleashed:enqueue', ok: true, envelopeId: envelope.id });
  return NextResponse.json({ ok: true, id: envelope.id }, { status: 202 });
}
