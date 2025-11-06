import { subHours } from 'date-fns';
import prisma from './prisma';
import { getKv, queueKey } from './kv';

export interface SyncTaskRecord {
  id: number;
  status: string;
  type: string;
  sourceGuid: string;
  updatedAt: Date;
  attempts: number;
  lastError: string | null;
}

export interface PipelineCounts {
  queued: number;
  processing: number;
  ready: number;
  failed24h: number;
  done24h: number;
}

export async function fetchPipelineCounts(): Promise<PipelineCounts> {
  const kv = await getKv();

  const queued = (await kv.llen(queueKey)) ?? 0;
  const [processing, ready, failed24h, done24h] = await Promise.all([
    prisma.syncTask.count({ where: { status: 'PROCESSING' } }),
    prisma.syncTask.count({ where: { status: 'READY' } }),
    prisma.syncTask.count({
      where: {
        status:{
          in: ['FAILED', 'SYNC_FAILED'],
        },
        updatedAt: { gte: subHours(new Date(), 24) },
      },
    }),
    prisma.syncTask.count({
      where: {
        status: 'DONE',
      updatedAt: { gte: subHours(new Date(), 24) },
      },
    }),
  ]);
  return { queued, processing, ready, failed24h, done24h };
}

export async function pipelineHealthColor(): Promise<'GREEN' | 'ORANGE' | 'RED'> {
  const sixtyMinutesAgo = subHours(new Date(), 1);
  const [recentFailed, recentDone] = await Promise.all([
    prisma.syncTask.count({
      where: { status: 'FAILED', updatedAt: { gte: sixtyMinutesAgo } },
    }),
    prisma.syncTask.count({
      where: { status: 'DONE', updatedAt: { gte: sixtyMinutesAgo } },
    }),
  ]);
  if (recentFailed === 0) {
    return 'GREEN';
  }
  if (recentDone > 0) {
    return 'ORANGE';
  }
  return 'RED';
}

export async function fetchRecentTasks(limit = 50): Promise<SyncTaskRecord[]> {
  const tasks = await prisma.syncTask.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
  return tasks as SyncTaskRecord[];
}
