'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter, Search, Check } from 'lucide-react';

interface FpsosFilterDropdownProps {
  fpsos: string[];
  // Single-select mode props:
  selectedFpso?: string;
  onChange?: (fpso: string) => void;
  // Multi-select mode props:
  isMultiSelect?: boolean;
  selectedFpsos?: string[];
  onMultiChange?: (fpsos: string[]) => void;
}

export default function FpsosFilterDropdown({
  fpsos,
  selectedFpso,
  onChange,
  isMultiSelect = false,
  selectedFpsos = [],
  onMultiChange,
}: FpsosFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const allFpsos = Array.from(new Set(fpsos)).filter(Boolean).sort();
  const filteredFpsos = allFpsos.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

  // Determine button label
  let label = '';
  if (isMultiSelect) {
    if (selectedFpsos.length === 0) {
      label = 'Select FPSO';
    } else if (selectedFpsos.length === allFpsos.length && allFpsos.length > 0) {
      label = 'All FPSOs';
    } else if (selectedFpsos.length === 1) {
      label = selectedFpsos[0];
    } else if (selectedFpsos.length === 2) {
      label = selectedFpsos.join(', ');
    } else {
      label = `FPSO (${selectedFpsos.length})`;
    }
  } else {
    label = selectedFpso || (allFpsos[0] ?? 'Select FPSO');
  }

  const isAllSelected = isMultiSelect && allFpsos.length > 0 && selectedFpsos.length === allFpsos.length;

  const handleToggleAll = () => {
    if (!onMultiChange) return;
    if (isAllSelected) {
      // Guard: At least 1 FPSO must remain selected. Reset to default (UNY or first FPSO)
      const defaultFpso = allFpsos.includes('UNY') ? 'UNY' : (allFpsos[0] ?? '');
      onMultiChange(defaultFpso ? [defaultFpso] : []);
    } else {
      onMultiChange([...allFpsos]);
    }
  };

  const handleToggleItem = (fpso: string) => {
    if (!onMultiChange) return;
    if (selectedFpsos.includes(fpso)) {
      // Guard: Do not allow unchecking if it's the only one selected
      if (selectedFpsos.length <= 1) return;
      onMultiChange(selectedFpsos.filter(f => f !== fpso));
    } else {
      onMultiChange([...selectedFpsos, fpso]);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-normal rounded-full bg-[#0B0F19] border border-[#1E293B] text-white hover:border-[#3B82F6] transition-colors cursor-pointer"
      >
        <Filter size={13} className="text-[#94A3B8]" />
        <span>{label}</span>
        <ChevronDown size={13} className="text-[#94A3B8]" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-9 w-60 bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl p-3 z-50 select-none">
          {/* Multi-select Header Controls */}
          {isMultiSelect && (
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-2">
              <span className="text-xs font-medium text-white">Filter FPSO</span>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-[11px] text-[#3B82F6] hover:underline cursor-pointer"
              >
                {isAllSelected ? 'Reset (UNY)' : 'Select All'}
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative mb-2">
            <Search size={13} className="absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search FPSO..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredFpsos.length === 0 ? (
              <div className="px-2.5 py-2 text-xs text-[#64748B] italic text-center">No FPSO found</div>
            ) : (
              filteredFpsos.map(fpso => {
                if (isMultiSelect) {
                  const isChecked = selectedFpsos.includes(fpso);
                  const isOnlyOne = isChecked && selectedFpsos.length === 1;
                  return (
                    <label
                      key={fpso}
                      onClick={() => handleToggleItem(fpso)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#3B82F6]/15 text-[#60A5FA] font-medium'
                          : 'text-[#E2E8F0] hover:bg-[#1E293B]'
                      } ${isOnlyOne ? 'cursor-not-allowed opacity-90' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isOnlyOne}
                          readOnly
                          className="rounded border-[#1E293B] bg-[#0B0F19] text-[#3B82F6] focus:ring-0 cursor-pointer accent-[#3B82F6]"
                        />
                        <span className="font-mono">{fpso}</span>
                      </div>
                      {isChecked && <Check size={13} className="text-[#60A5FA]" />}
                    </label>
                  );
                }

                // Single-select mode fallback
                const isSelected = selectedFpso === fpso;
                return (
                  <button
                    key={fpso}
                    type="button"
                    onClick={() => {
                      if (onChange) onChange(fpso);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#3B82F6]/15 text-[#60A5FA] font-medium'
                        : 'text-[#E2E8F0] hover:bg-[#1E293B]'
                    }`}
                  >
                    <span className="font-mono">{fpso}</span>
                    {isSelected && <Check size={13} className="text-[#60A5FA]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
