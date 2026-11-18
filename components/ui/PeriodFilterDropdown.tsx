'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Calendar } from 'lucide-react';

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
  customFrom: string; // YYYY-MM-DD HH:mm:ss (or YYYY-MM-DD)
  customTo: string;   // YYYY-MM-DD HH:mm:ss (or YYYY-MM-DD)
  onSelectPreset: (period: Exclude<PresetPeriod, 'Custom dates'>) => void;
  onApplyCustomDates: (from: string, to: string) => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeDateTimeStr(val: string, defaultTime: '00:00:00' | '23:59:59'): string {
  const trimmed = (val || '').trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} ${defaultTime}`;
  }
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const clean = trimmed.replace('T', ' ');
    return clean.length === 16 ? `${clean}:00` : clean;
  }
  return trimmed;
}

function parseDateTime(val: string, defaultTime: '00:00:00' | '23:59:59'): Date {
  const norm = normalizeDateTimeStr(val, defaultTime);
  const [datePart, timePart] = norm.split(' ');
  const [y, m, d] = (datePart || '').split('-').map(Number);
  const [hh, mm, ss] = (timePart || defaultTime).split(':').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, isNaN(ss) ? 0 : ss);
}

function formatDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
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
  const [stagedFrom, setStagedFrom] = useState<string>(() => normalizeDateTimeStr(customFrom, '00:00:00'));
  const [stagedTo, setStagedTo] = useState<string>(() => normalizeDateTimeStr(customTo, '23:59:59'));

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
      setStagedFrom(normalizeDateTimeStr(customFrom, '00:00:00'));
      setStagedTo(normalizeDateTimeStr(customTo, '23:59:59'));
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
      if (!stagedFrom) {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        d.setHours(0, 0, 0, 0);
        setStagedFrom(formatDateTime(d));
      }
      if (!stagedTo) {
        const d = new Date();
        d.setHours(23, 59, 59, 0);
        setStagedTo(formatDateTime(d));
      }
    }
  };

  const openCalendarFor = (field: 'from' | 'to') => {
    if (activeCalendarField === field) {
      setActiveCalendarField(null);
      return;
    }
    const targetVal = field === 'from' ? stagedFrom : stagedTo;
    const parsed = parseDateTime(targetVal, field === 'from' ? '00:00:00' : '23:59:59');
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
    setShowMonthYearSelect(false);
    setActiveCalendarField(field);
  };

  const handleDaySelect = (day: number) => {
    if (!activeCalendarField) return;
    const current = parseDateTime(
      activeCalendarField === 'from' ? stagedFrom : stagedTo,
      activeCalendarField === 'from' ? '00:00:00' : '23:59:59'
    );
    const updated = new Date(
      viewYear,
      viewMonth,
      day,
      current.getHours(),
      current.getMinutes(),
      current.getSeconds()
    );
    const formatted = formatDateTime(updated);
    if (activeCalendarField === 'from') {
      setStagedFrom(formatted);
    } else {
      setStagedTo(formatted);
    }
  };

  const updateTimeUnit = (unit: 'hours' | 'minutes' | 'seconds', delta: number) => {
    if (!activeCalendarField) return;
    const current = parseDateTime(
      activeCalendarField === 'from' ? stagedFrom : stagedTo,
      activeCalendarField === 'from' ? '00:00:00' : '23:59:59'
    );
    if (unit === 'hours') {
      current.setHours((current.getHours() + delta + 24) % 24);
    } else if (unit === 'minutes') {
      current.setMinutes((current.getMinutes() + delta + 60) % 60);
    } else {
      current.setSeconds((current.getSeconds() + delta + 60) % 60);
    }
    const formatted = formatDateTime(current);
    if (activeCalendarField === 'from') {
      setStagedFrom(formatted);
    } else {
      setStagedTo(formatted);
    }
  };

  const setTimeUnitExact = (unit: 'hours' | 'minutes' | 'seconds', raw: string) => {
    if (!activeCalendarField) return;
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    const current = parseDateTime(
      activeCalendarField === 'from' ? stagedFrom : stagedTo,
      activeCalendarField === 'from' ? '00:00:00' : '23:59:59'
    );
    if (unit === 'hours') {
      current.setHours(Math.min(23, Math.max(0, num)));
    } else if (unit === 'minutes') {
      current.setMinutes(Math.min(59, Math.max(0, num)));
    } else {
      current.setSeconds(Math.min(59, Math.max(0, num)));
    }
    const formatted = formatDateTime(current);
    if (activeCalendarField === 'from') {
      setStagedFrom(formatted);
    } else {
      setStagedTo(formatted);
    }
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
      const fromNorm = normalizeDateTimeStr(stagedFrom, '00:00:00');
      const toNorm = normalizeDateTimeStr(stagedTo, '23:59:59');
      const start = fromNorm <= toNorm ? fromNorm : toNorm;
      const end = fromNorm <= toNorm ? toNorm : fromNorm;
      onApplyCustomDates(start, end);
      setIsOpen(false);
      setActiveCalendarField(null);
    }
  };

  const handleCancel = () => {
    setStagedOption(value);
    setStagedFrom(normalizeDateTimeStr(customFrom, '00:00:00'));
    setStagedTo(normalizeDateTimeStr(customTo, '23:59:59'));
    setActiveCalendarField(null);
    setIsOpen(false);
  };

  // Calendar grid generation for (viewYear, viewMonth)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const activeFieldValue = activeCalendarField === 'from' ? stagedFrom : stagedTo;
  const activeDateObj = parseDateTime(activeFieldValue, activeCalendarField === 'from' ? '00:00:00' : '23:59:59');

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
        <span className="truncate max-w-[260px]">{buttonLabel}</span>
        <ChevronDown
          size={13}
          className={`text-[#94A3B8] transition-transform duration-150 ${isOpen ? 'rotate-180 text-white' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-[264px] bg-[#161923] border border-[#2B3142] rounded-lg shadow-2xl z-50 overflow-visible">
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
                  className={`w-full bg-[#0B0E17] border rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white flex items-center justify-between cursor-pointer transition-colors ${
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
                  className={`w-full bg-[#0B0E17] border rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white flex items-center justify-between cursor-pointer transition-colors ${
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

              {/* SLB Optisite Calendar & Time Popover */}
              {activeCalendarField && (
                <div className="absolute right-full top-0 mr-2 w-[272px] bg-[#121621] border border-[#2B3142] rounded-lg shadow-2xl p-4 z-[60]">
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
                  <div className="grid grid-cols-7 gap-y-1 text-center pb-3 border-b border-[#232938]">
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

                  {/* SLB Optisite Time Spinner (HH : mm : ss) */}
                  <div className="pt-3 flex items-center justify-center gap-2.5">
                    {/* Hours */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateTimeUnit('hours', 1)}
                        className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                        aria-label="Increase hours"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <input
                        type="text"
                        value={pad2(activeDateObj.getHours())}
                        onChange={e => setTimeUnitExact('hours', e.target.value)}
                        className="w-11 h-9 bg-[#0B0E17] border border-[#2E3646] focus:border-[#3B82F6] rounded-md text-center text-xs font-semibold font-mono text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateTimeUnit('hours', -1)}
                        className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                        aria-label="Decrease hours"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-[#94A3B8]">:</span>

                    {/* Minutes */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateTimeUnit('minutes', 1)}
                        className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                        aria-label="Increase minutes"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <input
                        type="text"
                        value={pad2(activeDateObj.getMinutes())}
                        onChange={e => setTimeUnitExact('minutes', e.target.value)}
                        className="w-11 h-9 bg-[#0B0E17] border border-[#2E3646] focus:border-[#3B82F6] rounded-md text-center text-xs font-semibold font-mono text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateTimeUnit('minutes', -1)}
                        className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                        aria-label="Decrease minutes"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-[#94A3B8]">:</span>

                    {/* Seconds */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateTimeUnit('seconds', 1)}
                        className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                        aria-label="Increase seconds"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <input
                        type="text"
                        value={pad2(activeDateObj.getSeconds())}
                        onChange={e => setTimeUnitExact('seconds', e.target.value)}
                        className="w-11 h-9 bg-[#0B0E17] border border-[#2E3646] focus:border-[#3B82F6] rounded-md text-center text-xs font-semibold font-mono text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateTimeUnit('seconds', -1)}
                        className="p-0.5 text-[#CBD5E1] hover:text-white cursor-pointer"
                        aria-label="Decrease seconds"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
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
