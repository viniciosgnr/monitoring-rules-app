'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter, Search } from 'lucide-react';

interface FpsosFilterDropdownProps {
  fpsos: string[];
  selectedFpsos: string[];
  onChange: (fpsos: string[]) => void;
}

export default function FpsosFilterDropdown({
  fpsos,
  selectedFpsos,
  onChange,
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

  const isAllSelected = selectedFpsos.length === 0 || selectedFpsos.length === allFpsos.length;

  function handleToggleAll() {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange([...allFpsos]);
    }
  }

  function handleToggleOne(fpso: string) {
    if (selectedFpsos.length === 0) {
      onChange([fpso]);
      return;
    }
    if (selectedFpsos.includes(fpso)) {
      const next = selectedFpsos.filter(f => f !== fpso);
      onChange(next);
    } else {
      onChange([...selectedFpsos, fpso]);
    }
  }

  const label = selectedFpsos.length === 0 || selectedFpsos.length === allFpsos.length
    ? 'All FPSOs'
    : selectedFpsos.length === 1
      ? selectedFpsos[0]
      : `FPSOs (${selectedFpsos.length})`;

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
        <div className="absolute left-0 sm:right-0 sm:left-auto top-9 w-64 bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl p-3 z-50 select-none">
          {/* Search Input */}
          <div className="relative mb-2.5">
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
            <label
              onClick={handleToggleAll}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1E293B] cursor-pointer text-xs transition-colors"
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => {}}
                className="rounded border-[#334155] bg-[#0B0F19] text-[#3B82F6] focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-white">(Select All)</span>
            </label>

            <div className="h-px bg-[#1E293B] my-1" />

            {filteredFpsos.length === 0 ? (
              <div className="px-2.5 py-2 text-xs text-[#64748B] italic text-center">No FPSO found</div>
            ) : (
              filteredFpsos.map(fpso => {
                const isChecked = selectedFpsos.length === 0 || selectedFpsos.includes(fpso);
                return (
                  <label
                    key={fpso}
                    onClick={() => handleToggleOne(fpso)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#1E293B] cursor-pointer text-xs transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-[#334155] bg-[#0B0F19] text-[#3B82F6] focus:ring-0 cursor-pointer"
                    />
                    <span className="font-mono text-[#E2E8F0]">{fpso}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
