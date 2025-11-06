import { ProbeService } from '@/server/services/probeService';
import type { ProbeResultRepository } from '@/server/repositories/probeResultRepository';
import type { ProbeDashboardEntry, ProbeKey } from '@/types/probe';
import type UnleashedClient from '@/server/utils/unleashedClient';

type RecordInput = Parameters<ProbeResultRepository['recordResult']>[0];

class StubRepository implements ProbeResultRepository {
  public readonly records: RecordInput[] = [];

  async recordResult(input: RecordInput) {
    this.records.push(input);
  }

  async fetchDashboardEntries(): Promise<ProbeDashboardEntry[]> {
    return [];
  }
}

describe('ProbeService', () => {
  it('records success for products probe', async () => {
    const repository = new StubRepository();
    const client = {
      getPage: jest.fn().mockResolvedValue({}),
      getAllPages: jest.fn(),
    } as unknown as UnleashedClient;

    const service = new ProbeService(repository, client);
    await service.runProducts('manual');

    expect(repository.records).toHaveLength(1);
    expect(repository.records[0].status).toBe('success');
    expect(client.getPage).toHaveBeenCalledWith('/Products', 1);
  });

  it('records failure when underlying client throws', async () => {
    const repository = new StubRepository();
    const client = {
      getPage: jest.fn().mockRejectedValue(new Error('boom')),
      getAllPages: jest.fn(),
    } as unknown as UnleashedClient;

    const service = new ProbeService(repository, client);
    await expect(service.runProducts('manual')).rejects.toThrow('boom');
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0].status).toBe('error');
  });

  it('continues running subsequent probes even when one fails', async () => {
    const repository = new StubRepository();
    const client = {
      getPage: jest.fn().mockResolvedValue({}),
      getAllPages: jest
        .fn()
        .mockRejectedValueOnce(new Error('sales order failure'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    } as unknown as UnleashedClient;

    const service = new ProbeService(repository, client);
    await service.runAll('cron');

    const statuses = repository.records.reduce<Record<ProbeKey, number>>(
      (acc, record) => {
        acc[record.probeKey] = (acc[record.probeKey] ?? 0) + 1;
        return acc;
      },
      {} as Record<ProbeKey, number>,
    );

    expect(statuses.products).toBe(1);
    expect(statuses.salesOrders).toBe(1);
    expect(statuses.purchaseOrders).toBe(1);
    expect(statuses.stockOnHand).toBe(1);
  });
});
