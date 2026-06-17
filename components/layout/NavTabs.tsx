'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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
      <h1 className="flex items-center gap-2 text-lg font-semibold text-text-primary py-3">
        <ArrowLeft size={18} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
        {title}
      </h1>
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
