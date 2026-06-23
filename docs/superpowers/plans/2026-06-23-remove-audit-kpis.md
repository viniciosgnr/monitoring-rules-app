# Remove Audit KPI Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the 4 KPI cards from the MR Audit Changes page.

**Architecture:** Remove the KPI cards layout and their associated props from the `AuditClient` component, and stop passing those props from the page component.

**Tech Stack:** Next.js App Router, Tailwind CSS, TypeScript

## Global Constraints

- No layout breakage: the rest of the MR Audit Changes page must remain properly styled.
- No TypeScript or ESLint errors.

---

### Task 1: Modify `AuditClient.tsx` and `page.tsx`

**Files:**
- Modify: `components/audit-changes/AuditClient.tsx`
- Modify: `app/audit-changes/page.tsx`

**Interfaces:**
- Consumes: None
- Produces: Omit KPI props from `AuditClient` component signature

- [ ] **Step 1: Edit components/audit-changes/AuditClient.tsx**

Remove the KPI card related props and JSX, and remove the `KpiCard` import.

```tsx
'use client';
import AuditHistoryTable from './AuditHistoryTable';

interface AuditEntry {
  id: number;
  timestamp: string;
  userEmail: string;
  equipmentCode: string;
  ruleName: string;
  description: string;
  beforeState: object;
  afterState: object;
  [key: string]: unknown;
}

interface Props {
  auditRows: AuditEntry[];
}

export default function AuditClient({
  auditRows,
}: Props) {
  return (
    <>
      {/* Audit History */}
      <AuditHistoryTable rows={auditRows} />
    </>
  );
}
```

- [ ] **Step 2: Edit app/audit-changes/page.tsx**

Remove the props passed to `AuditClient`.

```tsx
        <AuditClient
          auditRows={serialized}
        />
```

- [ ] **Step 3: Run ESLint verification**

Run: `npm run lint`
Expected: PASS with no lint errors or warnings.

- [ ] **Step 4: Run build verification**

Run: `npm run build`
Expected: PASS with successful next.js compile.

- [ ] **Step 5: Commit changes**

Run: `git add components/audit-changes/AuditClient.tsx app/audit-changes/page.tsx && git commit -m "feat: remove KPI cards from MR Audit Changes page"`
Expected: PASS
