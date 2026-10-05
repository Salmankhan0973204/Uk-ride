type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral';

const styles: Record<BadgeVariant, { box: string; dot: string }> = {
  success: { box: 'bg-success-soft text-success', dot: 'bg-success' },
  danger: { box: 'bg-danger-soft text-danger', dot: 'bg-danger' },
  warning: { box: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  neutral: { box: 'bg-neutral-soft text-ink-muted', dot: 'bg-ink-muted' },
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

/** Status label. The text carries the meaning; colour only reinforces it. */
export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const style = styles[variant];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${style.box}`}
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${style.dot}`} />
      {children}
    </span>
  );
}
