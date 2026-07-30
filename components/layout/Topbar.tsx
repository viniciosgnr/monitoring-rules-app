'use client';
import Image from 'next/image';
import { HelpCircle, Home, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/context/ThemeContext';
import { useUserRole } from '@/components/context/UserRoleContext';
import { useState, useEffect, useRef } from 'react';

export default function Topbar({ breadcrumb }: { breadcrumb: string }) {
  const { theme, toggleTheme } = useTheme();
  const { role, setRole } = useUserRole();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const initials = role === 'admin' ? 'AD' : 'VW';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-topbar border-b border-border-panel flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* SLB Logo — larger to match Figma */}
        <Image
          src="/slb-logo.png"
          alt="SLB"
          width={68}
          height={32}
          priority
          className="h-8 w-auto object-contain"
        />
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <Home size={13} className="flex-shrink-0" />
          <span className="mx-1">›</span>
          <span>Monitoring Rules</span>
          <span className="mx-1">›</span>
          <span className="text-text-primary font-medium">{breadcrumb}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-bg-base/50 transition-colors flex items-center justify-center cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <HelpCircle size={16} className="text-text-muted hover:text-text-primary cursor-pointer transition-colors" />

        {/* User Profile Selector Dropdown */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-7 h-7 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] flex items-center justify-center text-xs font-medium text-white select-none cursor-pointer transition-colors"
          >
            {initials}
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-9 w-60 bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl p-3 z-50 select-none">
              {/* Header inside popover matching Image 1 */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E293B]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTheme}
                    className="text-[#94A3B8] hover:text-white transition-colors"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                  </button>
                  <HelpCircle size={17} className="text-[#94A3B8] hover:text-white cursor-pointer transition-colors" />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-xs font-semibold text-white">
                  {initials}
                </div>
              </div>

              {/* Role Selection List matching Image 1 */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setRole('admin');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-normal transition-colors flex items-center justify-between cursor-pointer ${
                    role === 'admin'
                      ? 'bg-[#2B3B55] text-white font-medium'
                      : 'text-[#94A3B8] hover:bg-[#1E293B]/60 hover:text-white'
                  }`}
                >
                  <span>Admin</span>
                  {role === 'admin' && <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-sm" />}
                </button>

                <button
                  onClick={() => {
                    setRole('viewer');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-normal transition-colors flex items-center justify-between cursor-pointer ${
                    role === 'viewer'
                      ? 'bg-[#2B3B55] text-white font-medium'
                      : 'text-[#94A3B8] hover:bg-[#1E293B]/60 hover:text-white'
                  }`}
                >
                  <span>Viewer</span>
                  {role === 'viewer' && <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-sm" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

