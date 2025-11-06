import { retryOperation } from '@/helper';
import { upsertSalesOrder } from '@/lib/roarClient';
import { getReadyTasks, updateTaskStatus } from '@/lib/syncTask';
import { autoMappingRoarLayer } from '@/lib/autoMappingRoarLayer';
import { NextResponse } from 'next/server';
import { SalesOrder } from '@/lib/unleashedClient';
import { buildSalesOrderPayload } from './buildSalesOrderPayload';
import { Source } from '@/types/unleash';
import { createMapping } from '@/lib/mapping';

export const dynamic = 'force-dynamic';

export async function GET() {
  const readyTasks = await getReadyTasks();
  let syncTasks = 0;
  await autoMappingRoarLayer.init();

  for (const task of readyTasks) {
    if (!task.staging.payload) continue;
    await updateTaskStatus(task.id, 'PROCESSING');

    try {
      const payload = task.staging.payload as SalesOrder;
      const mappings = await autoMappingRoarLayer.createAutoMapping(payload);
      const salesOrderPayload = buildSalesOrderPayload(payload, mappings);
      const response = await retryOperation(
        () => upsertSalesOrder(salesOrderPayload),
        'upsertSalesOrder',
        3,
        2000
      );
      await createMapping(Source.UNLEASH, payload.Guid, Source.ROAR, response.targetId);
      syncTasks++;
      await updateTaskStatus(task.id, 'DONE');
    } catch (error) {
      console.error('Error processing task:', error);
      await updateTaskStatus(
        task.id,
        'SYNC_FAILED',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  return NextResponse.json({
    syncTasks: syncTasks,
  });
}
