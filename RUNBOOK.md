# Middleware Operations Runbook

Last updated: $(date -u +%Y-%m-%d)

## Overview

This service exports staged Unleashed sales orders into ROar using the `upsertSalesOrder` adapter. Tasks are queued as `SyncTask` records and processed via the `/api/cron/roar-export` endpoint (scheduled every two minutes on Vercel).

## Credential rotation

1. Request new ROar API credentials (client ID/secret or API key) from the ROar admin portal.
2. Update Vercel project environment variables (`ROAR_API_KEY`, `ROAR_CLIENT_ID`, `ROAR_CLIENT_SECRET`).
3. Trigger a redeploy to propagate secrets. Validate via `/api/health/summary` that status remains `ok`.
4. Remove the deprecated credentials from all systems and confirm audit logging.

## Handling rate limits

- Monitor structured logs for `ROar API error (429)` messages.
- When rate limits occur, the adapter automatically retries with exponential backoff (`ROAR_MAX_RETRIES`).
- If limits persist, temporarily increase the cron interval or pause ingestion by setting tasks to `PAUSED` in the source system.
- Coordinate with ROar support to raise limits if incidents extend beyond 15 minutes.

## Backfill procedures

1. Import historical orders into the staging system so they appear as `SyncTask:READY`.
2. Increase cron frequency temporarily (e.g., every minute) while monitoring `/api/health/summary` for degradation.
3. Confirm mappings are created in `data/db.json` for each processed task.
4. Once backfill completes, revert cron schedule to every two minutes and verify dashboard metrics stabilize.

## Replaying failed tasks

1. Identify failed items on the dashboard (status `FAILED`).
2. Click the **Replay** button or call `POST /api/tasks/{id}/replay`.
3. The task status changes to `READY`, clearing the error field. The cron job will pick it up in the next cycle.
4. If repeated failures occur, inspect logs for root causes and escalate after three consecutive retries.

## Safe deploy checklist

- [ ] Ensure `npm run lint`, `npm run test`, `npm run build`, and `npm run format:check` all succeed locally.
- [ ] Update `.env.example`, README, and documentation for any configuration changes.
- [ ] Review structured logs in staging to confirm ROar adapter responses are healthy.
- [ ] Validate `/api/health/summary` reports `status: "ok"` after deployment.
- [ ] Confirm the cron job executed successfully by checking the dashboard mappings count.
