import prisma from '@/lib/db';
import { determineStatus } from '@/lib/probe';
import { hasSecret } from '@/lib/secrets';
import DashboardPage from './client';
import { UNLEASHED_RESOURCES } from '@/lib/resources';

const resourceSummaries = async () => {
  const summaries = await Promise.all(
    UNLEASHED_RESOURCES.map(async (resource) => {
      const results = await prisma.probeResult.findMany({
        where: { resource },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return { resource, summary: determineStatus(results) };
    })
  );

  return summaries;
};

export default async function Page() {
  const summaries = await resourceSummaries();
  const credentialsConfigured =
    (await hasSecret('UNLEASHED_API_ID')) && (await hasSecret('UNLEASHED_API_KEY'));

  return (
  <DashboardPage summaries={summaries} credentialsConfigured={credentialsConfigured} />
  );
}
