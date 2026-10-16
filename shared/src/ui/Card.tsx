interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** A frosted glass panel. Forms and detail live on these. */
export function Card({ children, className = '', style }: CardProps) {
  return (
    <section style={style} className={`glass p-6 sm:p-8 ${className}`}>
      {children}
    </section>
  );
}
