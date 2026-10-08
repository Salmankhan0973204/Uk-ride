'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Field, describedBy } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { useResetPassword } from '../hooks/useEmailActions';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;
const heading = 'text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl';

/** Where the link in the reset email lands: choose a new password. */
export function ResetPasswordForm() {
  const id = `${useId()}-password`;
  const token = useSearchParams().get('token');
  const passwordRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  /** The API said the link itself is no good; the form cannot help any more. */
  const [linkDead, setLinkDead] = useState(false);
  const { mutate, isPending, isSuccess } = useResetPassword();

  useEffect(() => {
    if (isSuccess) doneRef.current?.focus();
  }, [isSuccess]);

  if (!token || linkDead) {
    return (
      <Card className="rise mx-auto max-w-md">
        <div role="alert" className="space-y-6">
          <div className="space-y-2">
            <h1 className={heading}>This link did not work</h1>
            <p className="text-base leading-relaxed text-ink-muted">
              It may have expired, or been used already. A reset link works once and lasts 1 hour.
              Your password has not been changed.
            </p>
          </div>
          <Link href="/forgot-password" className="btn btn-primary">
            Send a new link
          </Link>
        </div>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="rise mx-auto max-w-md">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 ref={doneRef} tabIndex={-1} className={`${heading} outline-none`}>
              Password changed
            </h1>
            <p role="status" className="text-base leading-relaxed text-ink-muted">
              You have been signed out on every device. Sign in with your new password.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </Card>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !token) return;

    const problem = !password
      ? 'Enter a new password.'
      : password.length < MIN_PASSWORD
        ? `Use at least ${MIN_PASSWORD} characters. You have ${password.length}.`
        : password.length > MAX_PASSWORD
          ? `Use at most ${MAX_PASSWORD} characters.`
          : undefined;

    setFieldError(problem);
    setFormError(undefined);
    if (problem) return passwordRef.current?.focus();

    mutate(
      { token, password },
      {
        onError: (error) => {
          if (error.status === 429) return setFormError(error.message);
          if (error.isNetworkError)
            return setFormError(
              'We could not reach the server. Check your connection and try again.',
            );
          if (error.code === 'VALIDATION_ERROR') {
            const message = (error.details as { password?: string[] } | undefined)?.password?.[0];
            if (message) {
              setFieldError(`${message}.`);
              return passwordRef.current?.focus();
            }
          }
          // Anything else from this endpoint means the link is not usable.
          setLinkDead(true);
        },
      },
    );
  }

  const hint = `At least ${MIN_PASSWORD} characters.`;

  return (
    <Card className="rise mx-auto max-w-md">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className={heading}>Choose a new password</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Saving it signs you out on every device.
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

          <Field id={id} label="New password" hint={hint} error={fieldError}>
            <div className="relative">
              <input
                ref={passwordRef}
                id={id}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldError) setFieldError(undefined);
                }}
                {...describedBy(id, { hint, error: fieldError })}
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
                Saving your password
              </>
            ) : (
              'Save new password'
            )}
          </button>
        </form>
      </div>
    </Card>
  );
}
