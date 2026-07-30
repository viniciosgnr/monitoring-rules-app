'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, Minus, ChevronDown } from 'lucide-react';

interface ColumnFilterDropdownProps {
  title?: string;
  options: string[];
  selectedValues: string[];
  onChange: (newSelected: string[]) => void;
  placeholder?: string;
  variant?: 'table' | 'select';
}

export default function ColumnFilterDropdown({
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
        <div className="absolute left-0 top-full mt-1.5 w-52 bg-[#131927] border border-[#1E2E48] rounded-xl shadow-2xl z-50 p-2.5 text-xs select-none">
          {/* Search Bar */}
          <div className="pb-2 mb-2 border-b border-[#1E2E48]">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-xs text-[#E2E8F0] placeholder-[#64748B] outline-none"
            />
          </div>

          {/* Option List with custom dark scrollbar */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-[#2B3B55] scrollbar-track-transparent">
            {/* Select All Checkbox Row */}
            <div
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2.5 px-1.5 py-1 rounded hover:bg-[#1E2E48]/50 cursor-pointer text-[#E2E8F0] font-medium"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  allSelected || isIndeterminate
                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                    : 'border-[#334155] bg-transparent'
                }`}
              >
                {allSelected && <Check size={11} strokeWidth={3} />}
                {isIndeterminate && <Minus size={11} strokeWidth={3} />}
              </div>
              <span className="text-xs">(Select All)</span>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-[#64748B] italic text-center text-xs">No options found</div>
            ) : (
              filteredOptions.map(opt => {
                const checked = selectedValues.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => handleToggleOption(opt)}
                    className="flex items-center gap-2.5 px-1.5 py-1 rounded hover:bg-[#1E2E48]/50 cursor-pointer text-[#E2E8F0]"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        checked
                          ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                          : 'border-[#334155] bg-transparent'
                      }`}
                    >
                      {checked && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="truncate text-xs">{opt}</span>
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
