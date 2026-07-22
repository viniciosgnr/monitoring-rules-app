'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Search, Check, Minus, ChevronDown } from 'lucide-react';

interface ColumnFilterDropdownProps {
  title?: string;
  options: string[];
  selectedValues: string[];
  onChange: (newSelected: string[]) => void;
  placeholder?: string;
  variant?: 'table' | 'select';
}

export default function ColumnFilterDropdown({
  title,
  options = [],
  selectedValues,
  onChange,
  placeholder = 'Filter...',
  variant = 'table',
}: ColumnFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const uniqueOptions = Array.from(new Set(options)).filter(Boolean).sort();
  const allSelected = uniqueOptions.length > 0 && selectedValues.length === uniqueOptions.length;
  const isIndeterminate = selectedValues.length > 0 && !allSelected;

  const filteredOptions = uniqueOptions.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleToggleSelectAll() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...uniqueOptions]);
    }
  }

  function handleToggleOption(opt: string) {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(v => v !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
  }

  // Summary text calculation
  const isFiltered = selectedValues.length > 0 && selectedValues.length < uniqueOptions.length;
  const summaryText = isFiltered
    ? `(${selectedValues.length}) ${selectedValues.join(',')}`
    : '';

  return (
    <div className={`relative font-normal ${variant === 'table' ? 'mt-1.5' : ''}`} ref={dropdownRef}>
      {/* Trigger Box */}
      {variant === 'select' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
            isFiltered
              ? 'bg-bg-panel border-accent-blue text-accent-blue font-medium'
              : 'bg-bg-panel border-border-panel text-text-primary hover:border-accent-blue'
          }`}
        >
          <span className="truncate max-w-[140px]" title={summaryText || placeholder}>
            {summaryText || placeholder}
          </span>
          <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 text-accent-blue' : 'text-text-muted'}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-1 text-[11px] py-0.5 border-b transition-colors cursor-pointer text-left ${
            isFiltered
              ? 'border-accent-blue text-accent-blue font-medium'
              : 'border-border-panel/70 text-text-muted hover:border-text-muted'
          }`}
        >
          <span className="truncate max-w-[120px]" title={summaryText || placeholder}>
            {summaryText || <span className="opacity-60">{placeholder}</span>}
          </span>
          <SlidersHorizontal size={11} className={`flex-shrink-0 ${isFiltered ? 'text-accent-blue' : 'text-text-muted'}`} />
        </button>
      )}

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-bg-panel border border-border-panel rounded-card shadow-2xl z-50 p-2 text-xs space-y-2 select-none">
          {title && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1 pb-1 border-b border-border-panel/40 mb-1">
              Filter: {title}
            </div>
          )}
          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-7 pr-2 py-1 bg-bg-input border border-border-panel/60 rounded text-xs text-text-primary outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          {/* Option List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
            {/* Select All Checkbox Row */}
            <div
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-highlight cursor-pointer text-text-primary font-semibold"
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  allSelected
                    ? 'bg-accent-blue border-accent-blue text-white'
                    : isIndeterminate
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'border-border-panel bg-bg-input'
                }`}
              >
                {allSelected && <Check size={10} strokeWidth={3} />}
                {isIndeterminate && <Minus size={10} strokeWidth={3} />}
              </div>
              <span>(Select All)</span>
            </div>

            <div className="border-t border-border-panel/40 my-1" />

            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-text-muted italic text-center">No options found</div>
            ) : (
              filteredOptions.map(opt => {
                const checked = selectedValues.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => handleToggleOption(opt)}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-highlight cursor-pointer text-text-primary"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        checked
                          ? 'bg-accent-blue border-accent-blue text-white'
                          : 'border-border-panel bg-bg-input'
                      }`}
                    >
                      {checked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{opt}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
