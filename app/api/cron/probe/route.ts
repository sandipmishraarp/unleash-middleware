import { NextResponse } from 'next/server';
import { UNLEASHED_RESOURCES } from '@/lib/resources';
import { runUnleashedProbe } from '@/lib/probeRunner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Array<{ resource: string; status: number; ok: boolean }> = [];

  for (const resource of UNLEASHED_RESOURCES) {
    try {
      const response = await runUnleashedProbe(resource);
      results.push({ resource, status: response.status, ok: response.ok });
    } catch (error) {
      results.push({ resource, status: 500, ok: false });
      console.error(`Cron probe failed for ${resource}`, error);
    }
  }

  return NextResponse.json({
    executedAt: new Date().toISOString(),
    results,
  });
}
