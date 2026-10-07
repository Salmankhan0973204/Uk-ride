import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatusSummary } from '@/features/health/components/StatusSummary';

/**
 * The stages of a UkRide journey, in order.
 * Only stages that exist are marked open; the rest say so plainly.
 */
const stages = [
  {
    title: 'Create your account',
    text: 'Your name, email and mobile number.',
    href: '/register',
  },
  { title: 'Get an exact price', text: 'The full fare before you commit.' },
  { title: 'Book and pay', text: 'Choose the car and the time.' },
  { title: 'Follow your driver', text: 'See who is coming and where they are.' },
];

const order = (n: number) => ({ '--order': n }) as React.CSSProperties;

export default function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="grid items-center gap-x-12 gap-y-10 pt-6 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pb-6">
        <div className="rise space-y-8">
          <div className="space-y-5">
            <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] leading-[1.02] font-semibold tracking-tight text-balance">
              Chauffeur&#8209;driven travel, booked ahead.
            </h1>
            <p className="max-w-[42ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
              UkRide is one private-hire firm&rsquo;s own booking service. Start with an account;
              the rest of the journey is opening stage by stage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn btn-primary px-7! text-base">
              Create account
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
            <Link href="/system-status" className="btn btn-ghost px-6! text-base">
              System status
            </Link>
          </div>
        </div>

        <Card className="rise" style={order(1)}>
          <div className="space-y-5">
            <h2 className="text-xl font-semibold tracking-tight">Your journey with UkRide</h2>

            <ol className="space-y-3">
              {stages.map((stage, index) => (
                <li
                  key={stage.title}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-line bg-glass p-4"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                      stage.href
                        ? 'bg-linear-to-br from-accent to-accent-2 shadow-[0_0_20px_rgb(139_92_246/0.6)]'
                        : 'border border-glass-border bg-glass text-ink-muted'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h3 className="font-semibold">
                      {stage.href ? (
                        <Link
                          href={stage.href}
                          className="underline decoration-ring/70 decoration-2 underline-offset-4 hover:decoration-ring"
                        >
                          {stage.title}
                        </Link>
                      ) : (
                        stage.title
                      )}
                    </h3>
                    <p className="text-sm text-ink-muted">{stage.text}</p>
                  </div>
                  {/* Under the text and in line with it, so a long title never gets squeezed. */}
                  <div className="w-full pl-14">
                    {stage.href ? (
                      <Badge variant="success">Open</Badge>
                    ) : (
                      <Badge variant="warning">Soon</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </section>

      <div className="rise" style={order(2)}>
        <StatusSummary />
      </div>

      <p className="max-w-[70ch] px-1 text-sm leading-relaxed text-ink-muted">
        UkRide is being built one stage at a time. Prices, vehicles and the area served have not
        been published yet, so none are shown here.
      </p>
    </div>
  );
}
