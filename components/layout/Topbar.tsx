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
    <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-topbar border-b border-white/10 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* SLB Logo — rendered white to match Figma on cobalt blue background */}
        <Image
          src="/slb-logo.png"
          alt="SLB"
          width={68}
          height={32}
          priority
          className="h-8 w-auto object-contain brightness-0 invert"
        />
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-white/70">
          <Home size={13} className="flex-shrink-0 text-white/70" />
          <span className="mx-1 text-white/30">›</span>
          <span className="text-white/70">Monitoring Rules</span>
          <span className="mx-1 text-white/30">›</span>
          <span className="text-white font-medium">{breadcrumb}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-white/75 hover:text-white p-1 rounded hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
 
        <HelpCircle size={16} className="text-white/75 hover:text-white cursor-pointer hover:bg-white/10 p-1 rounded transition-colors" />
 
        {/* User Profile Selector Dropdown */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-xs font-semibold text-white select-none cursor-pointer transition-colors"
          >
            {initials}
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-8 w-32 bg-bg-panel border border-border-panel rounded shadow-xl py-1 z-50">
              <button
                onClick={() => {
                  setRole('admin');
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-bg-base/50 transition-colors flex items-center justify-between cursor-pointer ${
                  role === 'admin' ? 'text-accent-blue font-semibold' : 'text-text-primary'
                }`}
              >
                <span>Admin</span>
                {role === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />}
              </button>
              <button
                onClick={() => {
                  setRole('viewer');
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-bg-base/50 transition-colors flex items-center justify-between cursor-pointer ${
                  role === 'viewer' ? 'text-accent-blue font-semibold' : 'text-text-primary'
                }`}
              >
                <span>Viewer</span>
                {role === 'viewer' && <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

