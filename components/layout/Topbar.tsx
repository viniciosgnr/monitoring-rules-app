import Image from 'next/image';
import { HelpCircle } from 'lucide-react';

export default function Topbar({ breadcrumb }: { breadcrumb: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-topbar border-b border-border-panel flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* SLB Logo */}
        <Image
          src="/slb-logo.png"
          alt="SLB"
          width={40}
          height={24}
          priority
          className="object-contain"
        />
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>Home</span>
          <span className="mx-1">›</span>
          <span>Monitoring Rules</span>
          <span className="mx-1">›</span>
          <span className="text-text-primary">{breadcrumb}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <HelpCircle size={16} className="text-text-muted hover:text-text-primary cursor-pointer transition-colors" />
        <div className="w-7 h-7 rounded-full bg-accent-blue-dark flex items-center justify-center text-xs font-semibold text-white select-none">
          EP
        </div>
      </div>
    </header>
  );
}
