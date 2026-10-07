'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Field, controlClass, describedBy } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiError } from '@/lib/api/client';
import { useRegister } from '../hooks/useRegister';
import { GENDER_OPTIONS } from '../types';
import type { FieldErrors, Gender, RegisterInput } from '../types';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

/** Everything the form holds. Gender is '' until the customer picks one. */
type Values = Omit<RegisterInput, 'gender'> & { gender: Gender | '' };
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

/** Top to bottom, as on screen. Focus goes to the first one with an error. */
const FIELD_ORDER: FieldName[] = ['firstName', 'lastName', 'email', 'mobile', 'gender', 'password'];

const EMPTY: Values = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  gender: '',
  password: '',
};

// The same rules as the API, so most mistakes never leave the browser.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

/** "0044 (7400) 123-456" and "+44 7400 123456" both become "+447400123456". */
function normaliseMobile(value: string) {
  return value.replace(/[\s().-]/g, '').replace(/^00/, '+');
}

function checkName(value: string, label: string) {
  const name = value.trim();
  if (!name) return `Enter your ${label}.`;
  if (name.length > 50) return `Use at most 50 characters for your ${label}.`;
  if (!NAME_PATTERN.test(name))
    return 'Use letters only. Spaces, hyphens and apostrophes are fine.';
}

function checkField(name: FieldName, values: Values): string | undefined {
  const value = values[name];

  switch (name) {
    case 'firstName':
      return checkName(value, 'first name');
    case 'lastName':
      return checkName(value, 'last name');
    case 'email':
      if (!value.trim()) return 'Enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return 'Enter a valid email address, like name@example.com.';
      return;
    case 'mobile':
      if (!value.trim()) return 'Enter your mobile number.';
      if (!/^\+[1-9]\d{7,14}$/.test(normaliseMobile(value)))
        return 'Start with the country code, like +44 7400 123456.';
      return;
    case 'password':
      if (!value) return 'Enter a password.';
      if (value.length < MIN_PASSWORD)
        return `Use at least ${MIN_PASSWORD} characters. You have ${value.length}.`;
      if (value.length > MAX_PASSWORD) return `Use at most ${MAX_PASSWORD} characters.`;
      return;
    case 'gender':
      return;
  }
}

function checkAll(values: Values): Errors {
  const errors: Errors = {};
  for (const name of FIELD_ORDER) {
    const message = checkField(name, values);
    if (message) errors[name] = message;
  }
  return errors;
}

/** Turns an API failure into messages placed where the user can act on them. */
function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'CONFLICT') {
    const field = (error.details as { field?: string } | undefined)?.field;
    if (field === 'mobile') {
      return {
        fields: { mobile: 'This mobile number already has an account. Use a different number.' },
      };
    }
    if (field === 'email') {
      return { fields: { email: 'This email already has an account. Use a different email.' } };
    }
    return { fields: {}, form: 'An account with these details already exists.' };
  }

  if (error.code === 'VALIDATION_ERROR' && error.details) {
    const details = error.details as FieldErrors<RegisterInput>;
    const fields: Errors = {};
    for (const name of FIELD_ORDER) {
      const message = details[name]?.[0];
      if (message) fields[name] = `${message}.`;
    }
    return { fields };
  }

  if (error.isNetworkError) {
    return {
      fields: {},
      form: 'We could not reach the server. Check your connection and try again.',
    };
  }

  return { fields: {}, form: 'We could not create your account. Try again in a moment.' };
}

export function RegisterForm() {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending, isSuccess, data } = useRegister();

  // After success the form is gone, so focus moves to the confirmation.
  useEffect(() => {
    if (isSuccess) doneRef.current?.focus();
  }, [isSuccess]);

  const id = (name: FieldName) => `${formId}-${name}`;

  /** Props shared by every control: value, change and blur handling, error wiring. */
  function control(name: FieldName, hint?: string) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
        // A message disappears as soon as the user starts correcting the field.
        if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
      },
      // Checked when the user leaves the field, not on every key press.
      onBlur: () => {
        if (!values[name]) return;
        setErrors((current) => ({ ...current, [name]: checkField(name, values) }));
      },
      ...describedBy(id(name), { hint, error: errors[name] }),
      className: controlClass(Boolean(errors[name])),
    };
  }

  function showErrors(next: Errors) {
    setErrors(next);
    const first = FIELD_ORDER.find((name) => next[name]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setFormError(undefined);
    const found = checkAll(values);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }

    setErrors({});
    mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        mobile: normaliseMobile(values.mobile),
        password: values.password,
        ...(values.gender ? { gender: values.gender } : {}),
      },
      {
        onError: (error) => {
          const { fields, form } = readApiError(error);
          showErrors(fields);
          setFormError(form);
        },
      },
    );
  }

  if (isSuccess) {
    const { user } = data;

    return (
      <Card className="register-done">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <h1
              ref={doneRef}
              tabIndex={-1}
              className="text-2xl font-semibold tracking-tight text-balance outline-none sm:text-3xl"
            >
              Your account is ready, {user.firstName}
            </h1>
            <p role="status" className="text-base leading-relaxed text-ink-muted">
              We created your UkRide account with these details.
            </p>
          </div>

          <dl className="divide-y divide-line border-y border-line text-sm">
            {[
              ['Name', `${user.firstName} ${user.lastName}`],
              ['Email', user.email],
              ['Mobile', user.mobile],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="text-right font-medium break-all">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="text-sm leading-relaxed text-ink-muted">
            Signing in is not available yet. It is the next part of UkRide to be built, and this
            account will work with it.
          </p>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-ink transition-opacity duration-200 hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
      </Card>
    );
  }

  const mobileHint = 'Include the country code, like +44 7400 123456.';
  const passwordHint = `At least ${MIN_PASSWORD} characters.`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Create your account
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">
          Tell us who you are and choose a password.
        </p>
      </div>

      <Card>
        <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-6">
          {formError ? (
            <p
              role="alert"
              className="rounded-lg bg-danger-soft px-4 py-3 text-sm leading-relaxed font-medium text-danger"
            >
              {formError}
            </p>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            <Field id={id('firstName')} label="First name" error={errors.firstName}>
              <input {...control('firstName')} type="text" autoComplete="given-name" />
            </Field>
            <Field id={id('lastName')} label="Last name" error={errors.lastName}>
              <input {...control('lastName')} type="text" autoComplete="family-name" />
            </Field>
          </div>

          <Field id={id('email')} label="Email address" error={errors.email}>
            <input
              {...control('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>

          <Field id={id('mobile')} label="Mobile number" hint={mobileHint} error={errors.mobile}>
            <input
              {...control('mobile', mobileHint)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>

          <Field id={id('gender')} label="Gender" optional error={errors.gender}>
            <select {...control('gender')} autoComplete="sex">
              <option value="">Select</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id={id('password')} label="Password" hint={passwordHint} error={errors.password}>
            <div className="relative">
              <input
                {...control('password', passwordHint)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                className={`${controlClass(Boolean(errors.password))} pr-20`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0.5 right-0.5 min-w-16 rounded-md px-3 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-neutral-soft hover:text-ink"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-brand px-5 text-base font-medium text-brand-ink transition-opacity duration-200 hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Spinner className="h-5 w-5 text-brand-ink!" />
                Creating your account
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}
