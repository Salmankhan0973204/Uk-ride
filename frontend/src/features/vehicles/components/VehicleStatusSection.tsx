'use client';

import { useId, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { statusLabel } from '../format';
import { useChangeVehicleStatus } from '../hooks/useVehicleActions';
import { VEHICLE_STATUSES } from '../types';
import type { Vehicle, VehicleStatus } from '../types';
import { StatusBadge } from './AdminVehicles';

/** What each status means, in the words an operator would use. */
const MEANING: Record<VehicleStatus, string> = {
  ACTIVE: 'In service. It can be given jobs.',
  MAINTENANCE: 'In the garage for now. It cannot be given jobs until it is back.',
  RETIRED: 'Left the fleet. It is kept so past trips can still name it, and can be brought back.',
};

/**
 * Changing the status is its own action, not part of the form above: it is
 * saved on its own, at once, and does not wait for the other fields.
 *
 * Choosing an option changes nothing yet. The button names what will happen
 * ("Retire SK24 SUP"), and retiring adds a sentence on what that means, so a
 * slip of the finger on the radio buttons cannot take a car out of service.
 */
export function VehicleStatusSection({ vehicle, plate }: { vehicle: Vehicle; plate: string }) {
  const groupId = useId();
  const [chosen, setChosen] = useState<VehicleStatus>(vehicle.status);
  const [saved, setSaved] = useState<VehicleStatus>();
  const change = useChangeVehicleStatus();

  const unchanged = chosen === vehicle.status;
  const action =
    chosen === 'RETIRED'
      ? `Retire ${plate}`
      : chosen === 'MAINTENANCE'
        ? 'Send to maintenance'
        : vehicle.status === 'RETIRED'
          ? 'Bring back into service'
          : 'Put back in service';

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unchanged || change.isPending) return;
    setSaved(undefined);
    change.mutate(
      { id: vehicle.id, status: chosen },
      { onSuccess: ({ vehicle: updated }) => setSaved(updated.status) },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 border-t border-line pt-7">
      <fieldset className="space-y-4">
        <legend className="flex flex-wrap items-center gap-3">
          <span className="text-xl font-semibold tracking-tight">Status</span>
          <StatusBadge status={vehicle.status} />
        </legend>

        {saved ? (
          <p
            role="status"
            className="rounded-2xl border border-success/50 bg-[rgb(110_231_183/0.12)] px-4 py-3 text-sm leading-relaxed font-medium"
          >
            The status is now {statusLabel(saved).toLowerCase()}.
          </p>
        ) : null}

        {/* Rows split by lines, not cards inside the card. */}
        <div className="divide-y divide-line border-y border-line">
          {VEHICLE_STATUSES.map(({ value, label }) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 py-3.5">
              <input
                type="radio"
                name={`${groupId}-status`}
                value={value}
                checked={chosen === value}
                onChange={() => {
                  setChosen(value);
                  setSaved(undefined);
                  change.reset();
                }}
                // Drawn by hand: the browser default is a dark disc that is hard to see on glass.
                className="mt-0.5 h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-ink-muted bg-transparent transition-[border] duration-150 checked:border-[6px] checked:border-ring"
              />
              <span className="space-y-0.5">
                <span className="block font-medium">
                  {label}
                  {value === vehicle.status ? (
                    <span className="font-normal text-ink-muted"> (now)</span>
                  ) : null}
                </span>
                <span className="block text-sm leading-relaxed text-ink-muted">
                  {MEANING[value]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {chosen === 'RETIRED' && !unchanged ? (
        <p className="rounded-2xl border border-warning/50 bg-[rgb(252_211_77/0.12)] px-4 py-3 text-sm leading-relaxed">
          <span className="font-semibold">Retire {plate}?</span> It will leave the fleet and can no
          longer be given jobs. You can bring it back later.
        </p>
      ) : null}

      {change.isError ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {change.error.isNetworkError
            ? 'We could not reach the server, so the status was not changed. Try again.'
            : 'We could not change the status. Try again in a moment.'}
        </p>
      ) : null}

      {/* A glass button: the page's one accent button is "Save changes" above. */}
      <button
        type="submit"
        disabled={unchanged || change.isPending}
        aria-disabled={unchanged || undefined}
        className="btn btn-ghost max-sm:w-full"
      >
        {change.isPending ? (
          <>
            <Spinner />
            Changing the status
          </>
        ) : unchanged ? (
          'Choose a new status'
        ) : (
          action
        )}
      </button>
    </form>
  );
}
