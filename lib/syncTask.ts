// import { logger } from '@/src/lib';
import prisma from './db';
import { log } from 'console';

export const getReadyTasks = async () => {
  try {
    const tasks = await prisma.syncTask.findMany({
      where: { status: 'READY' },
      select: {
        staging: {
          select: {
            payload: true,
          },
        },
        id: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    log({
      module: 'syncTask',
      action: 'getReadyTasks',
      ok: true,
      status: 200,
      tasks: tasks.length,
    });
    return tasks;
  } catch (error) {
    log({ module: 'syncTask', action: 'getReadyTasks', ok: false, status: 500, err: error });
    return [];
  }
};
export const updateTaskStatus = async (taskId: number, status: string, error?: string) => {
  try {
    await prisma.syncTask.update({
      where: { id: taskId },
      data: { status, lastError: error },
    });
    log({ module: 'syncTask', action: 'updateTaskStatus', ok: true, status: 200, taskId });
  } catch (error) {
    log({ module: 'syncTask', action: 'updateTaskStatus', ok: false, status: 500, err: error });
  }
};
