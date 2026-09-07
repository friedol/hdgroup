import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(prev => !prev); }}
        className={`w-full h-11 flex items-center justify-between gap-2 px-3 rounded-md border text-sm transition-colors
          ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white hover:border-emerald-400 border-slate-200 text-slate-700 cursor-pointer'}
          ${open ? 'border-emerald-500 ring-1 ring-emerald-200' : ''}`}
      >
        <span className={`truncate ${!selectedLabel ? 'text-slate-400' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onChange(''); setSearch(''); }}
              onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onChange(''), setSearch(''))}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 italic">No results found</div>
            ) : (
              filtered.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange(option.value); setOpen(false); setSearch(''); }}
                  className={`w-full text-left text-sm px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors
                    ${value === option.value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700'}`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
