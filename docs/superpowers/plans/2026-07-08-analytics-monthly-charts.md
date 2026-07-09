# Analytics Monthly Charts X-Axis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure both Treated Alerts charts on the Analytics page to display chronological months ('July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July') on the X-axis, matching the team mockup.

---

### Task 1: Update components/analytics/RuleAlertsChart.tsx

**Files:**
- Modify: [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx)

- [ ] **Step 1: Replace LABELS lookup with a fixed list of chronological months**
  Open [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx).
  Replace `LABELS` lookup with:
  ```typescript
  const MONTHS = [
    'July', 'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June', 'July'
  ];
  ```
  Update mapping to iterate over `MONTHS` instead of `labels`.

---

### Task 2: Update components/analytics/StatusAlertsChart.tsx

**Files:**
- Modify: [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx)

- [ ] **Step 1: Replace LABELS lookup with a fixed list of chronological months**
  Open [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx).
  Replace `LABELS` lookup with `MONTHS` list and iterate over `MONTHS`.

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
