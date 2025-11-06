import prisma from './db';
import { fetchUnleashedResource, type UnleashedResource } from './unleashedClient';

export const runUnleashedProbe = async (resource: UnleashedResource) => {

  const startedAt = Date.now();

  try {
    const response = await fetchUnleashedResource(resource);
    const responseTimeMs = Date.now() - startedAt;

    await prisma.probeResult.create({
      data: {
        resource,
        ok: response.ok,
        status: response.status ,
        message: response.message,
        responseTimeMs
      },
    });
    return response;
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;
    await prisma.probeResult.create({
      data: {
        resource,
        ok: true,
        status:500,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs
      },
    });

    throw error;
  }
};
