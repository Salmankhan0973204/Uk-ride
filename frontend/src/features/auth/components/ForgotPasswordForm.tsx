'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Field, describedBy } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { useForgotPassword } from '../hooks/useEmailActions';

const heading = 'text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl';
const textLink =
  'font-medium text-ink underline decoration-ring/70 decoration-2 underline-offset-4 hover:decoration-ring';

export function ForgotPasswordForm() {
  const id = `${useId()}-email`;
  const emailRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const { mutate, isPending, isSuccess, reset } = useForgotPassword();

  useEffect(() => {
    if (isSuccess) doneRef.current?.focus();
  }, [isSuccess]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const value = email.trim();
    const problem = !value
      ? 'Enter your email address.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? 'Enter a valid email address, like name@example.com.'
        : undefined;

    setFieldError(problem);
    setFormError(undefined);
    if (problem) return emailRef.current?.focus();

    mutate(value, {
      onError: (error) =>
        setFormError(
          error.status === 429
            ? error.message
            : error.isNetworkError
              ? 'We could not reach the server. Check your connection and try again.'
              : 'We could not send the link. Try again in a moment.',
        ),
    });
  }

  if (isSuccess) {
    return (
      <Card className="rise mx-auto max-w-md">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 ref={doneRef} tabIndex={-1} className={`${heading} outline-none`}>
              Check your email
            </h1>
            {/* The same words whether or not the address has an account, so this
                page cannot be used to find out who is registered. */}
            <p role="status" className="text-base leading-relaxed text-ink-muted">
              If <span className="font-medium break-all text-ink">{email.trim()}</span> has a UkRide
              account, we have sent it a link to choose a new password. The link lasts 1 hour.
            </p>
          </div>
          <p className="text-sm leading-relaxed text-ink-muted">
            Nothing arrived? Check the spelling above and your spam folder, then{' '}
            <button type="button" onClick={() => reset()} className={textLink}>
              try again
            </button>
            .
          </p>
          <Link href="/login" className="btn btn-ghost">
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rise mx-auto max-w-md">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className={heading}>Forgot your password?</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Enter the email you registered with and we will send you a link to choose a new one.
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

          <Field id={id} label="Email address" error={fieldError}>
            <input
              ref={emailRef}
              id={id}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldError) setFieldError(undefined);
              }}
              {...describedBy(id, { error: fieldError })}
              className="control"
            />
          </Field>

          <button type="submit" disabled={isPending} className="btn btn-primary mt-2 w-full">
            {isPending ? (
              <>
                <Spinner />
                Sending the link
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <p className="text-sm text-ink-muted">
          Remembered it?{' '}
          <Link href="/login" className={textLink}>
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
