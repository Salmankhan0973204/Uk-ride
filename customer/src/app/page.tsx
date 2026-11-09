import Link from 'next/link';
import { Card } from '@ukride/shared/ui/Card';
import { JourneyForm } from '@/features/booking/components/JourneyForm';
import { FleetSection } from '@/features/vehicle-types/components/FleetSection';
import { FLEET_ANCHOR } from '@/features/vehicle-types/paths';

/**
 * The home page: what UkRide is beside the "BOOK YOUR JOURNEY" widget (5.13),
 * then the fleet (3.9). The widget's "Get quote" opens /booking.
 */
export default function HomePage() {
  return (
    <div className="space-y-20 sm:space-y-28">
      <section className="grid items-start gap-10 pt-2 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
        <div className="rise space-y-8 lg:pt-10">
          <div className="space-y-5">
            <h1 className="text-[clamp(2.35rem,7.6vw,3.4rem)] leading-[1.04] font-semibold tracking-tight text-balance">
              Pre&#8209;booked travel in and around London.
            </h1>
            <p className="max-w-[42ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
              Airport transfers and A-to-B journeys, at an exact price you see before you book.
            </p>
          </div>
          <Link href={`#${FLEET_ANCHOR}`} className="btn btn-ghost px-6! text-base max-sm:w-full">
            See the fleet
          </Link>
        </div>

        <Card className="rise">
          <JourneyForm heading="Book your journey" />
        </Card>
      </section>

      <FleetSection />
    </div>
  );
}
