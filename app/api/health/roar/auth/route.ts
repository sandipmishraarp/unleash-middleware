import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/roarClient';
import { log } from '@/lib/logger';
export async function GET() {
  const result = await auth();
  const status = result.ok ? 200 : 503;
  await prisma.probeResult.create({
    data: {
      resource: 'roar:auth',
      ok: result.ok,
      status,
      message: result.message,
    },
  });
  log({
    module: 'probe',
    action: 'roar:auth',
    ok: result.ok,
    code: status,
    message: result.message,
  });
  return NextResponse.json({ ok: result.ok, message: result.message }, { status });
}
