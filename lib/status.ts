export type StatusColor = 'GREEN' | 'ORANGE' | 'RED';

export const STATUS_TO_COLOR: Record<StatusColor, string> = {
  GREEN: 'bg-success/20 text-success border-success/40',
  ORANGE: 'bg-warning/20 text-warning border-warning/40',
  RED: 'bg-danger/20 text-danger border-danger/40',
};

export const StatusLabel: Record<StatusColor, string> = {
  GREEN: 'Healthy',
  ORANGE: 'Degraded',
  RED: 'Unhealthy',
};
