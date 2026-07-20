'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Network } from 'lucide-react';

const TABS = [
  { label: 'MR Database',      href: '/' },
  { label: 'Analytics',        href: '/analytics' },
  { label: 'Alert Review',     href: '/alert-review' },
  { label: 'MR Audit Changes', href: '/audit-changes' },
];

export default function NavTabs({ title }: { title: string }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between pt-10 px-6 bg-bg-base border-b border-border-panel">
      <div className="flex items-center gap-2 py-3">
        <div className="w-7 h-7 rounded-full bg-accent-blue-dark flex items-center justify-center text-white border border-[#1e40af] shadow-md shadow-accent-blue/10">
          <Network size={14} />
        </div>
        <ArrowLeft size={18} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors ml-1 mr-0.5" />
        <h1 className="text-lg font-semibold text-text-primary">
          {title}
        </h1>
      </div>
      <nav className="flex items-center">
        {TABS.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 text-sm border-b-2 transition-colors ${
                active
                  ? 'text-accent-blue border-accent-blue font-medium'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
