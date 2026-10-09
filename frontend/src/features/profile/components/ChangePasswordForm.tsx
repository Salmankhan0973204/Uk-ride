'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Field, describedBy } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Spinner } from '@/components/ui/Spinner';
import { AccountGate } from '@/features/auth/components/AccountGate';
import { MIN_PASSWORD, checkNewPassword } from '@/features/auth/validation';
import type { ApiError } from '@/lib/api/client';
import { useChangePassword } from '../hooks/useProfileActions';

type FieldName = 'currentPassword' | 'newPassword';
type Errors = Partial<Record<FieldName, string>>;

/** Turns an API failure into messages placed where the user can act on them. */
function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'VALIDATION_ERROR') {
    const details = (error.details ?? {}) as Partial<Record<FieldName, string[]>>;
    const fields: Errors = {};
    // The API's own wording for this one is already a full sentence.
    if (details.currentPassword?.[0])
      fields.currentPassword = 'That is not your current password. Check it and try again.';
    if (details.newPassword?.[0]) fields.newPassword = `${details.newPassword[0]}.`;
    if (Object.keys(fields).length > 0) return { fields };
  }
  // Too many wrong attempts. The API's message says how long to wait.
  if (error.status === 429) return { fields: {}, form: error.message };
  if (error.isNetworkError) {
    return {
      fields: {},
      form: 'We could not reach the server. Check your connection and try again.',
    };
  }
  return { fields: {}, form: 'We could not change your password. Try again in a moment.' };
}

export function ChangePasswordForm() {
  return <AccountGate>{() => <Form />}</AccountGate>;
}

function Form() {
  const formId = useId();
  const router = useRouter();
  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const { mutate, isPending } = useChangePassword();

  const currentId = `${formId}-current`;
  const newId = `${formId}-new`;

  function showErrors(next: Errors) {
    setErrors(next);
    if (next.currentPassword) currentRef.current?.focus();
    else if (next.newPassword) newRef.current?.focus();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const found: Errors = {};
    if (!currentPassword) found.currentPassword = 'Enter your current password.';
    const problem = checkNewPassword(newPassword, 'Enter a new password.');
    if (problem) found.newPassword = problem;
    else if (currentPassword && newPassword === currentPassword)
      found.newPassword = 'Choose a password that is different from your current one.';

    setFormError(undefined);
    if (found.currentPassword || found.newPassword) return showErrors(found);

    setErrors({});
    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => router.push('/account?done=password'),
        onError: (error) => {
          const { fields, form } = readApiError(error);
          // A wrong current password has to be typed again anyway.
          if (fields.currentPassword) setCurrentPassword('');
          showErrors(fields);
          setFormError(form);
        },
      },
    );
  }

  const hint = `At least ${MIN_PASSWORD} characters.`;

  return (
    <Card className="rise mx-auto max-w-md">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Change your password
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            You stay signed in here. Every other device is signed out.
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

          <Field id={currentId} label="Current password" error={errors.currentPassword}>
            <PasswordInput
              ref={currentRef}
              id={currentId}
              name="currentPassword"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                if (errors.currentPassword)
                  setErrors((current) => ({ ...current, currentPassword: undefined }));
              }}
              {...describedBy(currentId, { error: errors.currentPassword })}
            />
          </Field>

          <Field id={newId} label="New password" hint={hint} error={errors.newPassword}>
            <PasswordInput
              ref={newRef}
              id={newId}
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                if (errors.newPassword)
                  setErrors((current) => ({ ...current, newPassword: undefined }));
              }}
              {...describedBy(newId, { hint, error: errors.newPassword })}
            />
          </Field>

          <div className="grid gap-3 pt-2 sm:flex sm:items-center">
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <Spinner />
                  Changing your password
                </>
              ) : (
                'Change password'
              )}
            </button>
            <Link href="/account" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>

        <p className="text-sm text-ink-muted">
          Cannot remember it?{' '}
          <Link
            href="/forgot-password"
            className="font-medium text-ink underline decoration-ring/70 decoration-2 underline-offset-4 hover:decoration-ring"
          >
            Reset it by email
          </Link>
        </p>
      </div>
    </Card>
  );
}
