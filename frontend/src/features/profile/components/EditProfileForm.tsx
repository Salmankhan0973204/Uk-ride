'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Field, describedBy, fieldIds } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { AccountGate } from '@/features/auth/components/AccountGate';
import { GENDER_OPTIONS } from '@/features/auth/types';
import type { Gender, User } from '@/features/auth/types';
import { checkName } from '@/features/auth/validation';
import type { ApiError } from '@/lib/api/client';
import { checkMobile, formatMobile, normaliseMobile } from '@/lib/phone/mobile';
import type { ProfileChanges } from '../api/profile.api';
import { useUpdateProfile } from '../hooks/useProfileActions';

interface Values {
  firstName: string;
  lastName: string;
  mobile: string;
  gender: Gender | '';
}
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

/** Top to bottom, as on screen. Focus goes to the first one with an error. */
const FIELD_ORDER: FieldName[] = ['firstName', 'lastName', 'mobile', 'gender'];

function checkField(name: FieldName, values: Values): string | undefined {
  switch (name) {
    case 'firstName':
      return checkName(values.firstName, 'first name');
    case 'lastName':
      return checkName(values.lastName, 'last name');
    case 'mobile':
      return checkMobile(values.mobile);
    case 'gender':
      return;
  }
}

/**
 * Only what the person actually changed. A PATCH that repeats untouched
 * fields works too, but sending the difference says what was meant, and an
 * unchanged form sends nothing at all.
 */
function changedFields(user: User, values: Values): ProfileChanges {
  const changes: ProfileChanges = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const mobile = normaliseMobile(values.mobile);
  const gender = values.gender || null;

  if (firstName !== user.firstName) changes.firstName = firstName;
  if (lastName !== user.lastName) changes.lastName = lastName;
  if (mobile !== user.mobile) changes.mobile = mobile;
  if (gender !== user.gender) changes.gender = gender;
  return changes;
}

/** Turns an API failure into messages placed where the user can act on them. */
function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'CONFLICT') {
    return {
      fields: { mobile: 'This mobile number belongs to another account. Use a different number.' },
    };
  }
  if (error.code === 'VALIDATION_ERROR') {
    const details = (error.details ?? {}) as Partial<Record<FieldName, string[]>>;
    const fields: Errors = {};
    for (const name of FIELD_ORDER) {
      const message = details[name]?.[0];
      if (message) fields[name] = `${message}.`;
    }
    if (Object.keys(fields).length > 0) return { fields };
  }
  if (error.isNetworkError) {
    return {
      fields: {},
      form: 'We could not reach the server. Check your connection and try again.',
    };
  }
  return { fields: {}, form: 'We could not save your profile. Try again in a moment.' };
}

export function EditProfileForm() {
  return <AccountGate>{(user) => <Form user={user} />}</AccountGate>;
}

function Form({ user }: { user: User }) {
  const formId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // The form starts from what is in the cache. It is read once: later changes
  // to the cache (from this very form saving) must not overwrite what is typed.
  const [values, setValues] = useState<Values>(() => ({
    firstName: user.firstName,
    lastName: user.lastName,
    mobile: formatMobile(user.mobile),
    gender: user.gender ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const { mutate, isPending } = useUpdateProfile();

  const id = (name: FieldName) => `${formId}-${name}`;

  function setValue(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function input(name: Exclude<FieldName, 'gender'>, hint?: string) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value),
      onBlur: () => setErrors((current) => ({ ...current, [name]: checkField(name, values) })),
      ...describedBy(id(name), { hint, error: errors[name] }),
      className: 'control',
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
    const found: Errors = {};
    for (const name of FIELD_ORDER) {
      const message = checkField(name, values);
      if (message) found[name] = message;
    }
    if (Object.keys(found).length > 0) return showErrors(found);

    const changes = changedFields(user, values);
    // Nothing was changed: there is nothing to save, so just go back.
    if (Object.keys(changes).length === 0) return router.push('/account');

    setErrors({});
    mutate(changes, {
      onSuccess: () => router.push('/account?done=profile'),
      onError: (error) => {
        const { fields, form } = readApiError(error);
        showErrors(fields);
        setFormError(form);
      },
    });
  }

  const mobileHint = 'Include the country code, like +44 7400 123456.';

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Edit your profile
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            Change what you need. The rest stays as it is.
          </p>
        </div>

        <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-5">
          {formError ? (
            <p
              role="alert"
              className="rounded-2xl border border-danger/50 bg-[rgb(253_164_175/0.12)] px-4 py-3 text-sm leading-relaxed font-medium text-danger"
            >
              {formError}
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field id={id('firstName')} label="First name" error={errors.firstName}>
              <input {...input('firstName')} type="text" autoComplete="given-name" />
            </Field>
            <Field id={id('lastName')} label="Last name" error={errors.lastName}>
              <input {...input('lastName')} type="text" autoComplete="family-name" />
            </Field>
          </div>

          <Field id={id('mobile')} label="Mobile number" hint={mobileHint} error={errors.mobile}>
            <input {...input('mobile', mobileHint)} type="tel" inputMode="tel" autoComplete="tel" />
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

          {/* Shown, not editable: changing it safely needs the new address confirmed first. */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Email address</p>
            <p className="break-all text-ink-muted">{user.email}</p>
            <p className="text-sm text-ink-muted">Your email address cannot be changed yet.</p>
          </div>

          <div className="grid gap-3 pt-2 sm:flex sm:items-center">
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <Spinner />
                  Saving your profile
                </>
              ) : (
                'Save changes'
              )}
            </button>
            <Link href="/account" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Card>
  );
}
