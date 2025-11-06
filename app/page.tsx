
import Link from 'next/link';
import { getResourceStatus } from '@/lib/probes';
import { fetchPipelineCounts, pipelineHealthColor } from '@/lib/pipeline';

function StatusDot({ status }: { status: 'GREEN' | 'ORANGE' | 'RED' }) {
  const color = {
    GREEN: 'bg-emerald-500',
    ORANGE: 'bg-amber-400',
    RED: 'bg-rose-500',
  }[status];
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export default async function Dashboard() {
  const [roarStatus, counts, pipelineStatus] = await Promise.all([
    getResourceStatus('roar:auth'),
    fetchPipelineCounts(),
    pipelineHealthColor(),
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">ROar Auth</h3>
              <p className="text-xs text-slate-400">Checks ability to authenticate with ROar.</p>
            </div>
            <StatusDot status={roarStatus.status} />
          </div>
          <p className="text-sm text-slate-300">{roarStatus.message ?? 'Ready'}</p>
          <div className="flex items-center gap-3 text-sm">
            <a
              href="/api/health/roar/auth"
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-slate-500"
            >
              Run probe
            </a>
            <span className="text-xs text-slate-500">
              Last probe: {roarStatus.lastProbe?.toLocaleString() ?? 'never'}
            </span>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pipeline</h3>
              <p className="text-xs text-slate-400">Queue health for Unleashed → ROar sync.</p>
            </div>
            <StatusDot status={pipelineStatus} />
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Queued</dt>
              <dd className="text-2xl font-semibold">{counts.queued}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Processing</dt>
              <dd className="text-2xl font-semibold">{counts.processing}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Ready</dt>
              <dd className="text-2xl font-semibold">{counts.ready}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Failed (24h)</dt>
              <dd className="text-2xl font-semibold">{counts.failed24h}</dd>
            </div>
          </dl>
          <Link
            href="/pipeline"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            View pipeline details →
          </Link>
        </div>
      </section>
    </div>
  );
}

