'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Card } from '@ukride/shared/ui/Card';
import { Field, describedBy } from '@ukride/shared/ui/Field';
import { Spinner } from '@ukride/shared/ui/Spinner';
import type { ApiError } from '@/lib/api/client';
import { parsePounds, penceToPounds } from '@ukride/shared/money';
import { usePricing, useSetPricing } from '../hooks/usePricing';
import type { PricingRuleInput, VehicleTypePricing } from '../types';

const LIST = '/pricing';

/** Amounts are typed as pounds; the percentage as a whole number. */
interface Values {
  baseFare: string;
  perMile: string;
  minimumFare: string;
  nightSurchargePercent: string;
  airportFee: string;
}
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

const FIELD_ORDER: FieldName[] = [
  'baseFare',
  'perMile',
  'minimumFare',
  'nightSurchargePercent',
  'airportFee',
];

/** The API's names for the same fields, to place its messages. */
const API_FIELD: Record<string, FieldName> = {
  baseFarePence: 'baseFare',
  perMilePence: 'perMile',
  minimumFarePence: 'minimumFare',
  nightSurchargePercent: 'nightSurchargePercent',
  airportFeePence: 'airportFee',
};

/** The highest amount each field takes, in pence: the API's limits. */
const MAX_PENCE: Partial<Record<FieldName, number>> = {
  baseFare: 100_000,
  perMile: 10_000,
  minimumFare: 100_000,
  airportFee: 10_000,
};

function checkField(name: FieldName, value: string): string | undefined {
  const text = value.trim();
  if (name === 'nightSurchargePercent') {
    if (!text) return 'Enter a percentage. Use 0 for none.';
    if (!/^\d{1,3}$/.test(text)) return 'Enter a whole number, like 25.';
    if (Number(text) > 100) return 'Use 100 or less.';
    return;
  }
  if (!text) return 'Enter an amount. Use 0 for none.';
  const pence = parsePounds(text);
  if (pence === undefined) return 'Enter pounds and pence, like 3.50.';
  const max = MAX_PENCE[name]!;
  if (pence > max) return `Use £${max / 100} or less.`;
}

function toInput(values: Values): PricingRuleInput {
  return {
    baseFarePence: parsePounds(values.baseFare)!,
    perMilePence: parsePounds(values.perMile)!,
    minimumFarePence: parsePounds(values.minimumFare)!,
    nightSurchargePercent: Number(values.nightSurchargePercent.trim()),
    airportFeePence: parsePounds(values.airportFee)!,
  };
}

function readApiError(error: ApiError): { fields: Errors; form?: string } {
  if (error.code === 'VALIDATION_ERROR' && error.details) {
    const fields: Errors = {};
    for (const [apiName, messages] of Object.entries(error.details as Record<string, string[]>)) {
      const name = API_FIELD[apiName];
      if (name && messages[0]) fields[name] = `${messages[0]}.`;
    }
    if (Object.keys(fields).length > 0) return { fields };
  }
  if (error.status === 404) {
    return { fields: {}, form: 'This vehicle type no longer exists. Go back to the list.' };
  }
  if (error.status === 403) {
    return { fields: {}, form: 'Your account is not allowed to change prices.' };
  }
  if (error.isNetworkError) {
    return { fields: {}, form: 'We could not reach the server. Nothing was saved. Try again.' };
  }
  return { fields: {}, form: 'We could not save the prices. Try again in a moment.' };
}

/** The page for one vehicle type's prices. Which one comes from the address. */
export function PricingForm() {
  const { vehicleTypeId } = useParams<{ vehicleTypeId: string }>();
  const { data: types, isPending, isError, refetch, isFetching } = usePricing();

  if (isPending) {
    return (
      <Card className="mx-auto max-w-xl">
        <div role="status" className="flex items-center gap-3">
          <Spinner />
          <p className="text-base text-ink-muted">Loading the prices</p>
        </div>
      </Card>
    );
  }

  const type = isError ? undefined : types.find((candidate) => candidate.id === vehicleTypeId);
  if (!type) {
    return (
      <Card className="rise mx-auto max-w-xl">
        <div role="alert" className="space-y-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {isError ? 'We could not load the prices' : 'There is no such vehicle type'}
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
              Back to pricing
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return <Form key={type.id} type={type} />;
}

function Form({ type }: { type: VehicleTypePricing }) {
  const formId = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const rule = type.pricingRule;

  const [values, setValues] = useState<Values>(() => ({
    baseFare: rule ? penceToPounds(rule.baseFarePence) : '',
    perMile: rule ? penceToPounds(rule.perMilePence) : '',
    minimumFare: rule ? penceToPounds(rule.minimumFarePence) : '',
    nightSurchargePercent: rule ? String(rule.nightSurchargePercent) : '0',
    airportFee: rule ? penceToPounds(rule.airportFeePence) : '0.00',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const { mutate, isPending } = useSetPricing();

  const id = (name: FieldName) => `${formId}-${name}`;

  function input(name: FieldName, hint?: string) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
        if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
      },
      onBlur: () =>
        setErrors((current) => ({ ...current, [name]: checkField(name, values[name]) })),
      ...describedBy(id(name), { hint, error: errors[name] }),
      type: 'text',
      inputMode: 'decimal' as const,
      autoComplete: 'off',
      className: 'control tabular',
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setFormError(undefined);
    const found: Errors = {};
    for (const name of FIELD_ORDER) {
      const message = checkField(name, values[name]);
      if (message) found[name] = message;
    }
    const showErrors = (next: Errors) => {
      setErrors(next);
      const first = FIELD_ORDER.find((name) => next[name]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    };
    if (Object.keys(found).length > 0) return showErrors(found);
    setErrors({});

    mutate(
      { vehicleTypeId: type.id, input: toInput(values) },
      {
        onSuccess: () => router.push(`${LIST}?saved=${type.id}`),
        onError: (error) => {
          const { fields, form } = readApiError(error);
          showErrors(fields);
          setFormError(form);
        },
      },
    );
  }

  const money = (name: FieldName, label: string, hint: string) => (
    <Field id={id(name)} label={label} hint={hint} error={errors[name]}>
      <div className="relative">
        {/* The pound sign sits inside the box, so only the number is typed. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted"
        >
          £
        </span>
        <input {...input(name, hint)} className="control tabular pl-8!" />
      </div>
    </Field>
  );

  return (
    <Card className="rise mx-auto max-w-xl">
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {rule ? `Prices for ${type.name}` : `Set prices for ${type.name}`}
          </h1>
          <p className="text-base leading-relaxed text-ink-muted">
            New quotes use these prices as soon as you save.
            {type.isActive ? '' : ' This type is switched off, so customers will not see it yet.'}
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
            {money('baseFare', 'Base fare', 'Charged on every journey.')}
            {money('perMile', 'Price per mile', 'Charged for each mile.')}
          </div>
          {money('minimumFare', 'Minimum fare', 'The least a journey costs, however short.')}

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field
              id={id('nightSurchargePercent')}
              label="Night surcharge"
              hint="Added from 10pm to 6am. 0 for none."
              error={errors.nightSurchargePercent}
            >
              <div className="relative">
                <input
                  {...input('nightSurchargePercent', 'Added from 10pm to 6am. 0 for none.')}
                  inputMode="numeric"
                  className="control tabular pr-10!"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-muted"
                >
                  %
                </span>
              </div>
            </Field>
            {money('airportFee', 'Airport fee', 'Added to or from an airport.')}
          </div>

          <div className="grid gap-3 pt-2 sm:flex sm:items-center">
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <Spinner />
                  Saving the prices
                </>
              ) : (
                'Save prices'
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
