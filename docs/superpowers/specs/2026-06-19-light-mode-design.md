# Light Mode — Design Spec

**Date:** 2026-06-19  
**Author:** Antigravity Developer  
**Status:** Under Review

## Goal
Implement a clean, premium Light Mode for the SBM Offshore Monitoring Rules Management portal, matching SLB OptiSite design aesthetics. The user will be able to switch between Light Mode and Dark Mode dynamically using a toggle button in the `Topbar` component, and their preference will persist in `localStorage`.

## Proposed Changes

### 1. Theme Configuration & Design Tokens
We will map static hex colors in `tailwind.config.ts` to CSS custom variables that resolve dynamically based on the active theme:

```typescript
// tailwind.config.ts
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
}
```

### 2. Global Stylesheets Configuration
Configure the CSS custom variable definitions for Light and Dark modes:

```css
/* app/globals.css */
:root {
  /* Light Mode values (Default) */
  --bg-base: #f8fafc;
  --bg-panel: #ffffff;
  --bg-card: #ffffff;
  --border-panel: #e2e8f0;
  --accent-blue: #0f4c81;       /* Classic SLB corporate blue */
  --accent-blue-dark: #0a3356;
  --accent-purple: #8b5cf6;
  --accent-pink: #db2777;
  --accent-cyan: #06b6d4;
  --status-ok: #16a34a;
  --status-error: #dc2626;
  --status-warn: #d97706;
  --text-primary: #0f172a;      /* slate-900 */
  --text-muted: #475569;        /* slate-600 */
  --topbar: #ffffff;
  --bg-input: #ffffff;
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
}
```

We will also adjust custom classes to be theme-aware:
- **Scrollbars**: Apply background colors matching `var(--bg-base)` and handle thumb colors dynamically.
- **Equipment Badge (`.equipment-badge`)**:
  - Light mode: Fundo `#eff6ff`, borda `#bfdbfe`, texto `#0f4c81`.
  - Dark mode: Fundo `#0f1d3a`, borda `#1d4ed8`, texto `#38bdf8`.
- **Topbar**: In light mode, it has a white background (`--topbar` = `#ffffff`) with a bottom border of `var(--border-panel)`.

### 3. Theme Provider
Create a Next.js Client Component `ThemeProvider` in `components/context/ThemeContext.tsx`.
- Reads initial theme preference from `localStorage`. Defaults to `dark` if not set (retaining existing dark experience out-of-the-box).
- Provides toggling function and current theme state.
- Updates the `data-theme` attribute (or `class="dark"`) on the `html` element.
- Wraps the root layout in `app/layout.tsx`.

To prevent "flash" of light/dark theme on page load, we will inject a blocking script in `app/layout.tsx` before React hydration:
```html
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    var theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
  })()
`}} />
```

### 4. Theme Toggle Button
A simple Sol/Lua toggle button will be placed in `components/layout/Topbar.tsx` to switch themes.

### 5. Cleaning Hardcoded Classes
Refactor references to hardcoded dark backgrounds inside inputs, dropdowns, and modals to use dynamic theme variables (e.g. replacing `bg-[#0b0f1a]` with `bg-bg-input` or `bg-bg-base`, and ensuring modals are styled with `bg-bg-panel` and `border-border-panel`).
