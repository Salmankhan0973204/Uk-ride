import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">UkRide</h1>
        <p className="max-w-prose text-base leading-relaxed text-ink-muted">
          A taxi and chauffeur booking platform, built one module at a time. The foundation is in
          place: the web app talks to the API and reports what it finds.
        </p>
      </div>

      <Link
        href="/system-status"
        className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90"
      >
        Check system status
      </Link>
    </div>
  );
}
