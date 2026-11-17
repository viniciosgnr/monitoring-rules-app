'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export type PresetPeriod = 'Last week' | 'Last month' | 'Last 6 months' | 'Last year' | 'Custom dates';

export const PRESET_PERIODS: PresetPeriod[] = [
  'Last week',
  'Last month',
  'Last 6 months',
  'Last year',
  'Custom dates',
];

const MONTH_SHORT_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface PeriodFilterDropdownProps {
  value: PresetPeriod;
  customFrom: string; // YYYY-MM-DD
  customTo: string;   // YYYY-MM-DD
  onSelectPreset: (period: Exclude<PresetPeriod, 'Custom dates'>) => void;
  onApplyCustomDates: (from: string, to: string) => void;
}

function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export default function PeriodFilterDropdown({
  value,
  customFrom,
  customTo,
  onSelectPreset,
  onApplyCustomDates,
}: PeriodFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stagedOption, setStagedOption] = useState<PresetPeriod>(value);
  const [stagedFrom, setStagedFrom] = useState<string>(customFrom);
  const [stagedTo, setStagedTo] = useState<string>(customTo);

  // Calendar popover state ('from' | 'to' | null)
  const [activeCalendarField, setActiveCalendarField] = useState<'from' | 'to' | null>(null);
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(10); // 0-indexed (10 = Nov)
  const [showMonthYearSelect, setShowMonthYearSelect] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveCalendarField(null);
        setShowMonthYearSelect(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenToggle = () => {
    if (!isOpen) {
      setStagedOption(value);
      setStagedFrom(customFrom);
      setStagedTo(customTo);
      setActiveCalendarField(null);
      setShowMonthYearSelect(false);
    }
    setIsOpen(prev => !prev);
  };

  const handleOptionClick = (option: PresetPeriod) => {
    setStagedOption(option);
    if (option !== 'Custom dates') {
      onSelectPreset(option);
      setIsOpen(false);
      setActiveCalendarField(null);
    } else {
      // Ensure valid default dates when opening Custom dates
      if (!stagedFrom) {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        setStagedFrom(formatDateYMD(d));
      }
      if (!stagedTo) {
        setStagedTo(formatDateYMD(new Date()));
      }
    }
  };

  const openCalendarFor = (field: 'from' | 'to') => {
    if (activeCalendarField === field) {
      setActiveCalendarField(null);
      return;
    }
    const targetYmd = field === 'from' ? stagedFrom : stagedTo;
    const parsed = parseDateYMD(targetYmd);
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
    setShowMonthYearSelect(false);
    setActiveCalendarField(field);
  };

  const handleDaySelect = (day: number) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    const formatted = formatDateYMD(selectedDate);
    if (activeCalendarField === 'from') {
      setStagedFrom(formatted);
      if (stagedTo && formatted > stagedTo) {
        setStagedTo(formatted);
      }
    } else if (activeCalendarField === 'to') {
      setStagedTo(formatted);
      if (stagedFrom && formatted < stagedFrom) {
        setStagedFrom(formatted);
      }
    }
    setActiveCalendarField(null);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleApply = () => {
    if (stagedFrom && stagedTo) {
      const start = stagedFrom <= stagedTo ? stagedFrom : stagedTo;
      const end = stagedFrom <= stagedTo ? stagedTo : stagedFrom;
      onApplyCustomDates(start, end);
      setIsOpen(false);
      setActiveCalendarField(null);
    }
  };

  const handleCancel = () => {
    setStagedOption(value);
    setStagedFrom(customFrom);
    setStagedTo(customTo);
    setActiveCalendarField(null);
    setIsOpen(false);
  };

  // Calendar grid generation for (viewYear, viewMonth)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const activeFieldValue = activeCalendarField === 'from' ? stagedFrom : stagedTo;
  const activeDateObj = parseDateYMD(activeFieldValue);

  const isSelectedDay = (day: number) =>
    activeDateObj.getFullYear() === viewYear &&
    activeDateObj.getMonth() === viewMonth &&
    activeDateObj.getDate() === day;

  const buttonLabel =
    value === 'Custom dates' && customFrom && customTo
      ? `${customFrom} to ${customTo}`
      : value;

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpenToggle}
        className={`bg-[#0B0F19] border rounded-md px-3.5 py-1.5 text-xs text-white flex items-center gap-2.5 cursor-pointer transition-colors ${
          isOpen ? 'border-[#3B82F6]' : 'border-[#1E293B] hover:border-[#3B82F6]'
        }`}
      >
        <span className="truncate max-w-[180px]">{buttonLabel}</span>
        <ChevronDown
          size={13}
          className={`text-[#94A3B8] transition-transform duration-150 ${isOpen ? 'rotate-180 text-white' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-[256px] bg-[#161923] border border-[#2B3142] rounded-lg shadow-2xl z-50 overflow-visible">
          <div className="py-1">
            {PRESET_PERIODS.map(option => {
              const isSelected = stagedOption === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-[#4A526D] text-white font-semibold'
                      : 'text-[#CBD5E1] hover:bg-[#232838] hover:text-white font-medium'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Expanded Custom Dates Form */}
          {stagedOption === 'Custom dates' && (
            <div className="p-4 pt-3 bg-[#161923] border-t border-[#262C3D] rounded-b-lg space-y-3.5 relative">
              {/* From Field */}
              <div>
                <label className="block text-xs font-semibold text-[#E2E8F0] mb-1.5">
                  From <span className="text-[#EF4444]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => openCalendarFor('from')}
                  className={`w-full bg-[#0B0E17] border rounded-lg px-3 py-2 text-[13px] font-semibold text-white flex items-center justify-between cursor-pointer transition-colors ${
                    activeCalendarField === 'from'
                      ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/40'
                      : 'border-[#2E3646] hover:border-[#475569]'
                  }`}
                >
                  <span className="font-mono tracking-tight">{stagedFrom}</span>
                  <Calendar size={15} className="text-[#CBD5E1] shrink-0" />
                </button>
              </div>

              {/* To Field */}
              <div>
                <label className="block text-xs font-semibold text-[#E2E8F0] mb-1.5">
                  To <span className="text-[#EF4444]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => openCalendarFor('to')}
                  className={`w-full bg-[#0B0E17] border rounded-lg px-3 py-2 text-[13px] font-semibold text-white flex items-center justify-between cursor-pointer transition-colors ${
                    activeCalendarField === 'to'
                      ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/40'
                      : 'border-[#2E3646] hover:border-[#475569]'
                  }`}
                >
                  <span className="font-mono tracking-tight">{stagedTo}</span>
                  <Calendar size={15} className="text-[#CBD5E1] shrink-0" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-1.5 rounded-full border border-[#64748B] bg-[#0B0E17] text-xs font-medium text-[#E2E8F0] hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!stagedFrom || !stagedTo}
                  className="px-5 py-1.5 rounded-full bg-[#60A5FA] hover:bg-[#3B82F6] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Apply
                </button>
              </div>

              {/* SLB Optisite Calendar Popover */}
              {activeCalendarField && (
                <div className="absolute right-0 bottom-full mb-2 w-[264px] bg-[#121621] border border-[#2B3142] rounded-lg shadow-2xl p-4 z-[60]">
                  {/* Calendar Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMonthYearSelect(prev => !prev)}
                        className="bg-[#252B3B] hover:bg-[#31394D] text-white text-xs font-bold uppercase px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>
                          {MONTH_SHORT_UPPER[viewMonth]} {viewYear}
                        </span>
                        <ChevronDown size={13} className="text-[#CBD5E1]" />
                      </button>

                      {/* Quick Month/Year Selector Popover */}
                      {showMonthYearSelect && (
                        <div className="absolute left-0 top-full mt-1 w-48 bg-[#161B28] border border-[#2B3142] rounded-lg shadow-xl p-2.5 z-50">
                          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#262C3D]">
                            <button
                              type="button"
                              onClick={() => setViewYear(y => y - 1)}
                              className="p-1 text-[#CBD5E1] hover:text-white cursor-pointer"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-bold text-white">{viewYear}</span>
                            <button
                              type="button"
                              onClick={() => setViewYear(y => y + 1)}
                              className="p-1 text-[#CBD5E1] hover:text-white cursor-pointer"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {MONTH_SHORT_UPPER.map((m, idx) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setViewMonth(idx);
                                  setShowMonthYearSelect(false);
                                }}
                                className={`py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                  idx === viewMonth
                                    ? 'bg-[#3B82F6] text-white'
                                    : 'text-[#CBD5E1] hover:bg-[#252B3B]'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 text-[#CBD5E1] hover:text-white transition-colors cursor-pointer"
                        aria-label="Previous Month"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 text-[#CBD5E1] hover:text-white transition-colors cursor-pointer"
                        aria-label="Next Month"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#94A3B8] pb-2 border-b border-[#232938]">
                    {WEEKDAYS.map(d => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  {/* Month Subheader */}
                  <div className="text-[11px] font-bold uppercase text-[#94A3B8] mt-3 mb-1.5 px-1">
                    {MONTH_SHORT_UPPER[viewMonth]}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-8 h-8" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const selected = isSelectedDay(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDaySelect(day)}
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#3B82F6] text-white shadow-sm'
                              : 'text-[#E2E8F0] hover:bg-[#252B3B] hover:text-white'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

