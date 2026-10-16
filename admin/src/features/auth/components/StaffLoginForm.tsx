'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { PasswordInput } from '@ukride/shared/ui/PasswordInput';
import { Spinner } from '@ukride/shared/ui/Spinner';
import type { ApiError } from '@/lib/api/client';
import { useStaff, useStaffLogin } from '../hooks/useStaff';

/** Where a signed-in staff member lands. */
const AFTER_LOGIN = '/vehicles';

type Errors = { email?: string; password?: string };

function readApiError(error: ApiError): string {
  // One answer for a wrong password and an unknown email, as on the customer site.
  if (error.status === 401) return 'Email or password is incorrect. Check both and try again.';
  if (error.status === 403) return 'This account is not staff, so it cannot use the admin panel.';
  if (error.status === 429) return error.message;
  if (error.isNetworkError)
    return 'We could not reach the server. Check your connection and try again.';
  return 'We could not sign you in. Try again in a moment.';
}

export function StaffLoginForm() {
  const formId = useId();
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();

  const { data: staff } = useStaff();
  const { mutate, isPending } = useStaffLogin();

  // Already signed in, or just signed in: nothing to do here.
  useEffect(() => {
    if (staff) router.replace(AFTER_LOGIN);
  }, [staff, router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const found: Errors = {};
    if (!email.trim()) found.email = 'Enter your email address.';
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
          setPassword('');
          passwordRef.current?.focus();
        },
      },
    );
  }

  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  return (
    <Card className="rise">
      <div className="space-y-7">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-muted">UkRide admin</p>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">Staff sign-in</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            For admins and dispatchers. Customers sign in on the UkRide website.
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
            <PasswordInput
              ref={passwordRef}
              id={passwordId}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
              }}
              {...describedBy(passwordId, { error: errors.password })}
            />
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
      </div>
    </Card>
  );
}
