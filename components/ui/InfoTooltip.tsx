'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  title?: string;
  formula?: string;
  description: string;
  statusList?: string[];
  align?: 'left' | 'right' | 'center';
  className?: string;
  size?: number;
}

export default function InfoTooltip({
  title,
  formula,
  description,
  statusList,
  align = 'left',
  className = '',
  size = 13,
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsVisible(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    }
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const alignmentClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        aria-label="Informações sobre o cálculo"
        onClick={e => {
          e.stopPropagation();
          setIsVisible(prev => !prev);
        }}
        className="text-[#64748B] hover:text-[#38BDF8] transition-colors p-0.5 rounded cursor-pointer focus:outline-none"
      >
        <Info size={size} />
      </button>

      {isVisible && (
        <div
          className={`absolute bottom-full mb-2 ${alignmentClass} w-72 bg-[#121622] border border-[#262E42] rounded-xl shadow-2xl p-3 z-50 text-left pointer-events-none animate-in fade-in-50 zoom-in-95 duration-150`}
        >
          {title && (
            <div className="font-semibold text-white text-xs mb-1.5 flex items-center justify-between border-b border-[#232A3D] pb-1.5">
              <span>{title}</span>
              <span className="text-[10px] text-[#38BDF8] font-mono">Definição</span>
            </div>
          )}

          {formula && (
            <div className="mb-2 bg-[#0A0D14] border border-[#1E2536] rounded-md px-2 py-1 text-[11px] font-mono text-[#60A5FA] break-words">
              <span className="text-[#94A3B8] font-sans mr-1">Fórmula:</span>
              {formula}
            </div>
          )}

          <p className="text-[11px] text-[#CBD5E1] leading-relaxed mb-2">
            {description}
          </p>

          {statusList && statusList.length > 0 && (
            <div className="pt-1.5 border-t border-[#1E2536] text-[10px] text-[#94A3B8]">
              <span className="font-medium text-[#E2E8F0]">Status considerados: </span>
              {statusList.join(', ')}
            </div>
          )}

          {/* Tooltip triangle tail */}
          <div
            className={`absolute top-full -mt-[1px] w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#262E42] ${
              align === 'right'
                ? 'right-2'
                : align === 'center'
                ? 'left-1/2 -translate-x-1/2'
                : 'left-2'
            }`}
          />
        </div>
      )}
    </div>
  );
}
