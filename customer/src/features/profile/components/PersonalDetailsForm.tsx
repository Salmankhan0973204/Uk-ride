'use client';

import { useId, useRef, useState } from 'react';
import { Field, describedBy, fieldIds } from '@ukride/shared/ui/Field';
import { Select } from '@ukride/shared/ui/Select';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { FormAlert, commonProblem } from '@/features/auth/components/AuthParts';
import { GENDER_OPTIONS } from '@/features/auth/types';
import type { Gender, User } from '@/features/auth/types';
import { checkName } from '@/features/auth/validation';
import type { ApiError } from '@/lib/api/client';
import type { ProfileChanges } from '../api/profile.api';
import { useUpdateProfile } from '../hooks/useProfileActions';

interface Values {
  firstName: string;
  lastName: string;
  gender: Gender | '';
}
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

const NOTHING_CHANGED = 'Nothing has changed.';

/** Top to bottom, as on screen. Focus goes to the first one with an error. */
const FIELD_ORDER: FieldName[] = ['firstName', 'lastName', 'gender'];

function checkField(name: FieldName, values: Values): string | undefined {
  switch (name) {
    case 'firstName':
      return checkName(values.firstName, 'first name');
    case 'lastName':
      return checkName(values.lastName, 'last name');
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
  const gender = values.gender || null;

  if (firstName !== user.firstName) changes.firstName = firstName;
  if (lastName !== user.lastName) changes.lastName = lastName;
  if (gender !== user.gender) changes.gender = gender;
  return changes;
}

/** Turns an API failure into messages placed where the user can act on them. */
function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'VALIDATION_ERROR') {
    const details = (error.details ?? {}) as Partial<Record<FieldName, string[]>>;
    const fields: Errors = {};
    for (const name of FIELD_ORDER) {
      const message = details[name]?.[0];
      if (message) fields[name] = `${message}.`;
    }
    if (Object.keys(fields).length > 0) return { fields };
  }
  return {
    fields: {},
    form: commonProblem(error, 'We could not save your details. Try again in a moment.'),
  };
}

/**
 * Name and gender, edited in place on the profile page, as on ukride.uk.
 *
 * The form starts from the user in the cache and reads it once: later changes
 * to the cache (from this very form saving) must not overwrite what is typed.
 * Saving writes the answer into the cache, so the name in the header and the
 * page title change at once.
 */
export function PersonalDetailsForm({ user }: { user: User }) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<Values>(() => ({
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  /** What the last save did, said beside the button. Cleared by the next edit. */
  const [saved, setSaved] = useState<string>();
  const { mutate, isPending } = useUpdateProfile();

  const id = (name: FieldName) => `${formId}-${name}`;

  function setValue(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setSaved(undefined);
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function input(name: Exclude<FieldName, 'gender'>) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value),
      onBlur: () => setErrors((current) => ({ ...current, [name]: checkField(name, values) })),
      ...describedBy(id(name), { error: errors[name] }),
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
    if (Object.keys(changes).length === 0) return setSaved(NOTHING_CHANGED);

    setErrors({});
    mutate(changes, {
      onSuccess: () => setSaved('Your details have been saved.'),
      onError: (error) => {
        const { fields, form } = readApiError(error);
        showErrors(fields);
        setFormError(form);
      },
    });
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-5">
      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Field id={id('firstName')} label="First name" error={errors.firstName}>
          <input {...input('firstName')} type="text" autoComplete="given-name" />
        </Field>
        <Field id={id('lastName')} label="Last name" error={errors.lastName}>
          <input {...input('lastName')} type="text" autoComplete="family-name" />
        </Field>
      </div>

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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? (
            <>
              <Spinner />
              Saving
            </>
          ) : (
            'Save changes'
          )}
        </button>
        {/* Always in the page, so a screen reader hears each new message. */}
        <p
          role="status"
          className={`text-sm font-medium ${saved === NOTHING_CHANGED ? 'text-ink-muted' : 'text-success'}`}
        >
          {saved}
        </p>
      </div>
    </form>
  );
}
