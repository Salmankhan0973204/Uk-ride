'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { checkMobile, formatMobile, normaliseMobile } from '@ukride/shared/phone';
import { AccountGate } from '@/features/auth/components/AccountGate';
import {
  FormAlert,
  StepLabel,
  commonProblem,
  fieldMessage,
  heading,
  textLink,
} from '@/features/auth/components/AuthParts';
import { CodeEntry } from '@/features/auth/components/CodeEntry';
import type { CodeSent, User } from '@/features/auth/types';
import type { ApiError } from '@/lib/api/client';
import { useChangeMobile, useSendMobileCode } from '../hooks/useProfileActions';
import { PROFILE_PATH } from '../paths';

/** A code sent, to which number, and when. */
type Sent = CodeSent & { mobile: string; at: number };

/** Turns a refusal of the new number into words for the mobile field. */
function mobileProblem(error: ApiError): string | undefined {
  if (error.code === 'CONFLICT') return 'This mobile number belongs to another account.';
  return fieldMessage(error, 'mobile');
}

export function ChangeMobileForm() {
  return <AccountGate>{(user) => <Form user={user} />}</AccountGate>;
}

/**
 * Changing the mobile, as on ukride.uk, in two steps:
 *   1. number  the new mobile, which gets a code by text
 *   2. code    the code is checked and the number is changed at once
 *
 * The old number keeps working until the code comes back, so a typo in the
 * new one costs nothing.
 */
function Form({ user }: { user: User }) {
  const formId = useId();
  const router = useRouter();
  const mobileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'number' | 'code'>('number');
  const [mobile, setMobile] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [sent, setSent] = useState<Sent>();

  const sendCode = useSendMobileCode();
  const changeMobile = useChangeMobile();

  function backToNumber(field?: string) {
    setStep('number');
    setFieldError(field);
    requestAnimationFrame(() => mobileRef.current?.focus());
  }

  async function handleNumber(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendCode.isPending) return;

    const problem =
      checkMobile(mobile) ??
      (normaliseMobile(mobile) === user.mobile ? 'This is already your mobile number.' : undefined);
    setFieldError(problem);
    setFormError(undefined);
    if (problem) return mobileRef.current?.focus();

    const number = normaliseMobile(mobile);
    setCodeError(undefined);

    // Back from step 2 with the same number, and its code still valid: no second text.
    if (sent?.mobile === number && Date.now() < sent.at + sent.expiresInSeconds * 1000) {
      return setStep('code');
    }

    try {
      const answer = await sendCode.mutateAsync(number);
      setSent({ ...answer, mobile: number, at: Date.now() });
      setStep('code');
    } catch (caught) {
      const error = caught as ApiError;
      const onField = mobileProblem(error);
      if (onField) return backToNumber(onField);
      setFormError(commonProblem(error, 'We could not send the code. Try again in a moment.'));
    }
  }

  async function handleCode(code: string) {
    if (!sent || changeMobile.isPending) return;
    setCodeError(undefined);
    try {
      await changeMobile.mutateAsync({ mobile: sent.mobile, code });
      router.push(`${PROFILE_PATH}?done=mobile`);
    } catch (caught) {
      const error = caught as ApiError;
      // Taken by someone else since the code was sent.
      const onField = mobileProblem(error);
      if (onField) return backToNumber(onField);
      setCodeError(
        fieldMessage(error, 'code') ??
          commonProblem(error, 'We could not check the code. Try again.'),
      );
    }
  }

  async function resend() {
    if (!sent || sendCode.isPending) return;
    setCodeError(undefined);
    try {
      const answer = await sendCode.mutateAsync(sent.mobile);
      setSent({ ...answer, mobile: sent.mobile, at: Date.now() });
    } catch (caught) {
      setCodeError(commonProblem(caught as ApiError, 'We could not send a new code. Try again.'));
    }
  }

  if (step === 'code' && sent) {
    return (
      <Card className="rise mx-auto max-w-md">
        <div className="space-y-7">
          <div className="space-y-2">
            <StepLabel step={2} of={2} />
            <h1 className={heading}>Check your phone</h1>
          </div>

          <CodeEntry
            key={sent.at}
            id={`${formId}-code`}
            sentTo={
              <span className="tabular font-medium whitespace-nowrap text-ink">
                {formatMobile(sent.mobile)}
              </span>
            }
            sentAt={sent.at}
            resendAfterSeconds={sent.resendAfterSeconds}
            onResend={resend}
            resending={sendCode.isPending}
            onSubmit={handleCode}
            checking={changeMobile.isPending}
            error={codeError}
            submitLabel="Change my mobile"
            checkingLabel="Changing your mobile"
          />

          <p className="-mt-2 text-sm text-ink-muted">
            Wrong number?{' '}
            <button type="button" onClick={() => backToNumber()} className={textLink}>
              Use a different number
            </button>
          </p>
        </div>
      </Card>
    );
  }

  const id = `${formId}-mobile`;
  const hint = 'Include the country code, like +44 7400 123456. We will text it a code.';

  return (
    <Card className="rise mx-auto max-w-md">
      <div className="space-y-7">
        <div className="space-y-2">
          <StepLabel step={1} of={2} />
          <h1 className={heading}>Change your mobile</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Your number now is{' '}
            <span className="tabular font-medium whitespace-nowrap text-ink">
              {formatMobile(user.mobile)}
            </span>
            . It stays until you confirm the new one with a code.
          </p>
        </div>

        <form noValidate onSubmit={handleNumber} className="space-y-5">
          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <Field id={id} label="New mobile number" hint={hint} error={fieldError}>
            <input
              ref={mobileRef}
              id={id}
              name="mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={mobile}
              onChange={(event) => {
                setMobile(event.target.value);
                if (fieldError) setFieldError(undefined);
              }}
              {...describedBy(id, { hint, error: fieldError })}
              className="control"
            />
          </Field>

          <div className="grid gap-3 pt-2 sm:flex sm:items-center">
            <button type="submit" disabled={sendCode.isPending} className="btn btn-primary">
              {sendCode.isPending ? (
                <>
                  <Spinner />
                  Sending the code
                </>
              ) : (
                'Send code'
              )}
            </button>
            <Link href={PROFILE_PATH} className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Card>
  );
}
