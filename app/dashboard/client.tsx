'use client';
import React from 'react';
import Link from 'next/link';
import { ResourceStatusSummary } from '@/lib/probe';
import { UnleashedResource } from '@/lib/unleashedClient';
import { RESOURCE_KEYS, RESOURCE_LABELS } from '@/lib/resources';
import { StatusBadge } from '@/components/status-badge';
import { runProbeAction } from './actions';
import clsx from 'clsx';
import { useFormStatus } from 'react-dom';

interface DashboardPageProps {
  summaries: {
    resource: UnleashedResource;
    summary: ResourceStatusSummary;
  }[];
  credentialsConfigured: boolean;
}
const formatDate = (date: Date | null) => {
  if (!date) return '\u2014';
  return date.toLocaleString();
};
export default function DashboardPage({ summaries, credentialsConfigured }: DashboardPageProps) {
  return (
    <div className="space-y-6">
      {!credentialsConfigured && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          Unleashed credentials are not configured. Add them in the Settings page to enable live
          probes.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {summaries.map(({ resource, summary }) => (
          <div key={resource} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{RESOURCE_LABELS[resource]}</h2>
                <p className="text-sm text-slate-500">Latest Unleashed probe status</p>
              </div>
              <StatusBadge status={summary.status} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Last Success</dt>
                <dd className="font-medium text-slate-800">{formatDate(summary.lastSuccessAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Last Run</dt>
                <dd className="font-medium text-slate-800">{formatDate(summary.lastRunAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Last Status Code</dt>
                <dd className="font-medium text-slate-800">{summary.lastStatusCode ?? '\u2014'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Errors (24h)</dt>
                <dd className="font-medium text-slate-800">{summary.errorCount24h}</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link
                className="text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                href={`/logs/${RESOURCE_KEYS[resource]}`}
              >
                View logs
              </Link>

              <form action={runProbeAction}>
                <input type="hidden" name="resource" value={resource} />
                <RunProbeButton />
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function RunProbeButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={clsx(
        'rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 shadow-sm transition',
        'hover:bg-slate-100'
      )}
      type="submit"
      disabled={pending}
    >
      {pending ? 'Running' : 'Run Probe'}
    </button>
  );
}
