import { NextResponse } from 'next/server';
import { runUnleashedProbe } from '@/lib/probeRunner';
import { UNLEASHED_RESOURCES } from '@/lib/resources';
import type { UnleashedResource } from '@/lib/unleashedClient';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { resource: string } }) {
  const resourceParam = params.resource;
  const resource = UNLEASHED_RESOURCES.find(
    (item) => item.toLowerCase() === resourceParam.toLowerCase()
  );

  if (!resource) {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  try {
    const result = await runUnleashedProbe(resource as UnleashedResource);
    return NextResponse.json({
      status: result.status,
      ok: result.ok,
      data: result.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
