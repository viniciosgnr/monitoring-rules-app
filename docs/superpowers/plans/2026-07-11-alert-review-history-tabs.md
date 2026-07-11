# Alert Review History & Columns Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the database fields `End Date`, `Reviewed At`, and `Reviewed By` to the Alert Review table, load all statuses from the server, and introduce a tab selector ('Pending Action' (default), 'Reviewed History', and 'All Alerts') to keep operators focused on active tasks while allowing review of completed events.

---

### Task 1: Update app/alert-review/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/alert-review/page.tsx)

- [ ] **Step 1: Load all alerts, including validated/rejected**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/alert-review/page.tsx).
  Pass the full `serialized` array (which contains all statuses) to the `AlertTable` component instead of `pendingRows`.

---

### Task 2: Update components/alert-review/AlertTable.tsx

**Files:**
- Modify: [AlertTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/alert-review/AlertTable.tsx)

- [ ] **Step 1: Add status scope tab filtering**
  Define a `statusScope` state:
  ```typescript
  const [statusScope, setStatusScope] = useState<'pending' | 'reviewed' | 'all'>('pending');
  ```
  Filter rows based on `statusScope`:
  - `'pending'`: `status === 'to_be_validated' || status === 'validation_in_progress'`
  - `'reviewed'`: `status === 'validated' || status === 'rejected' || status === 'closed'`
  - `'all'`: show all statuses.

- [ ] **Step 2: Render status scope tabs in control bar**
  Add the tab selector button group next to the search input and period filters.

- [ ] **Step 3: Restore columns to headers and cells**
  Add headers and cell render logic for:
  - `End Date`
  - `Reviewed At`
  - `Reviewed By`
  Adjust `colSpan={10}` on the rule group headers, and `colSpan={11}` on the empty message.

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
