# Parameter Traceability Implementation Plan (Simplified)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the parameter change traceability feature by removing the "Parameter Change History" timeline from the UI while preserving the backend database logging and the client-side "Previous value: X" inputs comparison indicators.

**Architecture:** Remove history timeline rendering markup, queries, states, and hooks from the modal component. Keep parameter logging in `updateProcessingSteps`.

**Tech Stack:** React, Next.js, Drizzle ORM.

---

### Task 1: Clean Up Unused UI Timeline and Logs Fetching in EditRuleModal.tsx

**Files:**
- Modify: `components/mr-database/EditRuleModal.tsx`

- [ ] **Step 1: Remove timeline queries, states, and helpers**
  Open [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx).
  - Remove `history` state: `const [history, setHistory] = useState<AuditLogEntry[]>([]);`.
  - Remove `useEffect` that fetches audit logs on mount.
  - Remove `getDiffElements` helper function.
  - Remove `AuditLogEntry` type interface if it is no longer used.

- [ ] **Step 2: Remove Parameter Change History timeline markup**
  Remove the timeline rendering block (around lines 533-560) right before `/* ── Actions ── */`:
  ```tsx
            {/* Parameter Change History */}
            <div className="border-t border-border-panel mt-6 pt-5">
              ...
            </div>
  ```

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add components/mr-database/EditRuleModal.tsx
  git commit -m "feat: simplify EditRuleModal UI by removing parameter change history timeline"
  ```

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Testing**
  - Open a rule instance Edit modal.
  - Modify a parameter (e.g. Height/Threshold value) and verify that "Previous value: X" appears dynamically underneath.
  - Revert the change and verify the label disappears.
  - Verify that no parameter change history list is visible at the bottom of the modal, ensuring layout simplicity.
