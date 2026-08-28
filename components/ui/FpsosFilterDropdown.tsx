'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter, Search, Check } from 'lucide-react';

interface FpsosFilterDropdownProps {
  fpsos: string[];
  selectedFpso: string;
  onChange: (fpso: string) => void;
}

export default function FpsosFilterDropdown({
  fpsos,
  selectedFpso,
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

  const label = selectedFpso || (allFpsos[0] ?? 'Select FPSO');

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
        <div className="absolute left-0 sm:right-0 sm:left-auto top-9 w-56 bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl p-3 z-50 select-none">
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
                const isSelected = selectedFpso === fpso;
                return (
                  <button
                    key={fpso}
                    type="button"
                    onClick={() => {
                      onChange(fpso);
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
