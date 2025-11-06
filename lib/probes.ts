import { subMinutes } from 'date-fns';
import prisma from './prisma';

interface ProbeRecord {
  ok: boolean;
  status: number;
  message: string | null;
  createdAt: Date;
}

export type TrafficLight = 'GREEN' | 'ORANGE' | 'RED';

export interface ResourceStatus {
  status: TrafficLight;
  lastProbe?: Date;
  message?: string | null;
}

export async function getResourceStatus(resource: string): Promise<ResourceStatus> {
  const fiveMinutesAgo = subMinutes(new Date(), 5);
  const sixtyMinutesAgo = subMinutes(new Date(), 60);

  const lastProbes = (await prisma.probeResult.findMany({
    where: { resource },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })) as ProbeRecord[];

  const lastSuccess = lastProbes.find((probe) => probe.ok);
  const lastFailure = lastProbes.find((probe) => !probe.ok);
  const latest = lastProbes[0];

  if (!lastSuccess || lastSuccess.createdAt < sixtyMinutesAgo) {
    return {
      status: 'RED',
      lastProbe: latest?.createdAt,
      message: latest?.message ?? 'No successful probe in last 60 minutes',
    };
  }

  const lastFiveMinutesSuccess = lastSuccess.createdAt >= fiveMinutesAgo && lastSuccess.status === 200;
  if (lastFiveMinutesSuccess) {
    return {
      status: 'GREEN',
      lastProbe: lastSuccess.createdAt,
      message: lastSuccess.message,
    };
  }

  if (lastFailure && lastFailure.createdAt >= sixtyMinutesAgo) {
    return {
      status: 'ORANGE',
      lastProbe: latest?.createdAt,
      message: lastFailure.message ?? 'Recent failures detected',
    };
  }

  return {
    status: 'RED',
    lastProbe: latest?.createdAt,
    message: latest?.message ?? 'No successful probe recently',
  };
}
