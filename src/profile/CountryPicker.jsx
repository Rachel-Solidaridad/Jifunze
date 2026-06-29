import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { PINNED_COUNTRIES, ALL_COUNTRIES, isPinnedCountry } from './countries';

const YELLOW = '#FFC800';

// Searchable single-select country picker. Combobox pattern: read-only input
// displays the current selection; clicking opens a filtered list. PINNED first
// with a divider, then ALL alphabetically.
export default function CountryPicker({ value, onChange, autoFocus = false, label = 'Country' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    function onClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const lower = query.trim().toLowerCase();
  const { pinned, others } = useMemo(() => {
    const filterFn = (c) => !lower || c.toLowerCase().includes(lower);
    return {
      pinned: PINNED_COUNTRIES.filter(filterFn),
      others: ALL_COUNTRIES
        .filter(c => !isPinnedCountry(c))
        .filter(filterFn),
    };
  }, [lower]);

  const pick = (country) => {
    onChange(country);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
        {label}
      </label>
      <button
        type="button"
        autoFocus={autoFocus}
        onClick={() => setOpen(o => !o)}
        className="mt-1 w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 flex items-center justify-between"
        style={{ '--tw-ring-color': YELLOW }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? 'text-black' : 'text-gray-400'}>
          {value || 'Select a country…'}
        </span>
        <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
      </button>
      {open ? (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-black rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
          <div className="px-2 py-2 border-b border-gray-200 flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
          </div>
          <ul role="listbox" className="overflow-y-auto flex-1 py-1">
            {pinned.length > 0 ? (
              <>
                <li className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Solidaridad ECA
                </li>
                {pinned.map(c => (
                  <CountryRow key={c} country={c} selected={c === value} onPick={pick} />
                ))}
                {others.length > 0 ? (
                  <li className="border-t border-gray-200 mx-3 my-1" aria-hidden="true" />
                ) : null}
              </>
            ) : null}
            {others.length > 0 ? (
              <>
                {others.length > 0 && pinned.length > 0 ? (
                  <li className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    All countries
                  </li>
                ) : null}
                {others.map(c => (
                  <CountryRow key={c} country={c} selected={c === value} onPick={pick} />
                ))}
              </>
            ) : null}
            {pinned.length === 0 && others.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-500 text-center">
                No matches for “{query}”.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CountryRow({ country, selected, onPick }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(country)}
        className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between hover:bg-gray-50 ${
          selected ? 'font-bold' : ''
        }`}
        role="option"
        aria-selected={selected}
      >
        <span>{country}</span>
        {selected ? <Check size={14} className="text-black" /> : null}
      </button>
    </li>
  );
}
