'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { PasswordInput } from '@ukride/shared/ui/PasswordInput';
import { Spinner } from '@ukride/shared/ui/Spinner';
import type { ApiError } from '@/lib/api/client';
import { useForgotPassword, useResetPassword, useVerifyResetCode } from '../hooks/usePasswordReset';
import { MIN_PASSWORD, checkNewPassword } from '../validation';
import {
  FormAlert,
  StepLabel,
  checkEmail,
  commonProblem,
  fieldMessage,
  heading,
  textLink,
} from './AuthParts';
import { CodeEntry } from './CodeEntry';

/** Where the person lands, signed in, with a line saying what happened. */
const AFTER_RESET = '/profile?done=reset';

type Step = 'email' | 'code' | 'password';

/**
 * Forgot password, as on ukride.uk, in three steps:
 *   1. email     a 6-digit code is emailed, if the address has an account
 *   2. code      the code is checked
 *   3. password  the new password is saved, every device is signed out, and
 *                this one is signed in
 *
 * Step 2 never says whether the address has an account: the API answers the
 * same for every address, and so does this page.
 */
export function ForgotPasswordForm() {
  const formId = useId();
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [sent, setSent] = useState<{ at: number; resendAfterSeconds: number }>();
  const [ticket, setTicket] = useState<string>();

  const forgot = useForgotPassword();
  const verifyCode = useVerifyResetCode();
  const reset = useResetPassword();

  // Each step opens with focus on what to type next.
  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus();
  }, [step]);

  const typedEmail = email.trim();

  /** Back to step 1, for example when the ticket has run out. */
  function restart(message?: string) {
    setStep('email');
    setSent(undefined);
    setTicket(undefined);
    setPassword('');
    setFormError(message);
    requestAnimationFrame(() => emailRef.current?.focus());
  }

  async function sendCode() {
    const answer = await forgot.mutateAsync(typedEmail);
    setSent({ at: Date.now(), resendAfterSeconds: answer.resendAfterSeconds });
  }

  async function handleEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (forgot.isPending) return;

    const problem = checkEmail(email);
    setFieldError(problem);
    setFormError(undefined);
    if (problem) return emailRef.current?.focus();

    try {
      await sendCode();
      setCodeError(undefined);
      setStep('code');
    } catch (caught) {
      const error = caught as ApiError;
      const emailProblem = fieldMessage(error, 'email');
      if (emailProblem) {
        setFieldError(emailProblem);
        return emailRef.current?.focus();
      }
      setFormError(commonProblem(error, 'We could not send the code. Try again in a moment.'));
    }
  }

  async function handleCode(code: string) {
    if (verifyCode.isPending) return;
    setCodeError(undefined);
    try {
      const { ticket: value } = await verifyCode.mutateAsync({ email: typedEmail, code });
      setTicket(value);
      setFormError(undefined);
      setFieldError(undefined);
      setStep('password');
    } catch (caught) {
      const error = caught as ApiError;
      setCodeError(
        fieldMessage(error, 'code') ??
          commonProblem(error, 'We could not check the code. Try again.'),
      );
    }
  }

  async function resend() {
    if (forgot.isPending) return;
    setCodeError(undefined);
    try {
      await sendCode();
    } catch (caught) {
      setCodeError(commonProblem(caught as ApiError, 'We could not send a new code. Try again.'));
    }
  }

  async function handlePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reset.isPending || !ticket) return;

    const problem = checkNewPassword(password, 'Enter a new password.');
    setFieldError(problem);
    setFormError(undefined);
    if (problem) return passwordRef.current?.focus();

    try {
      await reset.mutateAsync({ email: typedEmail, otpTicket: ticket, password });
      router.replace(AFTER_RESET);
    } catch (caught) {
      const error = caught as ApiError;
      if (fieldMessage(error, 'otpTicket')) {
        return restart('That took longer than 15 minutes. Ask for a new code to carry on.');
      }
      const passwordProblem = fieldMessage(error, 'password');
      if (passwordProblem) {
        setFieldError(passwordProblem);
        return passwordRef.current?.focus();
      }
      setFormError(
        commonProblem(error, 'We could not change your password. Try again in a moment.'),
      );
    }
  }

  if (step === 'code' && sent) {
    return (
      <Card className="rise mx-auto max-w-md">
        <div className="space-y-7">
          <div className="space-y-2">
            <StepLabel step={2} of={3} />
            <h1 className={heading}>Check your email</h1>
          </div>

          <CodeEntry
            key={sent.at}
            id={`${formId}-code`}
            sentTo={
              <>
                <span className="font-medium break-all text-ink">{typedEmail}</span>, if it has a
                UkRide account
              </>
            }
            sentAt={sent.at}
            resendAfterSeconds={sent.resendAfterSeconds}
            onResend={resend}
            resending={forgot.isPending}
            onSubmit={handleCode}
            checking={verifyCode.isPending}
            error={codeError}
            submitLabel="Continue"
            checkingLabel="Checking the code"
          />

          <p className="-mt-2 text-sm text-ink-muted">
            Wrong address?{' '}
            <button type="button" onClick={() => restart()} className={textLink}>
              Use a different email
            </button>
          </p>
        </div>
      </Card>
    );
  }

  if (step === 'password' && ticket) {
    const id = `${formId}-password`;
    const hint = `At least ${MIN_PASSWORD} characters.`;

    return (
      <Card className="rise mx-auto max-w-md">
        <div className="space-y-7">
          <div className="space-y-2">
            <StepLabel step={3} of={3} />
            <h1 className={heading}>Choose a new password</h1>
            <p className="text-base leading-relaxed text-ink-muted">
              Every device signed in to your account will be signed out. You stay signed in here.
            </p>
          </div>

          <form noValidate onSubmit={handlePassword} className="space-y-5">
            {formError ? <FormAlert>{formError}</FormAlert> : null}

            {/* Lets a password manager save the new password against the right account. */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={typedEmail}
              readOnly
              hidden
            />

            <Field id={id} label="New password" hint={hint} error={fieldError}>
              <PasswordInput
                ref={passwordRef}
                id={id}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldError) setFieldError(undefined);
                }}
                {...describedBy(id, { hint, error: fieldError })}
              />
            </Field>

            <button
              type="submit"
              disabled={reset.isPending}
              className="btn btn-primary mt-2 w-full"
            >
              {reset.isPending ? (
                <>
                  <Spinner />
                  Saving your password
                </>
              ) : (
                'Save and sign in'
              )}
            </button>
          </form>
        </div>
      </Card>
    );
  }

  const id = `${formId}-email`;

  return (
    <Card className="rise mx-auto max-w-md">
      <div className="space-y-7">
        <div className="space-y-2">
          <StepLabel step={1} of={3} />
          <h1 className={heading}>Forgot your password?</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Enter the email you signed up with and we will send you a 6-digit code.
          </p>
        </div>

        <form noValidate onSubmit={handleEmail} className="space-y-5">
          {formError ? <FormAlert>{formError}</FormAlert> : null}

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

          <button type="submit" disabled={forgot.isPending} className="btn btn-primary mt-2 w-full">
            {forgot.isPending ? (
              <>
                <Spinner />
                Sending the code
              </>
            ) : (
              'Send code'
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
