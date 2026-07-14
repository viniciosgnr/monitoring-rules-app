# Auto-Enable Expired Rule Instances in MR Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auto-enable behavior for rule instances when their deactivation period expires. When a page loads the MR Database screen, check if any disabled instances have passed their `deactivatedUntil` date. If so, automatically update their database status to enabled, write system audit logs, and display them as active/enabled in the UI.

---

### Task 1: Update app/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/page.tsx)

- [ ] **Step 1: Update Imports**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/page.tsx).
  - Import `inArray` from `drizzle-orm`.
  - Import `auditLog` from `@/db/schema`.

- [ ] **Step 2: Detect and auto-enable expired rule instances**
  Before calculating counts and mapping the serialized rows, add the detection block:
  - Find all rows where `enabled === false` and `deactivatedUntil !== null` and `new Date() > deactivatedUntil`.
  - If any expired ids are found:
    - Run `db.update` to set `enabled: true, deactivatedUntil: null` in the database.
    - Write system audit logs using `db.insert(auditLog)`.
    - Mutate the `rows` array in-memory for the current request context so that the KPI cards and table render the updated active state instantly.

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
