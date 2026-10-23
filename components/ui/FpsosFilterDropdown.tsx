'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, SlidersHorizontal, Check } from 'lucide-react';

interface FpsosFilterDropdownProps {
  fpsos: string[];
  // Single-select mode props:
  selectedFpso?: string;
  onChange?: (fpso: string) => void;
  // Multi-select mode props:
  isMultiSelect?: boolean;
  selectedFpsos?: string[];
  onMultiChange?: (fpsos: string[]) => void;
  baseLabel?: string;
  showFilterIcon?: boolean;
  buttonClassName?: string;
}

export default function FpsosFilterDropdown({
  fpsos,
  selectedFpso,
  onChange,
  isMultiSelect = false,
  selectedFpsos = [],
  onMultiChange,
  baseLabel,
  showFilterIcon = true,
  buttonClassName,
}: FpsosFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stagedSelected, setStagedSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allFpsos = useMemo(
    () => Array.from(new Set(fpsos)).filter(Boolean).sort(),
    [fpsos]
  );

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

  const filteredFpsos = useMemo(
    () => allFpsos.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase())),
    [allFpsos, searchTerm]
  );

  // Toggle open and initialize staged selection cleanly
  const handleToggleOpen = () => {
    if (!isOpen) {
      setStagedSelected(
        selectedFpsos.length === 0 || selectedFpsos.length === allFpsos.length
          ? [...allFpsos]
          : [...selectedFpsos]
      );
      setSearchTerm('');
    }
    setIsOpen(prev => !prev);
  };

  // Determine button label
  let label = '';
  if (isMultiSelect) {
    if (baseLabel) {
      if (selectedFpsos.length === 0 || (allFpsos.length > 0 && selectedFpsos.length === allFpsos.length)) {
        label = baseLabel;
      } else if (selectedFpsos.length === 1) {
        label = `${baseLabel} (${selectedFpsos[0]})`;
      } else {
        label = `${baseLabel} (${selectedFpsos.length})`;
      }
    } else {
      if (selectedFpsos.length === 0 || selectedFpsos.length === allFpsos.length) {
        label = 'All FPSOs';
      } else if (selectedFpsos.length === 1) {
        label = selectedFpsos[0];
      } else if (selectedFpsos.length === 2) {
        label = selectedFpsos.join(', ');
      } else {
        label = `FPSO (${selectedFpsos.length})`;
      }
    }
  } else {
    label = selectedFpso || (allFpsos[0] ?? 'Select FPSO');
  }

  // Staged selection helpers
  const isAllStagedSelected =
    allFpsos.length > 0 && stagedSelected.length === allFpsos.length;

  const handleToggleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAllStagedSelected) {
      setStagedSelected([]);
    } else {
      setStagedSelected([...allFpsos]);
    }
  };

  const handleToggleStagedItem = (fpso: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStagedSelected(prev =>
      prev.includes(fpso) ? prev.filter(f => f !== fpso) : [...prev, fpso]
    );
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedSelected([...allFpsos]);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMultiChange) {
      if (stagedSelected.length === 0 || stagedSelected.length === allFpsos.length) {
        onMultiChange([]);
      } else {
        onMultiChange(stagedSelected);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        className={
          buttonClassName ||
          "flex items-center gap-2 px-3.5 py-1.5 text-xs font-normal rounded-lg bg-[#0e131f] border border-[#232938] text-white hover:border-[#3b82f6] transition-colors cursor-pointer"
        }
      >
        {showFilterIcon && <SlidersHorizontal size={13} className="text-[#94A3B8]" />}
        <span>{label}</span>
        <ChevronDown size={13} className={`text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-10 w-56 bg-[#141824] border border-[#262e42] rounded-xl shadow-2xl p-3 z-50 select-none animate-in fade-in-50 duration-100">
          {/* Header icon row (SLB style) */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#232a3d]">
            <SlidersHorizontal size={15} className="text-[#94a3b8]" />
          </div>

          {/* Search Input */}
          <div className="mb-2.5">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-b border-[#2b354c] pb-1 text-xs text-white placeholder-[#64748b] outline-none focus:border-[#4d82f7] transition-colors"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {/* (Select All) Checkbox */}
            {isMultiSelect && (
              <div
                onClick={handleToggleSelectAll}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[#e2e8f0] hover:bg-[#1e2538] transition-colors cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 ${
                    isAllStagedSelected
                      ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                      : 'border-[#3d4863] bg-[#0f1420]'
                  }`}
                >
                  {isAllStagedSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span className="font-medium text-white text-xs">(Select All)</span>
              </div>
            )}

            {filteredFpsos.length === 0 ? (
              <div className="px-2.5 py-3 text-xs text-[#64748B] italic text-center">
                No FPSO found
              </div>
            ) : (
              filteredFpsos.map(fpso => {
                if (isMultiSelect) {
                  const isChecked = stagedSelected.includes(fpso);
                  return (
                    <div
                      key={fpso}
                      onClick={e => handleToggleStagedItem(fpso, e)}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[#e2e8f0] hover:bg-[#1e2538] transition-colors cursor-pointer"
                    >
                      <div
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors flex-shrink-0 ${
                          isChecked
                            ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                            : 'border-[#3d4863] bg-[#0f1420]'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="font-mono text-white text-xs">{fpso}</span>
                    </div>
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
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#3B82F6]/20 text-[#60A5FA] font-medium'
                        : 'text-[#E2E8F0] hover:bg-[#1E2538]'
                    }`}
                  >
                    <span className="font-mono">{fpso}</span>
                    {isSelected && <Check size={13} className="text-[#60A5FA]" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions: Reset and Apply (SLB Style Pills) */}
          {isMultiSelect && (
            <div className="flex items-center justify-center gap-3 pt-3 mt-2 border-t border-[#232a3d]">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-1 rounded-full text-xs font-medium text-[#e2e8f0] bg-[#121622] border border-[#343e56] hover:bg-[#1b2133] hover:border-[#4d5b7c] transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-1 rounded-full text-xs font-semibold text-white bg-[#4d82f7] hover:bg-[#3b72e6] shadow-sm transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
