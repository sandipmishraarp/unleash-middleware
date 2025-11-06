import { fetchPipelineCounts, fetchRecentTasks } from '@/lib/pipeline';
import { replayTaskAction, retrySyncTaskAction } from './actions';

const STATUS_COLORS: Record<string, string> = {
  READY: 'text-emerald-400',
  PROCESSING: 'text-amber-300',
  DONE: 'text-slate-300',
  FAILED: 'text-rose-400',
  QUEUED: 'text-blue-400',
};

export default async function PipelinePage() {
  const [counts, tasks] = await Promise.all([fetchPipelineCounts(), fetchRecentTasks(50)]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Pipeline</h2>
        <p className="text-sm text-slate-400">Monitor queue throughput and replay failed tasks.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Queued" value={counts.queued} />
        <StatCard label="Processing" value={counts.processing} />
        <StatCard label="Ready" value={counts.ready} />
        <StatCard label="Failed (24h)" value={counts.failed24h} />
        <StatCard label="Done (24h)" value={counts.done24h} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent activity</h3>
          <p className="text-xs text-slate-500">Showing latest {tasks.length} tasks</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Source Guid</th>
                <th className="py-2 text-left">Attempts</th>
                <th className="py-2 text-left">Last Error</th>
                <th className="py-2 text-left">Updated</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className={`py-2 font-semibold ${STATUS_COLORS[task.status] ?? 'text-slate-300'}`}>
                    {task.status}
                  </td>
                  <td className="py-2 text-slate-300">{task.type}</td>
                  <td className="py-2 font-mono text-xs text-slate-400">{task.sourceGuid}</td>
                  <td className="py-2 text-slate-400">{task.attempts}</td>
                  <td className="py-2 text-slate-400">{task.lastError ?? '—'}</td>
                  <td className="py-2 text-slate-400">
                    {new Date(task.updatedAt).toLocaleString()}
                  </td>
                  <td className="py-2">
                    {task.status === 'FAILED' &&  (
                      <form action={replayTaskAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Replay
                        </button>
                      </form>
                    ) }
                    {task.status === 'SYNC_FAILED' && (
                      <form action={retrySyncTaskAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Retry Sync
                        </button>
                      </form>
                    ) }
                    {
                      !['FAILED', 'SYNC_FAILED'].includes(task.status) && (
                        <span className="text-xs text-slate-600">—</span>
                      )
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card space-y-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}
