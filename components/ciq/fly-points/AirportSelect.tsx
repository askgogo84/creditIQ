'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Search-select airport field for the Fly-on-Points board. A real combobox (not a
// native <select>, not free text): type to filter, arrow/enter/escape to pick,
// click outside to dismiss. Keyboard-reachable and announced (role=combobox +
// listbox). Tokens only, no italics, no width transitions.

export interface Airport {
  code: string;
  city: string;
}

// De-duped India-plus-hubs list (the old FlightSearch list carried duplicates).
export const AIRPORTS: Airport[] = [
  { code: 'BLR', city: 'Bengaluru' }, { code: 'DEL', city: 'Delhi' },
  { code: 'BOM', city: 'Mumbai' }, { code: 'MAA', city: 'Chennai' },
  { code: 'HYD', city: 'Hyderabad' }, { code: 'CCU', city: 'Kolkata' },
  { code: 'COK', city: 'Kochi' }, { code: 'GOI', city: 'Goa' },
  { code: 'PNQ', city: 'Pune' }, { code: 'AMD', city: 'Ahmedabad' },
  { code: 'JAI', city: 'Jaipur' }, { code: 'HYD', city: 'Hyderabad' },
  { code: 'SIN', city: 'Singapore' }, { code: 'DXB', city: 'Dubai' },
  { code: 'AUH', city: 'Abu Dhabi' }, { code: 'DOH', city: 'Doha' },
  { code: 'BKK', city: 'Bangkok' }, { code: 'HKT', city: 'Phuket' },
  { code: 'KUL', city: 'Kuala Lumpur' }, { code: 'HKG', city: 'Hong Kong' },
  { code: 'DPS', city: 'Bali' }, { code: 'NRT', city: 'Tokyo' },
  { code: 'ICN', city: 'Seoul' }, { code: 'SYD', city: 'Sydney' },
  { code: 'MLE', city: 'Maldives' }, { code: 'CMB', city: 'Colombo' },
  { code: 'KTM', city: 'Kathmandu' }, { code: 'LHR', city: 'London' },
  { code: 'CDG', city: 'Paris' }, { code: 'AMS', city: 'Amsterdam' },
  { code: 'FCO', city: 'Rome' }, { code: 'IST', city: 'Istanbul' },
  { code: 'FRA', city: 'Frankfurt' }, { code: 'JFK', city: 'New York' },
  { code: 'LAX', city: 'Los Angeles' }, { code: 'YYZ', city: 'Toronto' },
  { code: 'NBO', city: 'Nairobi' },
];

// Keyed by code so lookups (and de-dupe) are stable.
const BY_CODE = new Map<string, Airport>();
for (const a of AIRPORTS) if (!BY_CODE.has(a.code)) BY_CODE.set(a.code, a);
export const AIRPORT_LIST: Airport[] = Array.from(BY_CODE.values());

export function labelFor(code: string): string {
  const a = BY_CODE.get(code);
  return a ? `${a.city} (${a.code})` : code;
}

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

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AIRPORT_LIST.filter((a) => {
      if (exclude && a.code === exclude) return false;
      if (!q) return true;
      return a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q);
    });
  }, [query, exclude]);

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
      if (open && options[active]) { e.preventDefault(); commit(options[active].code); }
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
          {options.length === 0 && <li className="fp-ap-empty">No match</li>}
          {options.map((a, i) => (
            <li
              key={a.code}
              role="option"
              aria-selected={a.code === value}
              className={`fp-ap-opt${i === active ? ' active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); commit(a.code); }}
            >
              <span className="fp-ap-city">{a.city}</span>
              <span className="fp-ap-code mono">{a.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
