'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Field, describedBy, fieldIds } from '@ukride/shared/ui/Field';
import { PasswordInput } from '@ukride/shared/ui/PasswordInput';
import { Select } from '@ukride/shared/ui/Select';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { checkMobile, formatMobile, normaliseMobile } from '@ukride/shared/phone';
import type { ApiError } from '@/lib/api/client';
import { useMe } from '../hooks/useMe';
import {
  useCheckEmail,
  useRegister,
  useSendSignupCode,
  useVerifySignupCode,
} from '../hooks/useSignup';
import { GENDER_OPTIONS } from '../types';
import type { CodeSent, Gender, RegisterInput } from '../types';
import { MIN_PASSWORD, checkName, checkNewPassword } from '../validation';
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

/** Where a new account lands, with a welcome line. */
const AFTER_SIGNUP = '/profile?done=welcome';

/** Everything step 1 holds. Gender is '' until the customer picks one. */
type Values = Omit<RegisterInput, 'gender' | 'otpTicket'> & { gender: Gender | '' };
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

function checkField(name: FieldName, values: Values): string | undefined {
  const value = values[name];
  switch (name) {
    case 'firstName':
      return checkName(value, 'first name');
    case 'lastName':
      return checkName(value, 'last name');
    case 'email':
      return checkEmail(value);
    case 'mobile':
      return checkMobile(value);
    case 'password':
      return checkNewPassword(value);
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

/** A taken email or mobile, from any of the requests, placed on its field. */
function takenField(error: ApiError): Errors | undefined {
  if (error.code !== 'CONFLICT') return;
  const field = (error.details as { field?: string } | undefined)?.field;
  if (field === 'mobile') return { mobile: 'This mobile number already has an account.' };
  if (field === 'email') return { email: 'This email already has an account.' };
}

/** A code sent, to which number, and when: enough to go back and forth without resending. */
type Sent = CodeSent & { mobile: string; at: number };

/**
 * Sign-up, as on ukride.uk, in two steps:
 *   1. details   name, email, mobile, gender, password. Continuing checks the
 *                email is free and sends a code to the mobile by text.
 *   2. code      the code is checked, the account is created, and the person
 *                is signed in.
 *
 * Going back to fix a detail keeps the code already sent (and the ticket, once
 * the code is checked), as long as the mobile is not changed.
 */
export function SignupForm() {
  const formId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Set once the account exists, so the "already signed in" redirect stays out of the way. */
  const finishing = useRef(false);

  const [step, setStep] = useState<'details' | 'code'>('details');
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [sent, setSent] = useState<Sent>();
  const [ticket, setTicket] = useState<{ mobile: string; value: string }>();

  const { data: user } = useMe();
  const checkEmailFree = useCheckEmail();
  const sendCode = useSendSignupCode();
  const verifyCode = useVerifySignupCode();
  const register = useRegister();
  const busy =
    checkEmailFree.isPending || sendCode.isPending || verifyCode.isPending || register.isPending;

  // Signed in already: there is nothing to sign up for.
  useEffect(() => {
    if (user && !finishing.current) router.replace('/profile');
  }, [user, router]);

  const id = (name: FieldName) => `${formId}-${name}`;

  function setValue(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  /** Props shared by every text input: value, change and blur handling, error wiring. */
  function input(name: Exclude<FieldName, 'gender'>, hint?: string) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value),
      // Checked when the person leaves the field, not on every key press.
      onBlur: () => {
        if (!values[name]) return;
        setErrors((current) => ({ ...current, [name]: checkField(name, values) }));
      },
      ...describedBy(id(name), { hint, error: errors[name] }),
    };
  }

  /** Back to step 1 with these messages, focusing the first field that has one. */
  function showDetails(fields: Errors, form?: string) {
    setStep('details');
    setErrors(fields);
    setFormError(form);
    const first = FIELD_ORDER.find((name) => fields[name]);
    requestAnimationFrame(() => {
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      else headingRef.current?.focus();
    });
  }

  function goToCode(next: Sent) {
    setSent(next);
    setCodeError(undefined);
    setFormError(undefined);
    setStep('code');
  }

  async function createAccount(otpTicket: string) {
    finishing.current = true;
    try {
      await register.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        mobile: normaliseMobile(values.mobile),
        password: values.password,
        ...(values.gender ? { gender: values.gender } : {}),
        otpTicket,
      });
      router.replace(AFTER_SIGNUP);
    } catch (caught) {
      finishing.current = false;
      const error = caught as ApiError;
      const taken = takenField(error);
      if (taken) return showDetails(taken);

      // The ticket ran out or was used: a new code is needed.
      if (fieldMessage(error, 'otpTicket')) {
        setTicket(undefined);
        setSent(undefined);
        return showDetails({}, 'Checking your code took too long. Continue to get a new code.');
      }

      const fields: Errors = {};
      for (const name of FIELD_ORDER) {
        const message = fieldMessage(error, name);
        if (message) fields[name] = message;
      }
      if (Object.keys(fields).length > 0) return showDetails(fields);
      showDetails(
        {},
        commonProblem(error, 'We could not create your account. Try again in a moment.'),
      );
    }
  }

  async function handleDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const found = checkAll(values);
    if (Object.keys(found).length > 0) return showDetails(found);
    setErrors({});
    setFormError(undefined);

    const mobile = normaliseMobile(values.mobile);

    // Back from step 2 with the mobile unchanged: nothing to send again.
    if (ticket?.mobile === mobile) return createAccount(ticket.value);

    try {
      const { available } = await checkEmailFree.mutateAsync(values.email.trim());
      if (!available) return showDetails({ email: 'This email already has an account.' });

      if (sent?.mobile === mobile && Date.now() < sent.at + sent.expiresInSeconds * 1000) {
        return goToCode(sent);
      }
      const answer = await sendCode.mutateAsync(mobile);
      goToCode({ ...answer, mobile, at: Date.now() });
    } catch (caught) {
      const error = caught as ApiError;
      const taken = takenField(error);
      if (taken) return showDetails(taken);
      const mobileProblem = fieldMessage(error, 'mobile');
      if (mobileProblem) return showDetails({ mobile: mobileProblem });
      showDetails({}, commonProblem(error, 'We could not send the code. Try again in a moment.'));
    }
  }

  async function handleCode(code: string) {
    if (!sent || busy) return;
    setCodeError(undefined);
    try {
      const { ticket: value } = await verifyCode.mutateAsync({ mobile: sent.mobile, code });
      setTicket({ mobile: sent.mobile, value });
      await createAccount(value);
    } catch (caught) {
      const error = caught as ApiError;
      setCodeError(
        fieldMessage(error, 'code') ??
          commonProblem(error, 'We could not check the code. Try again.'),
      );
    }
  }

  async function resend() {
    if (!sent || busy) return;
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
            checking={verifyCode.isPending || register.isPending}
            error={codeError}
            submitLabel="Create account"
            checkingLabel={register.isPending ? 'Creating your account' : 'Checking the code'}
          />

          <p className="-mt-2 text-sm text-ink-muted">
            Wrong number?{' '}
            <button type="button" onClick={() => showDetails({})} className={textLink}>
              Change your details
            </button>
          </p>
        </div>
      </Card>
    );
  }

  const mobileHint = 'Include the country code, like +44 7400 123456. We will text you a code.';
  const passwordHint = `At least ${MIN_PASSWORD} characters.`;

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        <div className="space-y-2">
          <StepLabel step={1} of={2} />
          <h1 ref={headingRef} tabIndex={-1} className={`${heading} outline-none`}>
            Create your account
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Tell us who you are and choose a password. Then we text your mobile a code.
          </p>
        </div>

        <form ref={formRef} noValidate onSubmit={handleDetails} className="space-y-5">
          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field id={id('firstName')} label="First name" error={errors.firstName}>
              <input
                {...input('firstName')}
                type="text"
                autoComplete="given-name"
                className="control"
              />
            </Field>
            <Field id={id('lastName')} label="Last name" error={errors.lastName}>
              <input
                {...input('lastName')}
                type="text"
                autoComplete="family-name"
                className="control"
              />
            </Field>
          </div>

          <Field id={id('email')} label="Email address" error={errors.email}>
            <input
              {...input('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              className="control"
            />
          </Field>
          {errors.email === 'This email already has an account.' ? (
            <p className="-mt-3 text-sm text-ink-muted">
              Is it yours?{' '}
              <Link href="/login" className={textLink}>
                Sign in
              </Link>{' '}
              or{' '}
              <Link href="/forgot-password" className={textLink}>
                reset the password
              </Link>
              .
            </p>
          ) : null}

          <Field id={id('mobile')} label="Mobile number" hint={mobileHint} error={errors.mobile}>
            <input
              {...input('mobile', mobileHint)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="control"
            />
          </Field>

          <Field id={id('gender')} label="Gender" optional error={errors.gender}>
            <Select
              id={id('gender')}
              name="gender"
              labelId={fieldIds(id('gender')).label}
              value={values.gender}
              options={GENDER_OPTIONS}
              onChange={(value) => setValue('gender', value)}
              clearLabel="No answer"
              {...describedBy(id('gender'), { error: errors.gender })}
            />
          </Field>

          <Field id={id('password')} label="Password" hint={passwordHint} error={errors.password}>
            <PasswordInput {...input('password', passwordHint)} autoComplete="new-password" />
          </Field>

          <button type="submit" disabled={busy} className="btn btn-primary mt-2 w-full">
            {busy ? (
              <>
                <Spinner />
                {register.isPending ? 'Creating your account' : 'Sending your code'}
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <p className="text-sm text-ink-muted">
          Already have an account?{' '}
          <Link href="/login" className={textLink}>
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
