interface FieldProps {
  /** id of the control inside; the label points at it. */
  id: string;
  label: string;
  /** Shown beside the label for fields the user may skip. */
  optional?: boolean;
  /** Help text under the control. Replaced by the error when there is one. */
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

/** ids a control needs for `aria-describedby` and its label. */
export function fieldIds(id: string) {
  return { label: `${id}-label`, hint: `${id}-hint`, error: `${id}-error` };
}

/** What a control inside a Field passes on so its error and hint are announced. */
export function describedBy(id: string, { hint, error }: { hint?: string; error?: string }) {
  const ids = fieldIds(id);
  return {
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? ids.error : hint ? ids.hint : undefined,
  };
}

/**
 * Label, control and message of one form field.
 * The label is always visible, and the error sits right under the control it
 * belongs to and is announced when it appears.
 */
export function Field({ id, label, optional, hint, error, children }: FieldProps) {
  const ids = fieldIds(id);

  return (
    <div className="space-y-2">
      <label
        id={ids.label}
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-sm font-medium"
      >
        {label}
        {optional ? <span className="text-xs font-normal text-ink-muted">Optional</span> : null}
      </label>

      {children}

      {error ? (
        <p id={ids.error} role="alert" className="flex gap-1.5 text-sm font-medium text-danger">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="mt-0.5 h-4 w-4 shrink-0"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.01" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p id={ids.hint} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
