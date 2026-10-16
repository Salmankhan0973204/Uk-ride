'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Field, describedBy, fieldIds } from '@ukride/shared/ui/Field';
import { Select } from '@ukride/shared/ui/Select';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { useAdminVehicleTypes } from '@/features/vehicle-types/hooks/useAdminVehicleTypes';
import type { AdminVehicleType } from '@/features/vehicle-types/types';
import type { ApiError } from '@/lib/api/client';
import { formatRegistration } from '../format';
import { useCreateVehicle, useUpdateVehicle, useVehicle } from '../hooks/useVehicleActions';
import type { NewVehicle, Vehicle, VehicleChanges } from '../types';
import { VehicleStatusSection } from './VehicleStatusSection';

const LIST = '/admin/vehicles';
const MIN_YEAR = 1990;
const maxYear = () => new Date().getFullYear() + 1;

/** Every input holds text; the year becomes a number when the form is sent. */
interface Values {
  registration: string;
  make: string;
  model: string;
  colour: string;
  year: string;
  vehicleTypeId: string;
}
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

/** Top to bottom, as on screen. Focus goes to the first one with an error. */
const FIELD_ORDER: FieldName[] = [
  'registration',
  'make',
  'model',
  'colour',
  'year',
  'vehicleTypeId',
];

/** The plate as it is stored: capitals, no spaces. */
const cleanPlate = (value: string) => value.replace(/\s+/g, '').toUpperCase();

/** The same rules as the API, so most mistakes never leave the browser. */
function checkField(name: FieldName, values: Values): string | undefined {
  const value = values[name].trim();
  const required = (what: string, max: number) =>
    !value
      ? `Enter the ${what}.`
      : value.length > max
        ? `Use at most ${max} characters.`
        : undefined;

  switch (name) {
    case 'registration': {
      const plate = cleanPlate(value);
      if (!plate) return 'Enter the registration.';
      if (!/^[A-Z0-9]{2,8}$/.test(plate)) return 'Use 2 to 8 letters and numbers, like AB12 CDE.';
      return;
    }
    case 'make':
      return required('make', 40);
    case 'model':
      return required('model', 40);
    case 'colour':
      return required('colour', 30);
    case 'year': {
      if (!value) return 'Enter the year.';
      if (!/^\d{4}$/.test(value)) return 'Enter a four-digit year, like 2023.';
      const year = Number(value);
      if (year < MIN_YEAR) return `Use ${MIN_YEAR} or later.`;
      if (year > maxYear()) return 'The year cannot be in the future.';
      return;
    }
    case 'vehicleTypeId':
      return value ? undefined : 'Choose a vehicle type.';
  }
}

function toNewVehicle(values: Values): NewVehicle {
  return {
    registration: cleanPlate(values.registration),
    make: values.make.trim(),
    model: values.model.trim(),
    colour: values.colour.trim(),
    year: Number(values.year),
    vehicleTypeId: values.vehicleTypeId,
  };
}

/** Only what was changed. */
function changedFields(vehicle: Vehicle, values: Values): VehicleChanges {
  const next = toNewVehicle(values);
  const changes: VehicleChanges = {};
  if (next.registration !== vehicle.registration) changes.registration = next.registration;
  if (next.make !== vehicle.make) changes.make = next.make;
  if (next.model !== vehicle.model) changes.model = next.model;
  if (next.colour !== vehicle.colour) changes.colour = next.colour;
  if (next.year !== vehicle.year) changes.year = next.year;
  if (next.vehicleTypeId !== vehicle.vehicleType.id) changes.vehicleTypeId = next.vehicleTypeId;
  return changes;
}

/** Turns an API failure into messages placed where the admin can act on them. */
function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'CONFLICT') {
    return { fields: { registration: 'Another vehicle already has this registration.' } };
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
    return { fields: {}, form: 'Your account is not allowed to change vehicles.' };
  }
  if (error.status === 404) {
    return { fields: {}, form: 'This vehicle no longer exists. Go back to the list.' };
  }
  if (error.isNetworkError) {
    return {
      fields: {},
      form: 'We could not reach the server. Check your connection and try again.',
    };
  }
  return { fields: {}, form: 'We could not save the vehicle. Try again in a moment.' };
}

/** A panel that says something could not be shown, with one way out. */
function Problem({
  title,
  text,
  retry,
}: {
  title: string;
  text: string;
  retry?: { run: () => void; busy: boolean };
}) {
  return (
    <Card className="rise mx-auto max-w-xl">
      <div role="alert" className="space-y-5">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">{text}</p>
        <div className="grid gap-3 sm:flex">
          {retry ? (
            <button
              type="button"
              onClick={retry.run}
              disabled={retry.busy}
              className="btn btn-primary"
            >
              {retry.busy ? 'Trying again' : 'Try again'}
            </button>
          ) : null}
          <Link href={LIST} className={`btn ${retry ? 'btn-ghost' : 'btn-primary'}`}>
            Back to vehicles
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Loading({ what }: { what: string }) {
  return (
    <Card className="mx-auto max-w-xl">
      <div role="status" className="flex items-center gap-3">
        <Spinner />
        <p className="text-base text-ink-muted">Loading {what}</p>
      </div>
    </Card>
  );
}

/**
 * The form cannot be drawn until it knows the vehicle types: they are the
 * options of its dropdown. That is dependent data. This component waits for
 * the types query, handles its failure, and only then draws the form.
 */
function WithTypes({ children }: { children: (types: AdminVehicleType[]) => React.ReactNode }) {
  const types = useAdminVehicleTypes();

  if (types.isPending) return <Loading what="the vehicle types" />;
  if (types.isError) {
    return (
      <Problem
        title="We could not load the vehicle types"
        text="The form needs them for its vehicle type list. Try again in a moment."
        retry={{ run: () => types.refetch(), busy: types.isFetching }}
      />
    );
  }
  return <>{children(types.data)}</>;
}

/** The page for adding a vehicle. */
export function NewVehicleForm() {
  return (
    <WithTypes>
      {(types) =>
        types.some((type) => type.isActive) ? (
          <Form types={types} />
        ) : (
          <Problem
            title="Add a vehicle type first"
            text="Every vehicle belongs to a vehicle type, and none is on offer yet."
          />
        )
      }
    </WithTypes>
  );
}

/**
 * The page for changing one. It needs two things, the vehicle and the types,
 * and they do not depend on each other, so both requests go out at once.
 */
export function EditVehicleForm() {
  const { id } = useParams<{ id: string }>();
  const vehicle = useVehicle(id);

  return (
    <WithTypes>
      {(types) => {
        if (vehicle.isPending) return <Loading what="the vehicle" />;
        if (vehicle.isError) {
          return vehicle.error.status === 404 ? (
            <Problem
              title="There is no such vehicle"
              text="The address may be wrong, or the vehicle may have been removed."
            />
          ) : (
            <Problem
              title="We could not load this vehicle"
              text="The server did not answer as expected. Try again in a moment."
              retry={{ run: () => vehicle.refetch(), busy: vehicle.isFetching }}
            />
          );
        }
        // The key makes a fresh form if the address changes to another vehicle.
        return <Form key={vehicle.data.id} types={types} vehicle={vehicle.data} />;
      }}
    </WithTypes>
  );
}

function Form({ types, vehicle }: { types: AdminVehicleType[]; vehicle?: Vehicle }) {
  const formId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Read once: the refetch after saving must not overwrite what is typed.
  const [values, setValues] = useState<Values>(() => ({
    registration: vehicle ? formatRegistration(vehicle.registration) : '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    colour: vehicle?.colour ?? '',
    year: vehicle ? String(vehicle.year) : '',
    vehicleTypeId: vehicle?.vehicleType.id ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const create = useCreateVehicle();
  const update = useUpdateVehicle();
  const isPending = create.isPending || update.isPending;

  // Types on offer, plus the vehicle's own type if it was switched off later:
  // the car may keep it, but no other car can be given it.
  const typeOptions = types
    .filter((type) => type.isActive || type.id === vehicle?.vehicleType.id)
    .map((type) => ({
      value: type.id,
      label: type.isActive ? type.name : `${type.name} (switched off)`,
    }));

  const id = (name: FieldName) => `${formId}-${name}`;

  function setValue(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function input(name: Exclude<FieldName, 'vehicleTypeId'>, hint?: string) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value),
      onBlur: () => setErrors((current) => ({ ...current, [name]: checkField(name, values) })),
      ...describedBy(id(name), { hint, error: errors[name] }),
      className: 'control',
      autoComplete: 'off',
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
    setErrors({});

    const onError = (error: ApiError) => {
      const { fields, form } = readApiError(error);
      showErrors(fields);
      setFormError(form);
    };

    if (!vehicle) {
      return create.mutate(toNewVehicle(values), {
        onSuccess: () => router.push(`${LIST}?done=created`),
        onError,
      });
    }

    const changes = changedFields(vehicle, values);
    // Nothing was changed: there is nothing to save, so just go back.
    if (Object.keys(changes).length === 0) return router.push(LIST);
    update.mutate(
      { id: vehicle.id, changes },
      { onSuccess: () => router.push(`${LIST}?done=updated`), onError },
    );
  }

  const plateHint = 'As on the number plate. Spaces do not matter.';
  const yearHint = 'The year the car was first registered.';

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {vehicle ? `Edit ${formatRegistration(vehicle.registration)}` : 'Add a vehicle'}
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            {vehicle
              ? 'Change what you need. The rest stays as it is.'
              : 'A new vehicle starts as active and can be given jobs straight away.'}
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

          <Field
            id={id('registration')}
            label="Registration"
            hint={plateHint}
            error={errors.registration}
          >
            <input
              {...input('registration', plateHint)}
              type="text"
              autoCapitalize="characters"
              spellCheck={false}
              className="control font-mono tracking-wide uppercase"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field id={id('make')} label="Make" error={errors.make}>
              <input {...input('make')} type="text" />
            </Field>
            <Field id={id('model')} label="Model" error={errors.model}>
              <input {...input('model')} type="text" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field id={id('colour')} label="Colour" error={errors.colour}>
              <input {...input('colour')} type="text" />
            </Field>
            <Field id={id('year')} label="Year" hint={yearHint} error={errors.year}>
              <input {...input('year', yearHint)} type="text" inputMode="numeric" maxLength={4} />
            </Field>
          </div>

          <Field id={id('vehicleTypeId')} label="Vehicle type" error={errors.vehicleTypeId}>
            <Select
              id={id('vehicleTypeId')}
              name="vehicleTypeId"
              labelId={fieldIds(id('vehicleTypeId')).label}
              value={values.vehicleTypeId}
              options={typeOptions}
              onChange={(value) => setValue('vehicleTypeId', value)}
              placeholder="Choose a type"
              {...describedBy(id('vehicleTypeId'), { error: errors.vehicleTypeId })}
            />
          </Field>

          <div className="grid gap-3 pt-2 sm:flex sm:items-center">
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <Spinner />
                  Saving
                </>
              ) : vehicle ? (
                'Save changes'
              ) : (
                'Add vehicle'
              )}
            </button>
            <Link href={LIST} className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>

        {vehicle ? (
          <VehicleStatusSection
            vehicle={vehicle}
            plate={formatRegistration(vehicle.registration)}
          />
        ) : null}
      </div>
    </Card>
  );
}
