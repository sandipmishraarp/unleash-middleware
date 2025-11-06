'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getKv, queueKey } from '@/lib/kv';

export async function replayTaskAction(formData: FormData) {
  const rawId = formData.get('taskId');
  const id = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : NaN;
  if (!Number.isFinite(id)) {
    throw new Error('Invalid task id');
  }
 const kv = await getKv();
 const syncTask = await prisma.syncTask.findUnique({  
  where: { id },
 });
 if (!syncTask) {
  throw new Error('Sync task not found');
 }
 const envelope = {
  id: crypto.randomUUID(),
  receivedAt: new Date().toISOString(),
  eventType: syncTask.eventType,
  resourceType: syncTask.type,
  resourceGuid: syncTask.sourceGuid,
  occurredAt: syncTask.createdAt.toISOString(),
  body: {},
  attempts: 0,
 };
  await kv.rpush(queueKey, JSON.stringify(envelope));
  await prisma.syncTask.update({    
    where: { id },
    data: { status: 'QUEUED', lastError: null, attempts: 0 },
  });
  revalidatePath('/pipeline');
  revalidatePath('/');
  log({ module: 'pipeline', action: 'replay', ok: true, taskId: id });

}

export async function retrySyncTaskAction(formData: FormData) {
  const rawId = formData.get('taskId');
  const id = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : NaN;
  if (!Number.isFinite(id)) {
    throw new Error('Invalid task id');
  }
  const syncTask = await prisma.syncTask.findUnique({
    where: { id },
  });
  if (!syncTask) {
    throw new Error('Sync task not found');
  }
  await prisma.syncTask.update({
    where: { id },
    data: { status: 'READY', lastError: null, attempts: 0 },
  });
  revalidatePath('/pipeline');
  revalidatePath('/');
  log({ module: 'pipeline', action: 'retrySync', ok: true, taskId: id });
}