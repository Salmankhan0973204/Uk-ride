import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">UkRide</h1>
        <p className="max-w-prose text-base leading-relaxed text-ink-muted">
          A taxi and chauffeur booking platform, built one module at a time. The foundation is in
          place, and you can now create an account.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90"
        >
          Create an account
        </Link>
        <Link
          href="/system-status"
          className="inline-flex min-h-11 items-center text-sm font-medium underline decoration-control decoration-2 underline-offset-4 transition-colors hover:decoration-ink"
        >
          Check system status
        </Link>
      </div>
    </div>
  );
}
