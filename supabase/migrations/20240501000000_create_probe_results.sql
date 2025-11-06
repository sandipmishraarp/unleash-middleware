create extension if not exists "pgcrypto";

create table if not exists public.probe_results (
  id uuid primary key default gen_random_uuid(),
  probe_key text not null,
  status text not null check (status in ('success', 'error')),
  error_message text,
  triggered_by text not null check (triggered_by in ('manual', 'cron')),
  started_at timestamptz not null default timezone('utc'::text, now()),
  completed_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists probe_results_probe_key_completed_at_idx
  on public.probe_results (probe_key, completed_at desc);

alter table public.probe_results enable row level security;

drop policy if exists "service-role-manage-probes" on public.probe_results;
create policy "service-role-manage-probes" on public.probe_results
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "authenticated-read-probes" on public.probe_results;
create policy "authenticated-read-probes" on public.probe_results
  for select
  using (coalesce((auth.jwt() ->> 'b2b')::boolean, false));
