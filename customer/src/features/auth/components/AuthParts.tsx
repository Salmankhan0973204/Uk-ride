import type { ApiError } from '@/lib/api/client';

/** Small pieces the sign-in, sign-up and forgot-password pages share. */

export const heading =
  'text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl';

export const textLink =
  'font-medium text-ink underline decoration-ring/70 decoration-2 underline-offset-4 hover:decoration-ring';

/** The same check as the API's, so most typos are caught before a request. */
export function checkEmail(value: string): string | undefined {
  if (!value.trim()) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return 'Enter a valid email address, like name@example.com.';
}

/** A problem with the whole form rather than one field. Announced when it appears. */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-2xl border border-danger/50 bg-[rgb(253_164_175/0.12)] px-4 py-3 text-sm leading-relaxed font-medium text-danger"
    >
      {children}
    </p>
  );
}

/** "Step 1 of 2", above the heading of a multi-step form. */
export function StepLabel({ step, of }: { step: number; of: number }) {
  return (
    <p className="text-sm font-medium text-ink-muted">
      Step {step} of {of}
    </p>
  );
}

/**
 * The words for failures every step can meet: no connection, too many tries
 * (the API's own message says how long to wait). Anything else gets `fallback`.
 */
export function commonProblem(error: ApiError, fallback: string): string {
  if (error.isNetworkError)
    return 'We could not reach the server. Check your connection and try again.';
  if (error.status === 429) return error.message;
  return fallback;
}

/** The first message the API gave for one field of a 400, with a full stop. */
export function fieldMessage(error: ApiError, field: string): string | undefined {
  if (error.code !== 'VALIDATION_ERROR') return;
  const message = (error.details as Record<string, string[] | undefined> | undefined)?.[field]?.[0];
  return message ? `${message.replace(/\.$/, '')}.` : undefined;
}
