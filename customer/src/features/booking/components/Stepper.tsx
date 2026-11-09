'use client';

import { useId } from 'react';

interface StepperProps {
  label: string;
  /** The word for one, for the buttons' names: "passenger" → "One more passenger". */
  word: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const BUTTON =
  'grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-glass-border bg-glass transition-colors duration-150 hover:bg-glass-strong disabled:cursor-not-allowed disabled:opacity-40';

/**
 * A number chosen with − and + buttons, as on ukride.uk's passenger and
 * luggage counts. Both buttons are 44px targets; the number is announced
 * when it changes. At either end the button that goes nowhere is disabled.
 */
export function Stepper({ label, word, value, min, max, onChange }: StepperProps) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className="space-y-2">
      <p id={labelId} className="text-sm font-medium">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`One ${word} fewer`}
          className={BUTTON}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M6 12h12" />
          </svg>
        </button>
        <output aria-live="polite" className="tabular w-8 text-center text-lg font-semibold">
          {value}
        </output>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`One more ${word}`}
          className={BUTTON}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M12 6v12M6 12h12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
