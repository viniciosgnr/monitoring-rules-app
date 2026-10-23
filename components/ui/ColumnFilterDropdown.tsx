'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, ChevronDown } from 'lucide-react';

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
  placeholder = '',
  variant = 'table',
}: ColumnFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stagedSelected, setStagedSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const uniqueOptions = Array.from(new Set(options)).filter(Boolean).sort();

  // Sync staged selection when opening popover
  useEffect(() => {
    if (isOpen) {
      setStagedSelected(
        selectedValues.length === 0 ? [...uniqueOptions] : [...selectedValues]
      );
      setSearchTerm('');
    }
  }, [isOpen, selectedValues, uniqueOptions]);

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

  const filteredOptions = uniqueOptions.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllStagedSelected =
    uniqueOptions.length > 0 && stagedSelected.length === uniqueOptions.length;

  function handleToggleSelectAll() {
    if (isAllStagedSelected) {
      setStagedSelected([]);
    } else {
      setStagedSelected([...uniqueOptions]);
    }
  }

  function handleToggleOption(opt: string) {
    if (stagedSelected.includes(opt)) {
      setStagedSelected(stagedSelected.filter(v => v !== opt));
    } else {
      setStagedSelected([...stagedSelected, opt]);
    }
  }

  function handleReset() {
    setStagedSelected([...uniqueOptions]);
  }

  function handleApply() {
    if (stagedSelected.length === 0 || stagedSelected.length === uniqueOptions.length) {
      onChange([]);
    } else {
      onChange(stagedSelected);
    }
    setIsOpen(false);
  }

  const isFiltered = selectedValues.length > 0 && selectedValues.length < uniqueOptions.length;
  const summaryText = isFiltered
    ? `(${selectedValues.length})`
    : '';

  return (
    <div className={`relative font-normal ${variant === 'table' ? 'w-full mt-1.5' : ''}`} ref={dropdownRef}>
      {/* Trigger Box */}
      {variant === 'select' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
            isFiltered
              ? 'bg-[#0B0F19] border-[#3B82F6] text-[#3B82F6] font-medium'
              : 'bg-[#0B0F19] border-[#1E293B] text-white hover:border-[#3B82F6]'
          }`}
        >
          <span className="truncate max-w-[120px]" title={summaryText || placeholder}>
            {summaryText || placeholder}
          </span>
          <ChevronDown
            size={12}
            className={`flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-[#3B82F6]' : 'text-[#94A3B8]'
            }`}
          />
        </button>
      ) : (
        /* SLB Table Inline Filter Trigger: discreet underline line with SlidersHorizontal icon */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-1 text-[11px] pb-1 border-b transition-colors cursor-pointer text-left ${
            isFiltered
              ? 'border-[#4D82F7] text-[#60A5FA]'
              : 'border-[#262E42] text-[#64748B] hover:border-[#475569]'
          }`}
        >
          <span className="truncate text-[10px] text-[#94A3B8]">
            {summaryText}
          </span>
          <SlidersHorizontal
            size={12}
            className={`flex-shrink-0 ml-auto transition-colors ${
              isFiltered ? 'text-[#4D82F7]' : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          />
        </button>
      )}

      {/* SLB Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-[#141824] border border-[#262E42] rounded-xl shadow-2xl p-3 z-50 text-xs select-none animate-in fade-in-50 duration-100">
          {/* Header icon row (SLB style) */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#232A3D]">
            <SlidersHorizontal size={15} className="text-[#94A3B8]" />
          </div>

          {/* Search Bar */}
          <div className="mb-2.5">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent border-b border-[#2B354C] pb-1 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#4D82F7] transition-colors"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {/* (Select All) Checkbox Row */}
            <div
              onClick={handleToggleSelectAll}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[#E2E8F0] hover:bg-[#1E2538] transition-colors cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 ${
                  isAllStagedSelected
                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                    : 'border-[#3D4863] bg-[#0F1420]'
                }`}
              >
                {isAllStagedSelected && <Check size={12} strokeWidth={3} />}
              </div>
              <span className="font-medium text-white text-xs">(Select All)</span>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-[#64748B] italic text-center text-xs">
                No options found
              </div>
            ) : (
              filteredOptions.map(opt => {
                const checked = stagedSelected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => handleToggleOption(opt)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[#E2E8F0] hover:bg-[#1E2538] transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 ${
                        checked
                          ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                          : 'border-[#3D4863] bg-[#0F1420]'
                      }`}
                    >
                      {checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className="truncate text-xs text-white" title={opt}>
                      {opt}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions: Reset and Apply (SLB Style Pills) */}
          <div className="flex items-center justify-center gap-3 pt-3 mt-2 border-t border-[#232A3D]">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-1 rounded-full text-xs font-medium text-[#E2E8F0] bg-[#121622] border border-[#343E56] hover:bg-[#1B2133] hover:border-[#4D5B7C] transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-1 rounded-full text-xs font-semibold text-white bg-[#4D82F7] hover:bg-[#3B72E6] shadow-sm transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
