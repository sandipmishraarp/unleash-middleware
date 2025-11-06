import { PrismaClient } from '@prisma/client';

interface SettingRow {
  id: number;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProbeRow {
  id: number;
  resource: string;
  ok: boolean;
  status: number;
  message?: string | null;
  createdAt: Date;
}

interface SyncTaskRow {
  id: number;
  source: string;
  type: string;
  sourceGuid: string;
  status: string;
  attempts: number;
  lastError?: string | null;
  eventType?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StagingRow {
  id: number;
  source: string;
  type: string;
  sourceGuid: string;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaLike {
  secret: {
    findUnique(args: { where: { key: string } }): Promise<SettingRow | null>;
    upsert(args: {
      where: { key: string };
      update: Partial<SettingRow>;
      create: { key: string; value: string };
    }): Promise<SettingRow>;
    findMany(args: {
      where: { key: { in: string[] } };
      select?: { key: true };
    }): Promise<Array<{ key: string }>>;
  };
  probeResult: {
    create(args: {
      data: {
        resource: string;
        ok: boolean;
        status: number;
        message?: string | null;
      };
    }): Promise<ProbeRow>;
    findMany(args: {
      where: { resource: string };
      orderBy: { createdAt: 'desc' | 'asc' };
      take?: number;
    }): Promise<ProbeRow[]>;
  };
  syncTask: {
    count(args: {
      where: {
        status?: string | {
          in: string[];
        };
        updatedAt?: { gte: Date };
      };
    }): Promise<number>;
    findMany(args: {
      orderBy: { updatedAt: 'desc' | 'asc' };
      take?: number;
    }): Promise<SyncTaskRow[]>;
    findUnique(args: {
      where: { id: number };
    }): Promise<SyncTaskRow | null>;
    upsert(args: {
      where: { sync_source_guid_type: { source: string; sourceGuid: string; type: string } };
      create: {
        source: string;
        sourceGuid: string;
        type: string;
        status: string;
        attempts?: number;
        lastError?: string | null;
        eventType?: string | null;
        stagingId?: number;
      };
      update: {
        status?: string;
        attempts?: number;
        lastError?: string | null;
        
      };
    }): Promise<SyncTaskRow>;
    update(args: {
      where: { id: number };
      data: {
        status?: string;
        lastError?: string | null;
        attempts?: number;
      };
    }): Promise<SyncTaskRow>;
  };
  staging: {
    findUnique(args: {
      where: { sourceGuid: string };
    }): Promise<StagingRow | null>;
    upsert(args: {
      where: { sourceGuid: string };
      create: {
        source: string;
        type: string;
        sourceGuid: string;
        payload: unknown;
      };
      update: {
        payload?: unknown;
        type?: string;
      };
    }): Promise<StagingRow>;
  };
}

function createPrismaMock(): PrismaLike {
  let settingId = 1;
  let probeId = 1;
  let syncId = 1;
  let stagingId = 1;
  const settings: SettingRow[] = [];
  const probes: ProbeRow[] = [];
  const syncTasks: SyncTaskRow[] = [];
  const staging: StagingRow[] = [];

  return {
    secret: {
      async findUnique({ where: { key } }) {
        return settings.find((item) => item.key === key) ?? null;
      },
      async upsert({ where: { key }, update, create }) {
        const existing = settings.find((item) => item.key === key);
        if (existing) {
          if (typeof update.value === 'string') {
            existing.value = update.value;
          }
          existing.updatedAt = new Date();
          return existing;
        }
        const now = new Date();
        const record: SettingRow = {
          id: settingId++,
          key,
          value: create.value,
          createdAt: now,
          updatedAt: now,
        };
        settings.push(record);
        return record;
      },
      async findMany({ where: { key: { in: keys } } }) {
        return settings.filter((item) => keys.includes(item.key)).map((item) => ({ key: item.key }));
      },
    },
    probeResult: {
      async create({ data }) {
        const now = new Date();
        const record: ProbeRow = {
          id: probeId++,
          resource: data.resource,
          ok: data.ok,
          status: data.status,
          message: data.message,
          createdAt: now,
        };
        probes.push(record);
        return record;
      },
      async findMany({ where: { resource }, orderBy, take }) {
        const results = probes
          .filter((probe) => probe.resource === resource)
          .sort((a, b) => (orderBy.createdAt === 'desc' ? b.createdAt.getTime() - a.createdAt.getTime() : a.createdAt.getTime() - b.createdAt.getTime()));
        if (typeof take === 'number') {
          return results.slice(0, take);
        }
        return results;
      },
    },
    syncTask: {
      async count({ where }) {
        return syncTasks.filter((task) => {
          if (where.status && task.status !== where.status) {
            return false;
          }
          if (where.updatedAt?.gte && task.updatedAt < where.updatedAt.gte) {
            return false;
          }
          return true;
        }).length;
      },
      async findMany({ orderBy, take }) {
        const results = [...syncTasks].sort((a, b) =>
          orderBy.updatedAt === 'desc' ? b.updatedAt.getTime() - a.updatedAt.getTime() : a.updatedAt.getTime() - b.updatedAt.getTime()
        );
        return typeof take === 'number' ? results.slice(0, take) : results;
      },
      async findUnique({ where: { id } }) {
        return syncTasks.find((task) => task.id === id) ?? null;
      },
      async upsert({ where: { sync_source_guid_type }, create, update }) {
        const existing = syncTasks.find(
          (task) =>
            task.source === sync_source_guid_type.source &&
            task.sourceGuid === sync_source_guid_type.sourceGuid &&
            task.type === sync_source_guid_type.type
        );
        if (existing) {
          if (update.status) existing.status = update.status;
          if (typeof update.attempts === 'number') existing.attempts = update.attempts;
          if (update.lastError !== undefined) existing.lastError = update.lastError ?? null;
          existing.updatedAt = new Date();
          return existing;
        }
        const now = new Date();
        const record: SyncTaskRow = {
          id: syncId++,
          source: create.source,
          sourceGuid: create.sourceGuid,
          type: create.type,
          status: create.status,
          attempts: create.attempts ?? 0,
          lastError: create.lastError ?? null,
          createdAt: now,
          updatedAt: now,
        };
        syncTasks.push(record);
        return record;
      },
      async update({ where: { id }, data }) {
        const task = syncTasks.find((item) => item.id === id);
        if (!task) {
          throw new Error(`SyncTask ${id} not found`);
        }
        if (data.status) task.status = data.status;
        if (data.lastError !== undefined) task.lastError = data.lastError ?? null;
        if (typeof data.attempts === 'number') task.attempts = data.attempts;
        task.updatedAt = new Date();
        return task;
      },
    },
    staging: {
      async findUnique({ where: { sourceGuid } }) {
        return staging.find((item) => item.sourceGuid === sourceGuid) ?? null;
      },
      async upsert({ where: { sourceGuid }, create, update }) {
        const existing = staging.find((item) => item.sourceGuid === sourceGuid);
        if (existing) {
          if (update.payload !== undefined) existing.payload = update.payload;
          if (update.type) existing.type = update.type;
          existing.updatedAt = new Date();
          return existing;
        }
        const now = new Date();
        const record: StagingRow = {
          id: stagingId++,
          source: create.source,
          type: create.type,
          sourceGuid: create.sourceGuid,
          payload: create.payload,
          createdAt: now,
          updatedAt: now,
        };
        staging.push(record);
        return record;
      },
    },
  };
}

const globalForPrisma = global as unknown as { prisma: PrismaLike | undefined };

function instantiatePrisma(): PrismaLike {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    globalForPrisma.prisma = client as unknown as PrismaLike;
    return globalForPrisma.prisma;
  } catch (error) {
    console.warn('Prisma engines unavailable, falling back to in-memory mock.', error);
    const mock = createPrismaMock();
    globalForPrisma.prisma = mock;
    return mock;
  }
}

export const prisma = instantiatePrisma();

export default prisma;
