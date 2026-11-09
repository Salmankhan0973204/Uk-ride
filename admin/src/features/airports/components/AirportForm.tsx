'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Checkbox } from '@ukride/shared/ui/Checkbox';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { Spinner } from '@ukride/shared/ui/Spinner';
import type { ApiError } from '@/lib/api/client';
import { useAirports, useCreateAirport, useUpdateAirport } from '../hooks/useAirports';
import type { AdminAirport, AirportChanges, NewAirport } from '../types';

const LIST = '/airports';

interface Values {
  name: string;
  code: string;
  postcode: string;
  /** The other postcodes, as typed: separated by commas. */
  postcodes: string;
  sortOrder: string;
}
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

const FIELD_ORDER: FieldName[] = ['name', 'code', 'postcode', 'postcodes', 'sortOrder'];

/** A whole UK postcode, spaces ignored. postcodes.io checks that it exists. */
const WHOLE = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;
/** A district ("TW6"), sector ("RH6 0") or part of a postcode ("RH6 0P"), with its space. */
const PART = /^[A-Z]{1,2}\d[A-Z\d]?( \d[A-Z]{0,2})?$/;

/** The same tidying as the API: "rh60pj" → "RH6 0PJ", "tw6" → "TW6". */
function tidyPostcode(text: string) {
  const compact = text.replace(/\s+/g, '').toUpperCase();
  if (WHOLE.test(compact)) return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
  return text.trim().toUpperCase().replace(/\s+/g, ' ');
}

const splitList = (text: string) =>
  text
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

function checkField(name: FieldName, values: Values, editing: boolean): string | undefined {
  const value = values[name].trim();
  switch (name) {
    case 'name':
      if (value.length < 2) return 'Enter the airport name.';
      if (value.length > 60) return 'Use at most 60 characters.';
      return;
    case 'code':
      if (!/^[A-Za-z]{3}$/.test(value)) return 'Enter the three-letter code, like LHR.';
      return;
    case 'postcode':
      if (!value) return 'Enter the main terminal postcode.';
      if (!WHOLE.test(value.replace(/\s+/g, '').toUpperCase()))
        return 'Enter a whole UK postcode, like TW6 1EW.';
      return;
    case 'postcodes': {
      const entries = splitList(value);
      if (entries.length > 30) return 'Use at most 30 postcodes.';
      const wrong = entries.find((entry) => {
        const tidy = tidyPostcode(entry);
        return !WHOLE.test(tidy.replace(' ', '')) && !PART.test(tidy);
      });
      if (wrong) return `"${wrong}" is not a postcode, a district like TW6 or a sector like RH6 0.`;
      return;
    }
    case 'sortOrder':
      if (!editing && !value) return;
      if (!/^\d+$/.test(value) || Number(value) > 9999) return 'Enter a number from 0 to 9999.';
      return;
  }
}

const postcodesOf = (values: Values) => [...new Set(splitList(values.postcodes).map(tidyPostcode))];

function toNewAirport(values: Values): NewAirport {
  const sortOrder = values.sortOrder.trim();
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    postcode: tidyPostcode(values.postcode),
    postcodes: postcodesOf(values),
    ...(sortOrder ? { sortOrder: Number(sortOrder) } : {}),
  };
}

function changedFields(airport: AdminAirport, values: Values, isActive: boolean): AirportChanges {
  const changes: AirportChanges = {};
  const next = toNewAirport(values);
  if (next.name !== airport.name) changes.name = next.name;
  if (next.code !== airport.code) changes.code = next.code;
  if (next.postcode !== airport.postcode) changes.postcode = next.postcode;
  if (next.postcodes.join(',') !== airport.postcodes.join(',')) changes.postcodes = next.postcodes;
  if (Number(values.sortOrder) !== airport.sortOrder) changes.sortOrder = Number(values.sortOrder);
  if (isActive !== airport.isActive) changes.isActive = isActive;
  return changes;
}

function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'CONFLICT') {
    return { fields: { code: 'Another airport already uses this code.' } };
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
  if (error.status === 503) return { fields: {}, form: error.message };
  if (error.status === 403) {
    return { fields: {}, form: 'Your account is not allowed to change airports.' };
  }
  if (error.status === 404) {
    return { fields: {}, form: 'This airport no longer exists. Go back to the list.' };
  }
  if (error.isNetworkError) {
    return { fields: {}, form: 'We could not reach the server. Nothing was saved. Try again.' };
  }
  return { fields: {}, form: 'We could not save the airport. Try again in a moment.' };
}

/** The page for adding an airport. */
export function NewAirportForm() {
  return <Form />;
}

/** The page for changing one. Which one comes from the address. */
export function EditAirportForm() {
  const { id } = useParams<{ id: string }>();
  const { data: airports, isPending, isError, refetch, isFetching } = useAirports();

  if (isPending) {
    return (
      <Card className="mx-auto max-w-xl">
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-base text-ink-muted">Loading the airport</p>
        </div>
      </Card>
    );
  }

  const airport = isError ? undefined : airports.find((candidate) => candidate.id === id);
  if (!airport) {
    return (
      <Card className="rise mx-auto max-w-xl">
        <div role="alert" className="space-y-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {isError ? 'We could not load this airport' : 'There is no such airport'}
          </h1>
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
              Back to airports
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return <Form key={airport.id} airport={airport} />;
}

function Form({ airport }: { airport?: AdminAirport }) {
  const editing = Boolean(airport);
  const formId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<Values>(() => ({
    name: airport?.name ?? '',
    code: airport?.code ?? '',
    postcode: airport?.postcode ?? '',
    postcodes: airport?.postcodes.join(', ') ?? '',
    sortOrder: airport ? String(airport.sortOrder) : '',
  }));
  const [isActive, setIsActive] = useState(airport?.isActive ?? true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const create = useCreateAirport();
  const update = useUpdateAirport();
  const isPending = create.isPending || update.isPending;

  const id = (name: FieldName) => `${formId}-${name}`;

  function control(name: FieldName, hint?: string) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
        if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
      },
      onBlur: () =>
        setErrors((current) => ({ ...current, [name]: checkField(name, values, editing) })),
      ...describedBy(id(name), { hint, error: errors[name] }),
      type: 'text',
      autoComplete: 'off',
      spellCheck: false,
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

    if (!airport) {
      return create.mutate(toNewAirport(values), {
        onSuccess: () => router.push(`${LIST}?done=created`),
        onError,
      });
    }

    const changes = changedFields(airport, values, isActive);
    if (Object.keys(changes).length === 0) return router.push(LIST);
    update.mutate(
      { id: airport.id, changes },
      { onSuccess: () => router.push(`${LIST}?done=updated`), onError },
    );
  }

  const codeHint = 'The three-letter airport code, like LHR.';
  const postcodeHint = 'Where the airport is put on the map when a customer picks it.';
  const postcodesHint =
    'Other postcodes that count as this airport, separated by commas. A district (TW6) or a sector (RH6 0) covers every postcode in it, so use them only where no homes share it.';
  const orderHint = editing
    ? 'Lower numbers are listed first.'
    : 'Lower numbers are listed first. Leave it empty to put this airport last.';

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {airport ? `Edit ${airport.name}` : 'Add an airport'}
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            {airport
              ? 'Change what you need. The rest stays as it is.'
              : 'Customers can pick it in the address search as soon as you save.'}
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
            <input {...control('name')} spellCheck />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field id={id('code')} label="Code" hint={codeHint} error={errors.code}>
              <input
                {...control('code', codeHint)}
                autoCapitalize="characters"
                className="control uppercase"
              />
            </Field>
            <Field
              id={id('postcode')}
              label="Main postcode"
              hint={postcodeHint}
              error={errors.postcode}
            >
              <input
                {...control('postcode', postcodeHint)}
                autoCapitalize="characters"
                onBlur={() => {
                  setValues((current) => ({
                    ...current,
                    postcode: tidyPostcode(current.postcode),
                  }));
                  setErrors((current) => ({
                    ...current,
                    postcode: checkField('postcode', values, editing),
                  }));
                }}
                className="control uppercase"
              />
            </Field>
          </div>

          <Field
            id={id('postcodes')}
            label="Other postcodes"
            optional
            hint={postcodesHint}
            error={errors.postcodes}
          >
            <input
              {...control('postcodes', postcodesHint)}
              autoCapitalize="characters"
              className="control uppercase"
            />
          </Field>

          <Field
            id={id('sortOrder')}
            label="Position in the list"
            optional={!editing}
            hint={orderHint}
            error={errors.sortOrder}
          >
            <input {...control('sortOrder', orderHint)} inputMode="numeric" />
          </Field>

          {airport ? (
            <Checkbox
              name="isActive"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            >
              On offer. Untick to switch the airport off: addresses there are then ordinary
              addresses.
            </Checkbox>
          ) : null}

          <div className="grid gap-3 pt-2 sm:flex sm:items-center">
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <Spinner />
                  Saving
                </>
              ) : airport ? (
                'Save changes'
              ) : (
                'Add airport'
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
