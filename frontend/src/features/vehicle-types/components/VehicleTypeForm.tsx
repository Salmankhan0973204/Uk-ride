'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Field, describedBy } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { AdminGate } from '@/features/auth/components/AdminGate';
import type { ApiError } from '@/lib/api/client';
import {
  useAdminVehicleTypes,
  useCreateVehicleType,
  useUpdateVehicleType,
} from '../hooks/useAdminVehicleTypes';
import type { AdminVehicleType, NewVehicleType, VehicleTypeChanges } from '../types';

const LIST = '/admin/vehicle-types';

/** Every input holds text. Numbers are converted when the form is sent. */
interface Values {
  name: string;
  slug: string;
  description: string;
  passengers: string;
  suitcases: string;
  sortOrder: string;
}
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

/** Top to bottom, as on screen. Focus goes to the first one with an error. */
const FIELD_ORDER: FieldName[] = [
  'name',
  'slug',
  'description',
  'passengers',
  'suitcases',
  'sortOrder',
];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A whole number in a range, or the reason it is not one. */
function checkCount(value: string, what: string, min: number, max: number) {
  const text = value.trim();
  if (!text) return `Enter the number of ${what}.`;
  if (!/^\d+$/.test(text)) return 'Enter a whole number, like 4.';
  const count = Number(text);
  if (count < min || count > max) return `Enter a number from ${min} to ${max}.`;
}

/** The same rules as the API, so most mistakes never leave the browser. */
function checkField(name: FieldName, values: Values, editing: boolean): string | undefined {
  const value = values[name].trim();
  switch (name) {
    case 'name':
      if (!value) return 'Enter a name.';
      if (value.length > 40) return 'Use at most 40 characters.';
      return;
    case 'slug':
      // Fixed once created, and optional before that.
      if (editing || !value) return;
      if (value.length < 2 || value.length > 40) return 'Use 2 to 40 characters.';
      if (!SLUG_PATTERN.test(value.toLowerCase()))
        return 'Use letters, numbers and hyphens only, like people-carrier.';
      return;
    case 'description':
      if (!value) return 'Enter a description.';
      if (value.length > 200) return `Use at most 200 characters. You have ${value.length}.`;
      return;
    case 'passengers':
      return checkCount(value, 'passengers', 1, 8);
    case 'suitcases':
      return checkCount(value, 'suitcases', 0, 20);
    case 'sortOrder':
      // When adding, empty means "put it at the end".
      if (!editing && !value) return;
      return checkCount(value, 'the position', 0, 9999);
  }
}

function toNewVehicleType(values: Values): NewVehicleType {
  const slug = values.slug.trim().toLowerCase();
  const sortOrder = values.sortOrder.trim();
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    passengers: Number(values.passengers),
    suitcases: Number(values.suitcases),
    ...(slug ? { slug } : {}),
    ...(sortOrder ? { sortOrder: Number(sortOrder) } : {}),
  };
}

/** Only what was changed, as on the profile form. */
function changedFields(type: AdminVehicleType, values: Values): VehicleTypeChanges {
  const changes: VehicleTypeChanges = {};
  const name = values.name.trim();
  const description = values.description.trim();
  const passengers = Number(values.passengers);
  const suitcases = Number(values.suitcases);
  const sortOrder = Number(values.sortOrder);

  if (name !== type.name) changes.name = name;
  if (description !== type.description) changes.description = description;
  if (passengers !== type.passengers) changes.passengers = passengers;
  if (suitcases !== type.suitcases) changes.suitcases = suitcases;
  if (sortOrder !== type.sortOrder) changes.sortOrder = sortOrder;
  return changes;
}

/** Turns an API failure into messages placed where the admin can act on them. */
function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'CONFLICT') {
    return { fields: { slug: 'Another vehicle type already uses this slug. Choose another.' } };
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
  if (error.status === 403) {
    return { fields: {}, form: 'Your account is not allowed to change vehicle types.' };
  }
  if (error.status === 404) {
    return { fields: {}, form: 'This vehicle type no longer exists. Go back to the list.' };
  }
  if (error.isNetworkError) {
    return {
      fields: {},
      form: 'We could not reach the server. Check your connection and try again.',
    };
  }
  return { fields: {}, form: 'We could not save the vehicle type. Try again in a moment.' };
}

/** The page for adding a vehicle type. */
export function NewVehicleTypeForm() {
  return <AdminGate>{() => <Form />}</AdminGate>;
}

/** The page for changing one. Which one comes from the address. */
export function EditVehicleTypeForm() {
  return <AdminGate>{() => <Loader />}</AdminGate>;
}

/**
 * Finds the vehicle type to edit in the admin list. Coming from the table,
 * the list is already in the cache and the form opens at once; opening the
 * address directly fetches it first.
 */
function Loader() {
  const { id } = useParams<{ id: string }>();
  const { data: vehicleTypes, isPending, isError, refetch, isFetching } = useAdminVehicleTypes();

  if (isPending) {
    return (
      <Card className="mx-auto max-w-xl">
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-base text-ink-muted">Loading the vehicle type</p>
        </div>
      </Card>
    );
  }

  const type = isError ? undefined : vehicleTypes.find((candidate) => candidate.id === id);
  if (!type) {
    return (
      <Card className="rise mx-auto max-w-xl">
        <div role="alert" className="space-y-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {isError ? 'We could not load this vehicle type' : 'There is no such vehicle type'}
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            {isError
              ? 'The server did not answer as expected. Try again in a moment.'
              : 'The address may be wrong, or the type may have been removed.'}
          </p>
          <div className="grid gap-3 sm:flex">
            {isError ? (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="btn btn-primary"
              >
                {isFetching ? 'Trying again' : 'Try again'}
              </button>
            ) : null}
            <Link href={LIST} className={`btn ${isError ? 'btn-ghost' : 'btn-primary'}`}>
              Back to vehicle types
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // The key makes a fresh form if the address changes to another type.
  return <Form key={type.id} type={type} />;
}

function Form({ type }: { type?: AdminVehicleType }) {
  const editing = Boolean(type);
  const formId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Read once: the refetch after saving must not overwrite what is typed.
  const [values, setValues] = useState<Values>(() => ({
    name: type?.name ?? '',
    slug: type?.slug ?? '',
    description: type?.description ?? '',
    passengers: type ? String(type.passengers) : '',
    suitcases: type ? String(type.suitcases) : '',
    sortOrder: type ? String(type.sortOrder) : '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const create = useCreateVehicleType();
  const update = useUpdateVehicleType();
  const isPending = create.isPending || update.isPending;

  const id = (name: FieldName) => `${formId}-${name}`;

  function control(name: FieldName, hint?: string) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
        if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
      },
      onBlur: () =>
        setErrors((current) => ({ ...current, [name]: checkField(name, values, editing) })),
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
      const message = checkField(name, values, editing);
      if (message) found[name] = message;
    }
    if (Object.keys(found).length > 0) return showErrors(found);
    setErrors({});

    const onError = (error: ApiError) => {
      const { fields, form } = readApiError(error);
      showErrors(fields);
      setFormError(form);
    };

    if (!type) {
      return create.mutate(toNewVehicleType(values), {
        onSuccess: () => router.push(`${LIST}?done=created`),
        onError,
      });
    }

    const changes = changedFields(type, values);
    // Nothing was changed: there is nothing to save, so just go back.
    if (Object.keys(changes).length === 0) return router.push(LIST);
    update.mutate(
      { id: type.id, changes },
      { onSuccess: () => router.push(`${LIST}?done=updated`), onError },
    );
  }

  const slugHint = 'Used in the address. Leave it empty to make it from the name.';
  const orderHint = editing
    ? 'Lower numbers are listed first.'
    : 'Lower numbers are listed first. Leave it empty to put this type last.';

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {type ? `Edit ${type.name}` : 'Add a vehicle type'}
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            {type
              ? 'Change what you need. The rest stays as it is.'
              : 'Customers will see it in the list as soon as you save.'}
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

          <Field id={id('name')} label="Name" error={errors.name}>
            <input {...control('name')} type="text" autoComplete="off" />
          </Field>

          {type ? (
            // Shown, not editable: the slug is the type's address.
            <div className="space-y-2">
              <p className="text-sm font-medium">Slug</p>
              <p className="font-mono break-all text-ink-muted">{type.slug}</p>
              <p className="text-sm text-ink-muted">
                The slug is the address of this type, so it cannot be changed.
              </p>
            </div>
          ) : (
            <Field id={id('slug')} label="Slug" optional hint={slugHint} error={errors.slug}>
              <input
                {...control('slug', slugHint)}
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>
          )}

          <Field id={id('description')} label="Description" error={errors.description}>
            <textarea {...control('description')} rows={3} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field id={id('passengers')} label="Passengers" error={errors.passengers}>
              <input
                {...control('passengers')}
                type="text"
                inputMode="numeric"
                autoComplete="off"
              />
            </Field>
            <Field id={id('suitcases')} label="Suitcases" error={errors.suitcases}>
              <input {...control('suitcases')} type="text" inputMode="numeric" autoComplete="off" />
            </Field>
          </div>

          <Field
            id={id('sortOrder')}
            label="Position in the list"
            optional={!editing}
            hint={orderHint}
            error={errors.sortOrder}
          >
            <input
              {...control('sortOrder', orderHint)}
              type="text"
              inputMode="numeric"
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-3 pt-2 sm:flex sm:items-center">
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <Spinner />
                  Saving
                </>
              ) : type ? (
                'Save changes'
              ) : (
                'Add vehicle type'
              )}
            </button>
            <Link href={LIST} className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Card>
  );
}
