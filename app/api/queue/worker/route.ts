import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchSalesOrder } from '@/lib/unleashedClient';
import { getKv, queueKey } from '@/lib/kv';
import { log } from '@/lib/logger';

interface QueueEnvelope {
  id: string;
  receivedAt: string;
  eventType: string;
  resourceType: string;
  resourceGuid: string;
  occurredAt?: string;
  body: unknown;
  attempts?: number;
}

const SUPPORTED_EVENTS = new Set(['salesorder.created', 'salesorder.updated']);

export async function GET() {
  const kv = await getKv();
  const processed: string[] = [];
  const requeued: string[] = [];
  const skipped: string[] = [];
  const failures: Array<{ id: string; error: string }> = [];

  for (let i = 0; i < 25; i += 1) {
    const raw = (await kv.lpop(queueKey)) as string | null;

    if (!raw) {
      break;
    }

    let envelope: QueueEnvelope;
    try {
      envelope = JSON.parse(raw) as QueueEnvelope;
    } catch (error) {
      log({ module: 'worker', action: 'parse', ok: false, err: error });
      continue;
    }


    if (!SUPPORTED_EVENTS.has(envelope.eventType)) {
      skipped.push(envelope.id);
      log({ module: 'worker', action: 'skip', ok: true, envelopeId: envelope.id, eventType: envelope.eventType });
      continue;
    }

    try {

      const salesOrder = await fetchSalesOrder(envelope.resourceGuid);
      if (!salesOrder) {
        throw new Error('Sales order not found');
      }

   const staging = await prisma.staging.upsert({
        where: { sourceGuid: envelope.resourceGuid },
        update: {
          payload: salesOrder,
          type: 'SalesOrder',
        },
        create: {
          source: 'unleashed',
          type: 'SalesOrder',
          sourceGuid: envelope.resourceGuid,
          payload: salesOrder,
        },
      });

      await prisma.syncTask.upsert({
        where: {
          sync_source_guid_type: {
            source: 'unleashed',
            sourceGuid: envelope.resourceGuid,
            type: 'SalesOrder',
          },
        },
        create: {
          source: 'unleashed',
          sourceGuid: envelope.resourceGuid,
          type: 'SalesOrder',
          status: 'READY',
          attempts: 0,
          stagingId: staging.id,
        },
        update: {
          status: 'READY',
          attempts: 0,
          lastError: null,

        },
      });

      processed.push(envelope.id);
      log({ module: 'worker', action: 'process', ok: true, envelopeId: envelope.id });
    } catch (error) {
      const attempts = (envelope.attempts ?? 0) + 1;
      envelope.attempts = attempts;
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (attempts < 8) {
        await kv.rpush(queueKey, JSON.stringify(envelope));
        const staging = await prisma.staging.upsert({
          where: { sourceGuid: envelope.resourceGuid },
          create: {
            source: 'unleashed',
            type: 'SalesOrder',
            sourceGuid: envelope.resourceGuid,
            payload: {},
          },
          update: {
            payload: {},
            type: 'SalesOrder',

          }
        });
        await prisma.syncTask.upsert({
          where: {
            sync_source_guid_type: {
              source: 'unleashed',
              sourceGuid: envelope.resourceGuid,
              type: 'SalesOrder',
            },
          },
          create: {
            source: 'unleashed',
            sourceGuid: envelope.resourceGuid,
            type: 'SalesOrder',
            status: 'READY',
            attempts,
            eventType: envelope.eventType,
            lastError: message,
            stagingId: staging.id,
          },
          update: {
            status: 'READY',
            attempts,
            lastError: message,

          },
        });
        requeued.push(envelope.id);
        log({ module: 'worker', action: 'requeue', ok: false, envelopeId: envelope.id, attempts, err: message });
      } else {
        const staging = await prisma.staging.findUnique({
          where: { sourceGuid: envelope.resourceGuid },
        });
        if (!staging) {
          throw new Error('Staging not found');
        }
        await prisma.syncTask.upsert({
          where: {
            sync_source_guid_type: {
              source: 'unleashed',
              sourceGuid: envelope.resourceGuid,
              type: 'SalesOrder',
            },
          },
          create: {
            source: 'unleashed',
            sourceGuid: envelope.resourceGuid,
            type: 'SalesOrder',
            status: 'FAILED',
            attempts,
            eventType: envelope.eventType,
            stagingId: staging.id,
            lastError: message,
          },
          update: {
            status: 'FAILED',
            attempts,
            lastError: message,
        
          },
        });
        failures.push({ id: envelope.id, error: message });
        log({ module: 'worker', action: 'failed', ok: false, envelopeId: envelope.id, attempts, err: message });
      }
    }
  }

  return NextResponse.json({ processed, requeued, skipped, failures });
}
