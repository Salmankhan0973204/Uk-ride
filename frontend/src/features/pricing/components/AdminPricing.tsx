'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatPence } from '@/lib/money/money';
import { usePricing } from '../hooks/usePricing';
import type { VehicleTypePricing } from '../types';

export function AdminPricing() {
  const saved = useSearchParams().get('saved');
  const { data: types, isPending, isError, error, refetch, isFetching } = usePricing();
  const savedName = types?.find((type) => type.id === saved)?.name;
  const missing = types?.filter((type) => type.isActive && !type.pricingRule).length ?? 0;

  return (
    <Card className="rise">
      <div className="space-y-7">
        {savedName ? (
          <p
            role="status"
            className="rounded-2xl border border-success/50 bg-[rgb(110_231_183/0.12)] px-4 py-3 text-sm leading-relaxed font-medium"
          >
            The prices for {savedName} have been saved. New quotes use them straight away.
          </p>
        ) : null}

        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Pricing
          </h1>
          <p className="max-w-[60ch] text-base leading-relaxed text-ink-muted">
            The prices of each vehicle type. Night is 10pm to 6am, UK time. A type without prices
            cannot be quoted or booked.
          </p>
        </div>

        {missing > 0 ? (
          <p className="rounded-2xl border border-warning/50 bg-[rgb(252_211_77/0.12)] px-4 py-3 text-sm leading-relaxed">
            {missing === 1
              ? 'One vehicle type on offer has no prices, so customers cannot get a quote for it.'
              : `${missing} vehicle types on offer have no prices, so customers cannot get a quote for them.`}
          </p>
        ) : null}

        {isPending ? (
          <div role="status" className="flex items-center gap-3 border-t border-line pt-6">
            <Spinner />
            <p className="text-base text-ink-muted">Loading the prices</p>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-4 border-t border-line pt-6">
            <p className="text-base leading-relaxed">
              {error.status === 403
                ? 'Your account is no longer allowed to manage prices.'
                : 'We could not load the prices. Try again in a moment.'}
            </p>
            {error.status === 403 ? null : (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="btn btn-ghost"
              >
                {isFetching ? 'Trying again' : 'Try again'}
              </button>
            )}
          </div>
        ) : types.length === 0 ? (
          <p className="border-t border-line pt-6 text-base leading-relaxed text-ink-muted">
            There are no vehicle types yet. Add one under Vehicle types first.
          </p>
        ) : (
          <table className="tabular w-full border-collapse text-left">
            <caption className="sr-only">Prices of each vehicle type</caption>
            <thead>
              <tr className="border-y border-line text-sm text-ink-muted">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Vehicle type
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium max-md:hidden">
                  Base fare
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium max-md:hidden">
                  Per mile
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium max-lg:hidden">
                  Minimum
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium max-lg:hidden">
                  Night
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium max-lg:hidden">
                  Airport
                </th>
                <th scope="col" className="py-3 pl-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-b border-line">
              {types.map((type) => (
                <Row key={type.id} type={type} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function Row({ type }: { type: VehicleTypePricing }) {
  const rule = type.pricingRule;
  const cell = 'px-3 py-4 text-right';

  return (
    <tr className="align-top">
      <th scope="row" className="py-4 pr-4 font-normal">
        <div className="space-y-1.5">
          <p className={`font-semibold break-words ${type.isActive ? '' : 'text-ink-muted'}`}>
            {type.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {rule ? null : <Badge variant="warning">No prices</Badge>}
            {type.isActive ? null : <Badge>Switched off</Badge>}
          </div>
          {/* On narrow screens the price columns fold in here. */}
          {rule ? (
            <p className="text-sm leading-relaxed text-ink-muted lg:hidden">
              <span className="md:hidden">
                {formatPence(rule.baseFarePence)} + {formatPence(rule.perMilePence)} a mile.{' '}
              </span>
              At least {formatPence(rule.minimumFarePence)}. Night +{rule.nightSurchargePercent}%.
              Airport +{formatPence(rule.airportFeePence)}.
            </p>
          ) : null}
        </div>
      </th>
      <td className={`${cell} max-md:hidden`}>{rule ? formatPence(rule.baseFarePence) : '-'}</td>
      <td className={`${cell} max-md:hidden`}>{rule ? formatPence(rule.perMilePence) : '-'}</td>
      <td className={`${cell} max-lg:hidden`}>{rule ? formatPence(rule.minimumFarePence) : '-'}</td>
      <td className={`${cell} max-lg:hidden`}>{rule ? `${rule.nightSurchargePercent}%` : '-'}</td>
      <td className={`${cell} max-lg:hidden`}>{rule ? formatPence(rule.airportFeePence) : '-'}</td>
      <td className="py-3 pl-3 text-right">
        <Link
          href={`/admin/pricing/${type.id}`}
          aria-label={`${rule ? 'Edit the prices of' : 'Set prices for'} ${type.name}`}
          className="btn btn-ghost min-h-11! px-4! py-0! text-sm whitespace-nowrap"
        >
          {rule ? 'Edit' : 'Set prices'}
        </Link>
      </td>
    </tr>
  );
}
