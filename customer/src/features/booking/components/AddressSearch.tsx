'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@ukride/shared/ui/Spinner';
import { MIN_SEARCH_LENGTH, useDebouncedValue, usePlaceSuggestions } from '../hooks/useBooking';
import type { AirportRef, JourneyPlace, PlaceSuggestion } from '../types';

/** What an address box holds: the text typed, and the place once one is picked. */
export interface AddressValue {
  text: string;
  place: (JourneyPlace & { airport: AirportRef | null }) | null;
}

export const emptyAddress = (): AddressValue => ({ text: '', place: null });

interface AddressSearchProps {
  /** The input's id; the Field's label points at it. */
  id: string;
  name: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

/** The words shown in the box once a suggestion is picked. */
const fullText = (place: PlaceSuggestion) =>
  place.detail ? `${place.label}, ${place.detail}` : place.label;

/** How long typing must pause before the search is sent. */
const DEBOUNCE_MS = 250;

/**
 * An address box that suggests as you type: the "editable combobox with
 * list autocomplete" pattern. Focus stays in the input; Up and Down move
 * through the list, Enter picks, Escape closes. The journey only takes a
 * place picked from the list, because only those have a map position.
 */
export function AddressSearch({ id, name, value, onChange, ...aria }: AddressSearchProps) {
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // While a picked place is shown, there is nothing to search for.
  const searchText = useDebouncedValue(value.place ? '' : value.text, DEBOUNCE_MS);
  const suggestions = usePlaceSuggestions(searchText);
  const places = suggestions.data ?? [];
  // Typing clears the highlight; a shorter list can still leave it past the end.
  const active = highlight < places.length ? highlight : -1;
  const typedEnough = value.text.trim().length >= MIN_SEARCH_LENGTH && !value.place;
  const waiting = typedEnough && (searchText !== value.text || suggestions.isFetching);
  const showList = open && typedEnough;

  // A click or tap outside closes the list.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function choose(place: PlaceSuggestion) {
    onChange({
      text: fullText(place),
      place: {
        label: fullText(place),
        latitude: place.latitude,
        longitude: place.longitude,
        airport: place.airport,
      },
    });
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (showList) {
        event.preventDefault();
        setOpen(false);
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!typedEnough) return;
      event.preventDefault();
      setOpen(true);
      if (places.length === 0) return;
      setHighlight(() =>
        event.key === 'ArrowDown'
          ? Math.min(active + 1, places.length - 1)
          : Math.max(active - 1, 0),
      );
      return;
    }
    // Enter picks the highlighted suggestion instead of sending the form.
    if (event.key === 'Enter' && showList && active >= 0 && places[active]) {
      event.preventDefault();
      choose(places[active]!);
    }
  }

  const optionId = (index: number) => `${id}-option-${index}`;
  const status = !typedEnough
    ? ''
    : suggestions.isError && places.length === 0
      ? 'We could not search addresses just now. Try again in a moment.'
      : waiting && places.length === 0
        ? 'Searching'
        : places.length === 0
          ? 'No matches. Try a postcode, a street or a place name.'
          : `${places.length} ${places.length === 1 ? 'suggestion' : 'suggestions'}`;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        spellCheck={false}
        value={value.text}
        onChange={(event) => {
          // Typing again lets go of the picked place: the words no longer match it.
          onChange({ text: event.target.value, place: null });
          // New text brings new suggestions: nothing is highlighted until the person moves to one.
          setHighlight(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="control pr-11!"
        {...aria}
      />
      {/* A busy spinner or a tick for a picked place, inside the right end of the box. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-muted"
      >
        {waiting ? (
          <Spinner className="h-4 w-4" />
        ) : value.place ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-ring"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : null}
      </span>

      {/* Announced as the suggestions change, without moving focus. */}
      <p role="status" className="sr-only">
        {showList ? status : ''}
      </p>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="pop glass menu absolute top-full right-0 left-0 z-20 mt-2 max-h-80 overflow-auto p-1.5"
        >
          {places.length === 0 ? (
            // Not an option: a sentence about the search, in the list's place.
            <li
              role="presentation"
              className="flex min-h-11 items-center gap-2.5 px-3.5 text-sm text-ink-muted"
            >
              {waiting ? <Spinner className="h-4 w-4" /> : null}
              {status}
            </li>
          ) : (
            places.map((place, index) => (
              <li
                key={`${place.label}|${place.latitude}|${place.longitude}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                // pointerdown, not click: the choice lands before the input loses focus.
                onPointerDown={(event) => {
                  event.preventDefault();
                  choose(place);
                }}
                onPointerMove={() => setHighlight(index)}
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-3.5 py-2.5 ${
                  index === active ? 'bg-glass-strong' : ''
                }`}
              >
                <PlaceIcon place={place} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium break-words">{place.label}</span>
                  {place.detail ? (
                    <span className="block text-sm break-words text-ink-muted">{place.detail}</span>
                  ) : null}
                </span>
                {place.airport ? (
                  <span className="pill shrink-0 self-center">{place.airport.code}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

/** A plane for airports, a pin for everything else. */
function PlaceIcon({ place }: { place: PlaceSuggestion }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted"
    >
      {place.airport ? (
        <path d="M10.5 3.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V9l7 4v2l-7-2v4.5l2 1.5v1.5L12 19.5 8.5 21v-1.5l2-1.5V13l-7 2v-2l7-4z" />
      ) : (
        <>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.3" />
        </>
      )}
    </svg>
  );
}
