'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { labelFor, searchAirports } from '@/lib/data/airports';

// Search-select airport field for the Fly-on-Points board. A real combobox (not a
// native <select>, not free text): type to filter, arrow/enter/escape to pick,
// click outside to dismiss. Keyboard-reachable and announced (role=combobox +
// listbox). Tokens only, no italics, no width transitions.
//
// The airport list + matching now live in lib/data/airports (single source of
// truth, ~3,242 world airports). This file is UI only.

export function AirportSelect({
  label,
  value,
  exclude,
  onChange,
}: {
  label: string;
  value: string;
  exclude?: string;      // hide this code (the other end of the route)
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = `ap-${label.toLowerCase()}`;

  // Ranked, capped search (exact IATA > city/alias prefix > city/alias substring
  // > name substring). Empty query shows the curated popular hubs.
  const options = useMemo(
    () => searchAirports(query, { exclude, limit: 8 }),
    [query, exclude],
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const commit = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && options[active]) { e.preventDefault(); commit(options[active].iata); }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="fp-fld" ref={wrapRef} style={{ position: 'relative' }}>
      <label htmlFor={`${listId}-input`} className="fp-fld-label">{label}</label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className="fp-fld-val"
        value={open ? query : labelFor(value)}
        placeholder={open ? 'City or code' : undefined}
        onFocus={() => { setOpen(true); setActive(0); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={onKey}
      />
      {open && (
        <ul id={listId} role="listbox" className="fp-ap-list">
          {options.length === 0 && (
            <li className="fp-ap-empty">
              No airport matches “{query.trim()}”. Try the city name or its 3-letter code — e.g. Mumbai or BOM.
            </li>
          )}
          {options.map((a, i) => (
            <li
              key={a.iata}
              role="option"
              aria-selected={a.iata === value}
              className={`fp-ap-opt${i === active ? ' active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); commit(a.iata); }}
            >
              <span className="fp-ap-city">{a.city}</span>
              <span className="fp-ap-code mono">{a.iata}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
