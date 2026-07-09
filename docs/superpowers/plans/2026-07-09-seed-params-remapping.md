# Seed Parameter Changes Remapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct seed logs to modify only the valid editable parameters:
- Surge: modify `Threshold Value`.
- Spike: modify one of (Height, Threshold, Distance, Prominence).
- Remove the invalid `Spikes window` and `Time Period` parsing from the diff helpers.

---

### Task 1: Update app/audit-changes/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx)

- [ ] **Step 1: Revert Spikes window and Time Period diff checks**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx).
  Remove the `time_period` diff parsing check from the `surge` block.
  Remove the `timedelta_minutes` diff parsing check from the `spike` block.

---

### Task 2: Update components/mr-database/EditRuleModal.tsx

**Files:**
- Modify: [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx)

- [ ] **Step 1: Revert Spikes window and Time Period diff checks in modal helper**
  Open [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx).
  Remove the `time_period` diff parsing check from the `surge` block.
  Remove the `timedelta_minutes` diff parsing check from the `spike` block in `getDiffElements`.

---

### Task 3: Update db/seed.ts

**Files:**
- Modify: [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts)

- [ ] **Step 1: Change parameter updates in seed else blocks**
  Open [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts).
  In `isSpike` else block: change `prominence` from `1.0` to `0.8` instead of `timedelta_minutes`.
  In `isSurge` else block: change `threshold_comparison.value` from `10` to `15` instead of `time_period`.

- [ ] **Step 2: Run seed script**
  Run: `npx tsx db/seed.ts`

---

### Task 4: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
