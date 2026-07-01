# Seed Parameter Audit Logs Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the database seed script to store parameter modifications with the `Updated rule parameters` description, matching the UI filter, and execute the seed script.

---

### Task 1: Update db/seed.ts

**Files:**
- Modify: [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts)

- [ ] **Step 1: Set description for Spike parameter edits**
  Open [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts).
  In the loop generating audit logs, inside the `isSpike` block, assign:
  `desc = 'Updated rule parameters';`
  so the log entry matches the UI query filter.

- [ ] **Step 2: Set description for Surge parameter edits**
  Inside the `isSurge` block, assign:
  `desc = 'Updated rule parameters';`
  so the log entry matches the UI query filter.

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add db/seed.ts
  git commit -m "feat: assign 'Updated rule parameters' description for Spike/Surge seed logs"
  ```

---

### Task 2: Run Seed Script

- [ ] **Step 1: Run seed**
  Run: `npx tsx db/seed.ts`
  Verify the script outputs `✅ Seed complete` successfully.

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Verification**
  - Open a rule instance Edit modal (such as a Spike or Surge instance).
  - Verify that the scrollable "Parameter Change History" section now shows pre-populated logs immediately on mount.
