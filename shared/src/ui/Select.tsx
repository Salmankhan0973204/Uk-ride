'use client';

import { useEffect, useRef, useState } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  /** Also the id the field's label points at. */
  id: string;
  name: string;
  /** id of the visible label, so the list is named when it opens. */
  labelId: string;
  value: T | '';
  options: readonly SelectOption<T>[];
  onChange: (value: T | '') => void;
  placeholder?: string;
  /** Adds a first row that clears the choice. For optional fields. */
  clearLabel?: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

/**
 * A dropdown drawn in the design's own glass instead of the browser's list.
 *
 * It follows the "select-only combobox" pattern: the trigger keeps focus and
 * `aria-activedescendant` tells assistive technology which option is active.
 * Keys: Up / Down move, Home / End jump, Enter or Space choose, Escape closes,
 * and typing a letter jumps to the first option that starts with it.
 */
export function Select<T extends string>({
  id,
  name,
  labelId,
  value,
  options,
  onChange,
  placeholder = 'Select',
  clearLabel,
  ...aria
}: SelectProps<T>) {
  const rows: SelectOption<T | ''>[] = clearLabel
    ? [{ value: '', label: clearLabel }, ...options]
    : [...options];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value);
  const optionId = (index: number) => `${id}-option-${index}`;

  // A click or tap anywhere else closes the list.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  // Keep the active option in view when moving with the keyboard.
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function openList() {
    const current = rows.findIndex((row) => row.value === value);
    setActive(current >= 0 ? current : 0);
    setOpen(true);
  }

  function choose(index: number) {
    const row = rows[index];
    if (row) onChange(row.value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const { key } = event;

    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        openList();
      }
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, rows.length - 1));
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (key === 'End') {
      event.preventDefault();
      setActive(rows.length - 1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      choose(active);
    } else if (key === 'Tab') {
      // Leaving the field keeps what was highlighted, as a native select does.
      choose(active);
    } else if (key.length === 1) {
      const match = rows.findIndex((row) => row.label.toLowerCase().startsWith(key.toLowerCase()));
      if (match >= 0) setActive(match);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        name={name}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${labelId} ${id}`}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className="control flex items-center justify-between gap-3 text-left"
        {...aria}
      >
        <span className={selected ? '' : 'text-ink-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={labelId}
          className="pop glass menu absolute top-full right-0 left-0 z-20 mt-2 max-h-64 overflow-auto p-1.5"
        >
          {rows.map((row, index) => {
            const isSelected = row.value === value;
            return (
              <li
                key={row.value || 'none'}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                // pointerdown, not click: the choice lands before focus can move.
                onPointerDown={(event) => {
                  event.preventDefault();
                  choose(index);
                }}
                onPointerMove={() => setActive(index)}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3.5 text-base ${
                  index === active ? 'bg-glass-strong' : ''
                } ${row.value === '' ? 'text-ink-muted' : ''}`}
              >
                {row.label}
                {isSelected && row.value !== '' ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 shrink-0 text-ring"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
