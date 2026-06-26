import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/context/ThemeContext';
import { UserRoleProvider } from '@/components/context/UserRoleContext';

export const metadata: Metadata = {
  title: 'Monitoring Rules Management',
  description: 'SBM Offshore — Monitoring Rules Management Portal for SLB OptiSite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })()
            `,
          }}
        />
      </head>
      <body className="bg-bg-base text-text-primary min-h-screen">
        <UserRoleProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </UserRoleProvider>
      </body>
    </html>
  );
}

