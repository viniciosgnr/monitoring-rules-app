# Audit Parameter Diffs Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand parameter diff checks for both Spike, Surge, and generic monitoring rule types in Audit Changes and the Edit Rule Modal history.

---

### Task 1: Update app/audit-changes/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx)

- [ ] **Step 1: Expand getDiffText to parse all parameter properties**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx).
  Modify `getDiffText` function to:
  1. Add `time_period` check for Surge rules.
  2. Add `timedelta_minutes` check for Spike rules.
  3. Add generic checks (`abs_value`, `round_timestamp`, `drop_missing`, `join_timeseries`) for all other rules.

---

### Task 2: Update components/mr-database/EditRuleModal.tsx

**Files:**
- Modify: [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx)

- [ ] **Step 1: Expand getDiffElements to align with getDiffText**
  Open [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx).
  Modify `getDiffElements` to align with the same expanded diff checks.

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
