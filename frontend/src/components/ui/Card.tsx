interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}
