# User Roles and Framing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement role-based access control (RBAC) framing with Admin ("AD") and Viewer ("VW") roles, disabling control switches/inputs and hiding save/cancel actions in Viewer mode.

**Architecture:** A global React Context (`UserRoleContext`) wrapped in `layout.tsx` storing the active role and persisting it in `localStorage`. The header features an interactive dropdown selection. Tables and modals conditionally render disabled states and adjust titles/labels based on the active role.

**Tech Stack:** React, Next.js (App Router), Tailwind CSS, Lucide React icons.

## Global Constraints
- Persist user role in `localStorage` under the key `'user-role'`.
- The user initials in the avatar must display **"AD"** for Admin and **"VW"** for Viewer.
- Viewer mode must make individual and group switches opaque/faded (`opacity-40` or `opacity-50`) and block interaction (`pointer-events-none`).
- Viewer mode must rename the `"Edit"` action button to `"View"`.
- Viewer mode must disable all editable fields inside the modal (`disabled={true}` or similar) and replace the `"Cancel"` and `"Save"` buttons with a single `"Close"` button.

---

### Task 1: Create Global User Role Context

**Files:**
- Create: `components/context/UserRoleContext.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `useUserRole()` hook returning `{ role: 'admin' | 'viewer', setRole: (role: 'admin' | 'viewer') => void }`.

- [ ] **Step 1: Implement UserRoleContext**
  Create [UserRoleContext.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/context/UserRoleContext.tsx):
  ```tsx
  'use client';
  import { createContext, useContext, useEffect, useState } from 'react';

  type UserRole = 'admin' | 'viewer';

  interface UserRoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
  }

  const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

  export function UserRoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = useState<UserRole>('admin');

    useEffect(() => {
      const saved = localStorage.getItem('user-role') as UserRole | null;
      if (saved === 'admin' || saved === 'viewer') {
        setRoleState(saved);
      }
    }, []);

    const setRole = (newRole: UserRole) => {
      setRoleState(newRole);
      localStorage.setItem('user-role', newRole);
    };

    return (
      <UserRoleContext.Provider value={{ role, setRole }}>
        {children}
      </UserRoleContext.Provider>
    );
  }

  export function useUserRole() {
    const context = useContext(UserRoleContext);
    if (!context) {
      throw new Error('useUserRole must be used within a UserRoleProvider');
    }
    return context;
  }
  ```

- [ ] **Step 2: Wrap Layout with UserRoleProvider**
  Modify [layout.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/layout.tsx):
  ```tsx
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
  ```

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add components/context/UserRoleContext.tsx app/layout.tsx
  git commit -m "feat: implement global UserRoleContext and wrap root layout"
  ```

---

### Task 2: Create Role Selector Dropdown in Topbar

**Files:**
- Modify: `components/layout/Topbar.tsx`

**Interfaces:**
- Consumes: `useUserRole` from `@/components/context/UserRoleContext`.

- [ ] **Step 1: Integrate Role Selector into Topbar**
  Modify [Topbar.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/layout/Topbar.tsx) to implement dropdown trigger and selections:
  ```tsx
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-7 h-7 rounded-full bg-accent-blue-dark hover:bg-accent-blue flex items-center justify-center text-xs font-semibold text-white select-none cursor-pointer transition-colors"
            >
              {initials}
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 top-8 w-32 bg-bg-panel border border-border-panel rounded shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
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
  ```

- [ ] **Step 2: Commit**
  Run:
  ```bash
  git add components/layout/Topbar.tsx
  git commit -m "feat: make topbar user avatar interactive with Admin/Viewer role switcher"
  ```

---

### Task 3: Apply Viewer Constraints in RuleInstanceTable

**Files:**
- Modify: `components/mr-database/RuleInstanceTable.tsx`

**Interfaces:**
- Consumes: `useUserRole` from `@/components/context/UserRoleContext`.

- [ ] **Step 1: Consume User Role Context in Table Component**
  Import the user role hook at the top and call it inside the component:
  ```tsx
  import { useUserRole } from '@/components/context/UserRoleContext';
  ```
  ```tsx
  // Inside RuleInstanceTable:
  const { role } = useUserRole();
  const isViewer = role === 'viewer';
  ```

- [ ] **Step 2: Update Individual and Group Switch Toggles**
  Apply conditional className constraints to group and individual switch toggles to dim them and block interactions:
  - For Group Switch (around line 251):
    ```tsx
    <Switch.Root
      checked={enabledCount > 0}
      onCheckedChange={v => handleGroupSwitchChange(friendlyName, groupRows, v)}
      className={`relative w-10 h-5 rounded-full border border-border-panel bg-bg-panel data-[state=checked]:bg-accent-blue outline-none cursor-pointer transition-colors ${
        isViewer ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
    ```
  - For Individual Switch (around line 281):
    ```tsx
    <Switch.Root
      checked={row.enabled}
      onCheckedChange={v => handleSwitchChange(row, v)}
      className={`relative w-10 h-5 rounded-full border border-border-panel bg-bg-panel data-[state=checked]:bg-accent-blue outline-none cursor-pointer transition-colors ${
        isViewer ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
    ```

- [ ] **Step 3: Update Action Button Label**
  Update the action button label from `"Edit"` to `"View"` when `isViewer` is true (around line 290):
  ```tsx
  <button
    onClick={() => setEditRow(row)}
    className="px-3 py-1 text-xs rounded-full border border-border-panel text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
  >
    {isViewer ? 'View' : 'Edit'}
  </button>
  ```

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add components/mr-database/RuleInstanceTable.tsx
  git commit -m "feat: restrict control switches and rename edit button for Viewer role in MR Database"
  ```

---

### Task 4: Apply Viewer Constraints in EditRuleModal

**Files:**
- Modify: `components/mr-database/EditRuleModal.tsx`

**Interfaces:**
- Consumes: `useUserRole` from `@/components/context/UserRoleContext`.

- [ ] **Step 1: Consume User Role Context in Edit Modal**
  Import the user role hook at the top and call it inside the component:
  ```tsx
  import { useUserRole } from '@/components/context/UserRoleContext';
  ```
  ```tsx
  // Inside EditRuleModal:
  const { role } = useUserRole();
  const isViewer = role === 'viewer';
  ```

- [ ] **Step 2: Disable Input Fields in Viewer Mode**
  Set `disabled={isViewer}` on all input fields inside the modal:
  - Surge threshold value input:
    ```tsx
    <input
      type="number"
      value={thresholdValue}
      disabled={isViewer}
      onChange={...}
      className={inputCls}
    />
    ```
  - Spike height, threshold, distance, prominence inputs:
    ```tsx
    // height:
    <input
      type="number"
      value={heightSpike ?? ''}
      disabled={isViewer}
      onChange={...}
      placeholder="null"
      className={inputCls}
    />
    // threshold:
    <input
      type="number"
      value={thresholdSpike ?? ''}
      disabled={isViewer}
      onChange={...}
      placeholder="null"
      className={inputCls}
    />
    // distance:
    <input
      type="number"
      value={distanceSpike}
      disabled={isViewer}
      onChange={...}
      className={inputCls}
    />
    // prominence:
    <input
      type="number"
      step="0.1"
      value={prominenceSpike}
      disabled={isViewer}
      onChange={...}
      className={inputCls}
    />
    ```
  - Generic round timestamp period input:
    ```tsx
    <input
      value={s.round_timestamp?.period ?? ''}
      disabled={isViewer}
      onChange={...}
      className={inputCls}
    />
    ```

- [ ] **Step 3: Update Modal Title**
  Update the dialog title header to state `"View..."` instead of the default title format when `isViewer` is true:
  ```tsx
  <Dialog.Title className="text-base font-semibold text-text-primary mb-1">
    {isViewer
      ? category === 'surge'
        ? 'View Surge Margin Parameters'
        : category === 'spike'
        ? 'View Spike Detection Parameters'
        : 'Monitoring Rule — Details'
      : category === 'surge'
      ? 'Surge Margin Parameters'
      : category === 'spike'
      ? 'Spike Detection Parameters'
      : 'Monitoring Rule — Details'}
  </Dialog.Title>
  ```

- [ ] **Step 4: Update Modal Footer Buttons**
  Conditionally hide standard `"Cancel"` and `"Save"` buttons and render a single `"Close"` button in Viewer mode:
  ```tsx
  {/* ── Actions ── */}
  <div className="flex justify-end gap-3 border-t border-border-panel pt-4 mt-6">
    {isViewer ? (
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm rounded bg-accent-blue text-white font-medium hover:bg-accent-blue-dark transition-colors"
      >
        Close
      </button>
    ) : (
      <>
        <button
          onClick={onClose}
          className="Marcos px-4 py-2 text-sm rounded border border-border-panel text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm rounded bg-accent-blue text-white font-medium hover:bg-accent-blue-dark disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </>
    )}
  </div>
  ```

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add components/mr-database/EditRuleModal.tsx
  git commit -m "feat: disable form inputs and adapt footer buttons for Viewer mode in EditRuleModal"
  ```

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no typescript compilation errors.
- Run `npm run lint` to verify ESLint compliance.

### Manual Verification
- Open the application in a browser.
- Switch between **Admin** and **Viewer** roles in the top bar.
- Verify user initials inside the circle toggle correctly.
- Verify status toggles inside the catalog table are opaque and cannot be interacted with when Viewer is active.
- Verify the action button says `"View"` in Viewer mode, and opening it renders read-only fields and a `"Close"` button.
