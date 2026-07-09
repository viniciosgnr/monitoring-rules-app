# Alert Review KPI Cards Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "Total Alerts" KPI behavior to count all alerts (including resolved ones) while only passing pending alerts to the table view.

---

### Task 1: Update app/alert-review/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/alert-review/page.tsx)

- [ ] **Step 1: Retrieve all alerts, filter pending rows for table, and revert KPI card**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/alert-review/page.tsx).
  Remove `or` import and the `.where(...)` filter clause from the database query.
  In `AlertReviewPage`:
  - Calculate `toBeValidated` using `.filter(r => r.status === 'to_be_validated').length`
  - Calculate `inProgress` using `.filter(r => r.status === 'validation_in_progress').length`
  - Calculate `total` using `rows.length` (representing all-time alerts)
  
  Create `pendingRows`:
  ```typescript
  const pendingRows = serialized.filter(
    r => r.status === 'to_be_validated' || r.status === 'validation_in_progress'
  );
  ```
  Revert the third KPI card to "Total Alerts":
  ```typescript
  <KpiCard
    title="Total Alerts"
    value={total}
    subtitle="All statuses"
    tooltip="Total number of alerts across all monitoring rules and equipment for the selected period."
  />
  ```
  Pass `pendingRows` to the table:
  ```typescript
  <AlertTable rows={pendingRows} />
  ```

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
