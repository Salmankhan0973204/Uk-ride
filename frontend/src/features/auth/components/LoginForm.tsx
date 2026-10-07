'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Field, describedBy } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiError } from '@/lib/api/client';
import { useLogin } from '../hooks/useLogin';
import { useMe } from '../hooks/useMe';

/** Where a signed-in user lands. */
const AFTER_LOGIN = '/account';

type Errors = { email?: string; password?: string };

/** Turns an API failure into a message the user can act on. */
function readApiError(error: ApiError): string {
  // The API gives one answer for a wrong password and for an unknown email,
  // on purpose, so this message cannot say which it was either.
  if (error.status === 401) return 'Email or password is incorrect. Check both and try again.';
  if (error.isNetworkError)
    return 'We could not reach the server. Check your connection and try again.';
  return 'We could not sign you in. Try again in a moment.';
}

export function LoginForm() {
  const formId = useId();
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();

  const { data: user } = useMe();
  const { mutate, isPending } = useLogin();

  // Already signed in, or just signed in: there is nothing to do on this page.
  useEffect(() => {
    if (user) router.replace(AFTER_LOGIN);
  }, [user, router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const found: Errors = {};
    if (!email.trim()) found.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      found.email = 'Enter a valid email address, like name@example.com.';
    if (!password) found.password = 'Enter your password.';

    setErrors(found);
    setFormError(undefined);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();

    mutate(
      { email: email.trim(), password },
      {
        onError: (error) => {
          setFormError(readApiError(error));
          // The password is the likelier mistake, and it has to be retyped anyway.
          setPassword('');
          passwordRef.current?.focus();
        },
      },
    );
  }

  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  return (
    <Card className="rise mx-auto max-w-md">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Sign in
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Use the email and password you registered with.
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          {formError ? (
            <p
              role="alert"
              className="rounded-2xl border border-danger/50 bg-[rgb(253_164_175/0.12)] px-4 py-3 text-sm leading-relaxed font-medium text-danger"
            >
              {formError}
            </p>
          ) : null}

          <Field id={emailId} label="Email address" error={errors.email}>
            <input
              ref={emailRef}
              id={emailId}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
              }}
              {...describedBy(emailId, { error: errors.email })}
              className="control"
            />
          </Field>

          <Field id={passwordId} label="Password" error={errors.password}>
            <div className="relative">
              <input
                ref={passwordRef}
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck={false}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errors.password)
                    setErrors((current) => ({ ...current, password: undefined }));
                }}
                {...describedBy(passwordId, { error: errors.password })}
                className="control pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0.5 right-0.5 min-w-16 rounded-xl px-3 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-glass-strong hover:text-ink"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <button type="submit" disabled={isPending} className="btn btn-primary mt-2 w-full">
            {isPending ? (
              <>
                <Spinner />
                Signing you in
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-sm text-ink-muted">
          New to UkRide?{' '}
          <Link
            href="/register"
            className="font-medium text-ink underline decoration-ring/70 decoration-2 underline-offset-4 hover:decoration-ring"
          >
            Create an account
          </Link>
        </p>
      </div>
    </Card>
  );
}
