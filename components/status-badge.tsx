import { STATUS_TO_COLOR, StatusLabel, StatusColor } from '@/lib/status';
import clsx from 'clsx';

export function StatusBadge({ status }: { status: StatusColor }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        STATUS_TO_COLOR[status]
      )}
    >
      {StatusLabel[status]}
    </span>
  );
}
