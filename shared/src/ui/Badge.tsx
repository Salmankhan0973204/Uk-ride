type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral';

const dots: Record<BadgeVariant, string | undefined> = {
  success: 'var(--success)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  neutral: undefined,
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

/** Status pill. The text carries the meaning; the dot's colour only reinforces it. */
export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className="pill font-sans" style={{ '--dot': dots[variant] } as React.CSSProperties}>
      {children}
    </span>
  );
}
