import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monitoring Rules Management',
  description: 'SBM Offshore — Monitoring Rules Management Portal for SLB OptiSite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-base text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}
