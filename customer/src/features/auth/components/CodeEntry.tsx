'use client';

import { useEffect, useRef, useState } from 'react';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { textLink } from './AuthParts';

interface CodeEntryProps {
  id: string;
  /** Where the code went, as the person should read it. */
  sentTo: React.ReactNode;
  /** When the last code was sent and how long before another may be asked for. */
  sentAt: number;
  resendAfterSeconds: number;
  onResend: () => void;
  resending: boolean;
  onSubmit: (code: string) => void;
  checking: boolean;
  /** What went wrong with the code typed. Clears the box and focuses it. */
  error?: string;
  submitLabel: string;
  checkingLabel: string;
}

const CODE_LENGTH = 6;

/** Seconds until `until`, counting down once a second, stopping at zero. */
function useSecondsLeft(until: number) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);

  return Math.max(0, Math.ceil((until - now) / 1000));
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * Typing a 6-digit code, as on ukride.uk. One box, not six: it takes a paste,
 * the phone's "From Messages" suggestion (`one-time-code`) and a screen
 * reader without any juggling of focus. The code is sent as soon as the sixth
 * digit is in, and the button is there for anyone who prefers to press it.
 *
 * A new code can be asked for once the wait the API gave has passed.
 * The parent remounts this with a new `key` after each send, so the box
 * empties and the countdown starts again.
 */
export function CodeEntry({
  id,
  sentTo,
  sentAt,
  resendAfterSeconds,
  onResend,
  resending,
  onSubmit,
  checking,
  error,
  submitLabel,
  checkingLabel,
}: CodeEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<string>();
  /** The code last sent for checking, until the person types again. */
  const [sentCode, setSentCode] = useState<string>();
  const secondsLeft = useSecondsLeft(sentAt + resendAfterSeconds * 1000);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // A refused code is shown cleared, so the next try starts from an empty box,
  // and the API's message stays until the person starts typing again.
  const refused = error !== undefined && sentCode !== undefined;
  const value = refused ? '' : code;
  const shown = problem ?? (refused ? error : undefined);

  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);

  function submit(typed: string) {
    if (checking) return;
    if (typed.length !== CODE_LENGTH) {
      setProblem(`Enter all ${CODE_LENGTH} digits of the code.`);
      inputRef.current?.focus();
      return;
    }
    setSentCode(typed);
    onSubmit(typed);
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
      className="space-y-5"
    >
      <p className="text-base leading-relaxed text-ink-muted">
        We sent a {CODE_LENGTH}-digit code to {sentTo}. It lasts 10 minutes.
      </p>

      <Field id={id} label="Code" error={shown}>
        <input
          ref={inputRef}
          id={id}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          value={value}
          onChange={(event) => {
            // Spaces and dashes from a pasted "519 012" are dropped.
            const digits = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
            setCode(digits);
            setSentCode(undefined);
            setProblem(undefined);
            // The sixth digit sends it; editing a full code does not.
            if (digits.length === CODE_LENGTH && value.length < CODE_LENGTH) submit(digits);
          }}
          {...describedBy(id, { error: shown })}
          className="control tabular text-center text-2xl! tracking-[0.5em]"
        />
      </Field>

      <button type="submit" disabled={checking} className="btn btn-primary w-full">
        {checking ? (
          <>
            <Spinner />
            {checkingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>

      <p className="text-sm text-ink-muted">
        {secondsLeft > 0 ? (
          <>
            No code? You can ask for a new one{' '}
            <span className="tabular whitespace-nowrap">in {clock(secondsLeft)}</span>.
          </>
        ) : resending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            Sending a new code
          </span>
        ) : (
          <>
            No code?{' '}
            <button type="button" onClick={onResend} className={textLink}>
              Send a new code
            </button>
          </>
        )}
      </p>
    </form>
  );
}
