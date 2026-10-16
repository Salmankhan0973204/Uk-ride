'use client';

import { useState } from 'react';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'className'>;

/**
 * A password field with a Show / Hide control inside its right end.
 * It takes every prop a normal input takes (id, name, value, onChange, ref,
 * autoComplete, aria-*), so it drops into a `Field` like any other control.
 */
export function PasswordInput(props: PasswordInputProps) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={shown ? 'text' : 'password'}
        autoCapitalize="none"
        spellCheck={false}
        className="control pr-20"
      />
      <button
        type="button"
        onClick={() => setShown((current) => !current)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0.5 right-0.5 min-w-16 rounded-xl px-3 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-glass-strong hover:text-ink"
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
