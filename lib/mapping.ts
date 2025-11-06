import prisma from "./db";

export const createMapping = async (source: string, sourceGuid: string, target: string, targetId: string) => {
   await prisma.mapping.create({
    data: {
      source,
      sourceGuid,
      target,
      targetId,
      lastSyncedAt: new Date(),
    },
  });
};