import { determineStatus } from '@/lib/probe';
import type { ProbeResult } from '@prisma/client';

const createResult = (overrides: Partial<ProbeResult>): ProbeResult => {
  const base: ProbeResult = {
    id: 1,
    resource: 'Products',
    success: true,
    statusCode: 200,
    message: null,
    responseTimeMs: 100,
    metadata: null,
    createdAt: new Date(),
  };

  return { ...base, ...overrides };
};

describe('determineStatus', () => {
  it('returns GREEN when last success is within 5 minutes', () => {
    const now = new Date();
    const results = [
      createResult({ createdAt: now, success: true, statusCode: 200 }),
      createResult({ id: 2, createdAt: new Date(now.getTime() - 60 * 60 * 1000), success: false }),
    ];

    const summary = determineStatus(results);
    expect(summary.status).toBe('GREEN');
  });

  it('returns ORANGE when mixed results in last hour', () => {
    const now = new Date();
    const results = [
      createResult({ id: 1, createdAt: now, success: false, statusCode: 500 }),
      createResult({ id: 2, createdAt: new Date(now.getTime() - 2 * 60 * 1000), success: true }),
      createResult({ id: 3, createdAt: new Date(now.getTime() - 10 * 60 * 1000), success: false }),
    ];

    const summary = determineStatus(results);
    expect(summary.status).toBe('ORANGE');
  });

  it('returns RED when no success in last hour', () => {
    const now = new Date();
    const results = [
      createResult({ id: 1, createdAt: now, success: false, statusCode: 500 }),
      createResult({ id: 2, createdAt: new Date(now.getTime() - 90 * 60 * 1000), success: true }),
    ];

    const summary = determineStatus(results);
    expect(summary.status).toBe('RED');
  });
});
