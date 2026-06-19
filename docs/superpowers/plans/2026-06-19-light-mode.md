# Light Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic Light and Dark mode options for SBM Offshore's Monitoring Rules Management portal, matching SLB OptiSite design guidelines, using React Context and CSS Custom Variables.

**Architecture:** We will map colors in `tailwind.config.ts` to CSS custom variables that are defined under `:root` (Light mode) and `[data-theme="dark"]` (Dark mode) in `globals.css`. A React Context-based `ThemeProvider` will toggle the `data-theme` attribute on the HTML element and persist the preference in `localStorage`.

**Tech Stack:** Next.js, Tailwind CSS, Lucide React (for Sun/Moon icons).

## Global Constraints
- Target workspace directory: `/home/marcosgnr/Monitoring Rules Management/monitoring-rules-app`
- Initial theme must default to `dark` to preserve original visual styles out of the box.
- Avoid flash of unstyled content (FOUC) on client-side by injecting a blocking theme initialization script in the root layout.

---

### Task 1: Create Theme Provider and Configure Layout

**Files:**
- Create: `components/context/ThemeContext.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: Nothing
- Produces: `ThemeContext`, `ThemeProvider` component, and `useTheme` hook.

- [ ] **Step 1: Create the ThemeProvider component**

Write `components/context/ThemeContext.tsx`:
```tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read preference on load
    const saved = localStorage.getItem('theme') as Theme | null;
    const initialTheme = saved || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

- [ ] **Step 2: Update the Root Layout to wrap with ThemeProvider and inject blocking script**

Modify `app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/context/ThemeContext';

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
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Run dev build to verify no compilation errors**

Run: `npm run build` in `/home/marcosgnr/Monitoring Rules Management/monitoring-rules-app`
Expected: Next.js build succeeds with no TypeScript or linting errors on the layout.

---

### Task 2: Configure Tailwind Colors and Global Styles

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: CSS custom variables from stylesheet inside components.
- Produces: CSS custom variables linked to tailwind theme colors.

- [ ] **Step 1: Modify Tailwind configuration to link to CSS variables**

Modify `tailwind.config.ts` colors block:
```typescript
      colors: {
        "bg-base":          "var(--bg-base)",
        "bg-panel":         "var(--bg-panel)",
        "bg-card":          "var(--bg-card)",
        "border-panel":     "var(--border-panel)",
        "accent-blue":      "var(--accent-blue)",
        "accent-blue-dark": "var(--accent-blue-dark)",
        "accent-purple":    "var(--accent-purple)",
        "accent-pink":      "var(--accent-pink)",
        "accent-cyan":      "var(--accent-cyan)",
        "status-ok":        "var(--status-ok)",
        "status-error":     "var(--status-error)",
        "status-warn":      "var(--status-warn)",
        "text-primary":     "var(--text-primary)",
        "text-muted":       "var(--text-muted)",
        "topbar":           "var(--topbar)",
        "bg-input":         "var(--bg-input)",
        "bg-banner":        "var(--bg-banner)",
        "bg-highlight":     "var(--bg-highlight)",
      },
```

- [ ] **Step 2: Update global stylesheet with dynamic variables and theme modifications**

Modify `app/globals.css` to define the `:root` and `[data-theme="dark"]` colors, and update custom classes for theme compatibility:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Light Mode values (Default/SLB OptiSite) */
  --bg-base: #f8fafc;
  --bg-panel: #ffffff;
  --bg-card: #ffffff;
  --border-panel: #cbd5e1;
  --accent-blue: #0f4c81;       /* Classic SLB corporate blue */
  --accent-blue-dark: #0a3356;
  --accent-purple: #8b5cf6;
  --accent-pink: #db2777;
  --accent-cyan: #0284c7;
  --status-ok: #16a34a;
  --status-error: #dc2626;
  --status-warn: #d97706;
  --text-primary: #0f172a;      /* slate-900 */
  --text-muted: #475569;        /* slate-600 */
  --topbar: #ffffff;
  --bg-input: #ffffff;
  --bg-banner: #eff6ff;         /* Light blue info banner background */
  --bg-highlight: #f1f5f9;      /* Light gray comparison context background */
}

[data-theme="dark"] {
  /* Dark Mode values (Original theme) */
  --bg-base: #0b0f1a;
  --bg-panel: #111827;
  --bg-card: #141e2e;
  --border-panel: #1e2a3a;
  --accent-blue: #0ea5e9;
  --accent-blue-dark: #1d4ed8;
  --accent-purple: #a855f7;
  --accent-pink: #ec4899;
  --accent-cyan: #22d3ee;
  --status-ok: #22c55e;
  --status-error: #ef4444;
  --status-warn: #f59e0b;
  --text-primary: #e2e8f0;
  --text-muted: #64748b;
  --topbar: #0c1220;
  --bg-input: #0b0f1a;
  --bg-banner: #0b1329;         /* Dark blue info banner background */
  --bg-highlight: #080c14;      /* Dark gray comparison context background */
}

* { box-sizing: border-box; }

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.15s ease, color 0.15s ease;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--border-panel); border-radius: 3px; }

/* KPI card accent line */
.kpi-bar {
  height: 2px;
  background: linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-blue-dark) 100%);
  border-radius: 1px;
  margin: 8px 0 6px 0;
}

/* Equipment badge pill */
.equipment-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-family: monospace;
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.025em;
  transition: all 0.15s ease;
}

/* Light mode specific override for badge */
html:not(.dark) .equipment-badge {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #0f4c81;
}

/* Dark mode specific override for badge */
html.dark .equipment-badge {
  background: #0f1d3a;
  border: 1px solid #1d4ed8;
  color: #38bdf8;
}

/* Table column filter input */
.filter-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-panel);
  font-size: 11px;
  color: var(--text-muted);
  outline: none;
  padding-bottom: 3px;
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

/* Micro-animations */
button { transition: opacity 0.15s ease, transform 0.1s ease; }
button:active { transform: scale(0.97); }
tr { transition: background-color 0.15s ease; }

/* Panel hover */
.hover-panel:hover { border-color: var(--accent-blue-dark); }
```

- [ ] **Step 3: Run the build to verify no errors**

Run: `npm run build` in `/home/marcosgnr/Monitoring Rules Management/monitoring-rules-app`
Expected: PASS

---

### Task 3: Implement Theme Toggle Button in Topbar

**Files:**
- Modify: `components/layout/Topbar.tsx`

**Interfaces:**
- Consumes: `useTheme` from `components/context/ThemeContext`
- Produces: Theme toggle button interface

- [ ] **Step 1: Import theme context and render Sun/Moon icons in Topbar**

Modify `components/layout/Topbar.tsx`:
```tsx
'use client';
import Image from 'next/image';
import { HelpCircle, Home, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/context/ThemeContext';

export default function Topbar({ breadcrumb }: { breadcrumb: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-topbar border-b border-border-panel flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* SLB Logo */}
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
          className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-bg-base/50 transition-colors flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <HelpCircle size={16} className="text-text-muted hover:text-text-primary cursor-pointer transition-colors" />
        <div className="w-7 h-7 rounded-full bg-accent-blue-dark flex items-center justify-center text-xs font-semibold text-white select-none">
          EP
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build` in `/home/marcosgnr/Monitoring Rules Management/monitoring-rules-app`
Expected: PASS

---

### Task 4: Refactor Hardcoded Dark Background Colors

**Files:**
- Modify: `components/mr-database/EditRuleModal.tsx`
- Modify: `components/mr-database/RuleInstanceTable.tsx`
- Modify: `components/audit-changes/ParamDiffModal.tsx`

**Interfaces:**
- Consumes: Nothing
- Produces: Dynamic layout variables

- [ ] **Step 1: Replace hardcoded colors in EditRuleModal.tsx**

Modify `components/mr-database/EditRuleModal.tsx` (line 23-24):
```typescript
const inputCls =
  'w-full mt-1 bg-bg-input border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors';
```

- [ ] **Step 2: Replace hardcoded colors in RuleInstanceTable.tsx**

Modify `components/mr-database/RuleInstanceTable.tsx`:
- Line 167 (Filter button):
```diff
-          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-[#0b1329] border border-border-panel text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
+          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-bg-panel border border-border-panel text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
```
- Line 311 (Edit Rule Modal Inputs):
```diff
-                  className="w-full mt-1.5 bg-[#0b0f1a] border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors"
+                  className="w-full mt-1.5 bg-bg-input border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors"
```
- Line 327 (Edit Rule Modal Textarea):
```diff
-                    className="w-full mt-1.5 bg-[#0b0f1a] border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors h-24 resize-none"
+                    className="w-full mt-1.5 bg-bg-input border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors h-24 resize-none"
```

- [ ] **Step 3: Replace hardcoded colors in ParamDiffModal.tsx**

Modify `components/audit-changes/ParamDiffModal.tsx`:
- Line 120 (Status change banner background):
```diff
-              <div className="p-5 rounded-card bg-[#0b1329] border-l-4 border-accent-blue text-sm text-text-primary flex gap-4">
+              <div className="p-5 rounded-card bg-bg-banner border-l-4 border-accent-blue text-sm text-text-primary flex gap-4">
```
- Line 141 (Abs value parameter card background):
```diff
-                <div className="bg-[#080c14]/60 border border-border-panel/80 rounded-card p-4">
+                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
```
- Line 196 (Drop missing parameter card background):
```diff
-                <div className="bg-[#080c14]/60 border border-border-panel/80 rounded-card p-4">
+                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
```
- Line 251 (Join timeseries parameter card background):
```diff
-                <div className="bg-[#080c14]/60 border border-border-panel/80 rounded-card p-4">
+                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
```
- Line 306 (Round timestamp parameter card background):
```diff
-                <div className="bg-[#080c14]/60 border border-border-panel/80 rounded-card p-4">
+                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
```

- [ ] **Step 4: Verify the build**

Run: `npm run build` in `/home/marcosgnr/Monitoring Rules Management/monitoring-rules-app`
Expected: PASS

---

### Task 5: Verify Theme Switching and LocalStorage Persistence

**Files:**
- None

**Interfaces:**
- Consumes: Nothing
- Produces: Correct layout render on local browser

- [ ] **Step 1: Check build & run dev server**

Run: `npm run build`
Expected: Successfully generates static optimized outputs for Next.js app.
