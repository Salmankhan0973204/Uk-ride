'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import type { ApiError } from '@/lib/api/client';
import { useRegister } from '../hooks/useRegister';
import type { FieldErrors, RegisterInput } from '../types';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

type Errors = Partial<Record<keyof RegisterInput, string>>;

/** The same rules as the API, checked first so most mistakes never leave the browser. */
function checkFields({ email, password }: RegisterInput): Errors {
  const errors: Errors = {};

  if (!email) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Enter a valid email address, like name@example.com.';

  if (!password) errors.password = 'Enter a password.';
  else if (password.length < MIN_PASSWORD)
    errors.password = `Use at least ${MIN_PASSWORD} characters. You have ${password.length}.`;
  else if (password.length > MAX_PASSWORD)
    errors.password = `Use at most ${MAX_PASSWORD} characters.`;

  return errors;
}

/** Turns an API failure into messages placed where the user can act on them. */
function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'CONFLICT') {
    return { fields: { email: 'This email already has an account. Use a different email.' } };
  }

  if (error.code === 'VALIDATION_ERROR' && error.details) {
    const details = error.details as FieldErrors<RegisterInput>;
    return { fields: { email: details.email?.[0], password: details.password?.[0] } };
  }

  if (error.isNetworkError) {
    return {
      fields: {},
      form: 'We could not reach the server. Check your connection and try again.',
    };
  }

  return { fields: {}, form: 'We could not create your account. Try again in a moment.' };
}

const inputClass =
  'min-h-12 w-full rounded-lg border bg-surface px-3.5 text-base text-ink transition-colors placeholder:text-ink-muted';

function borderClass(hasError: boolean) {
  return hasError ? 'border-danger' : 'border-control hover:border-ink-muted focus:border-ink';
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-danger">
      {message}
    </p>
  );
}

export function RegisterForm() {
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();

  const { mutate, isPending, isSuccess, data } = useRegister();

  // After success the form is gone, so focus moves to the confirmation.
  useEffect(() => {
    if (isSuccess) doneRef.current?.focus();
  }, [isSuccess]);

  function showErrors(next: Errors) {
    setErrors(next);
    if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const input = { email: email.trim(), password };
    const found = checkFields(input);
    setFormError(undefined);

    if (found.email || found.password) {
      showErrors(found);
      return;
    }

    setErrors({});
    mutate(input, {
      onError: (error) => {
        const { fields, form } = readApiError(error);
        showErrors(fields);
        setFormError(form);
      },
    });
  }

  if (isSuccess) {
    return (
      <div className="register-done space-y-6">
        <div className="space-y-3">
          <h1
            ref={doneRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight text-balance outline-none sm:text-3xl"
          >
            Your account is ready
          </h1>
          <p role="status" className="text-base leading-relaxed text-ink-muted">
            We created an account for{' '}
            <span className="font-medium break-all text-ink">{data.user.email}</span>.
          </p>
        </div>

        <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-relaxed">
          Signing in is not available yet. It is the next part of UkRide to be built, and this
          account will work with it.
        </p>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const emailErrorId = `${id}-email-error`;
  const passwordHintId = `${id}-password-hint`;
  const passwordErrorId = `${id}-password-error`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Create your account
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">
          An email address and a password are all you need.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        {formError ? (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-4 py-3 text-sm leading-relaxed font-medium text-danger"
          >
            {formError}
          </p>
        ) : null}

        <div className="space-y-2">
          <label htmlFor={`${id}-email`} className="block text-sm font-medium">
            Email address
          </label>
          <input
            ref={emailRef}
            id={`${id}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? emailErrorId : undefined}
            className={`${inputClass} ${borderClass(Boolean(errors.email))}`}
          />
          <FieldError id={emailErrorId} message={errors.email} />
        </div>

        <div className="space-y-2">
          <label htmlFor={`${id}-password`} className="block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              id={`${id}-password`}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck={false}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? passwordErrorId : passwordHintId}
              className={`${inputClass} pr-20 ${borderClass(Boolean(errors.password))}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0.5 right-0.5 min-w-16 rounded-md px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password ? (
            <FieldError id={passwordErrorId} message={errors.password} />
          ) : (
            <p id={passwordHintId} className="text-sm text-ink-muted">
              At least {MIN_PASSWORD} characters.
            </p>
          )}
        </div>

        <button
          type="submit"
          aria-disabled={isPending}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand px-5 text-base font-medium text-brand-ink transition-opacity hover:opacity-90 aria-disabled:cursor-progress aria-disabled:opacity-70 sm:w-auto sm:min-w-48"
        >
          {isPending ? 'Creating your account' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
