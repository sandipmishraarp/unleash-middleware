import Link from 'next/link';
import prisma from '@/lib/db';
import { RESOURCE_KEYS, RESOURCE_LABELS, UNLEASHED_RESOURCES } from '@/lib/resources';
import clsx from 'clsx';

const slugToResource = (slug: string) => {
  return UNLEASHED_RESOURCES.find((resource) => RESOURCE_KEYS[resource] === slug);
};

const formatDate = (date: Date) => date.toLocaleString();

export default async function ResourceLogsPage({ params }: { params: { resource: string } }) {
  const resource = slugToResource(params.resource);

  if (!resource) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-danger">Unknown resource.</p>
        <Link className="text-sm text-slate-600 underline hover:text-slate-900" href="/">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const logs = await prisma.probeResult.findMany({
    where: { resource },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{RESOURCE_LABELS[resource]} Logs</h2>
        <p className="text-sm text-slate-500">Most recent probe executions</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Timestamp</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status Code</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Latency (ms)</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No probes have been executed yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {formatDate(log.createdAt)}
                </td>
                <td
                  className={clsx(
                    'px-4 py-3 font-medium',
                    log.ok ? 'text-success' : 'text-danger'
                  )}
                >
                  {log.ok ? 'Success' : 'Failure'}
                </td>
                <td className="px-4 py-3 text-slate-700">{log.status ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{log.responseTimeMs ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">
                  {log.message ?? (log.ok ? 'OK' : 'Check probe logs')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link className="text-sm text-slate-600 underline hover:text-slate-900" href="/">
        Back to dashboard
      </Link>
    </div>
  );
}
