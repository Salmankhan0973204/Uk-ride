import Link from 'next/link';

/**
 * The home page. For now: what UkRide is and the way in to a price. The
 * fleet joins it in step 3.9 and the "BOOK YOUR JOURNEY" widget in 5.13.
 */
export default function HomePage() {
  return (
    <section className="rise max-w-3xl space-y-8 pt-6 sm:pt-12">
      <div className="space-y-5">
        <h1 className="text-[clamp(2.35rem,7.6vw,3.4rem)] leading-[1.04] font-semibold tracking-tight text-balance">
          Pre&#8209;booked travel in and around London.
        </h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
          Airport transfers and A-to-B journeys, at an exact price you see before you book. Online
          booking opens soon.
        </p>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <Link href="/quote" className="btn btn-primary px-7! text-base">
          Get a price
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <Link href="/vehicles" className="btn btn-ghost px-6! text-base">
          See the vehicles
        </Link>
      </div>
    </section>
  );
}
