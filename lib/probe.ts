import { subDays, subMinutes, isAfter } from 'date-fns';
import type { ProbeResult } from '@prisma/client';
import { StatusColor } from './status';

export interface ResourceStatusSummary {
  status: StatusColor;
  lastSuccessAt: Date | null;
  lastRunAt: Date | null;
  lastStatusCode: number | null;
  errorCount24h: number;
  recentResults: ProbeResult[];
}

const FIVE_MINUTES = 5;
const SIXTY_MINUTES = 60;

export const determineStatus = (results: ProbeResult[]): ResourceStatusSummary => {
  const now = new Date();
  const since60 = subMinutes(now, SIXTY_MINUTES);
  const since5 = subMinutes(now, FIVE_MINUTES);
  const since24h = subDays(now, 1);

  const sorted = [...results].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const last = sorted[0];
  const lastSuccess = sorted.find((r) => r.ok);

  const failuresLast60 = sorted.filter((r) => !r.ok && r.createdAt > since60);
  const successesLast60 = sorted.filter((r) => r.ok && r.createdAt > since60);

  const errorCount24h = sorted.filter((r) => !r.ok && r.createdAt > since24h).length;
  let status: StatusColor = 'RED';

  if (last && (last.status === 401 || last.status === 403)) {
    status = 'RED';
  } else if (last && last.ok && last.status === 200 && isAfter(last.createdAt, since5)) {
    status = 'GREEN';
  } else if (failuresLast60.length > 0 && successesLast60.length > 0) {
    status = 'ORANGE';
  } else if (!lastSuccess || !isAfter(lastSuccess.createdAt, since60)) {
    status = 'RED';
  } 

  return {
    status,
    lastSuccessAt: lastSuccess?.createdAt ?? null,
    lastRunAt: last?.createdAt ?? null,
    lastStatusCode: last?.status ?? null,
    errorCount24h,
    recentResults: sorted.slice(0, 50),
  };
};
