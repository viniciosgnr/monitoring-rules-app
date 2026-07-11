# Analytics Charts Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the column charts to:
1. Dynamically update their x-axis time period labels based on active filters (Last Week -> Mon-Sun, Last Month -> W1-W4, Last 6 month -> Jan-Jun).
2. Filter the `RuleAlertsChart` bar segments dynamically according to the active category, displaying only the active segment and hiding others.
3. Rename the second chart title to "Alerts Treated by Status" in `AnalyticsClient.tsx`.

---

### Task 1: Update components/analytics/RuleAlertsChart.tsx

**Files:**
- Modify: [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx)

- [ ] **Step 1: Dynamic time period labels on X-axis**
  Define `LABELS` record matching line charts:
  ```typescript
  const LABELS: Record<string, string[]> = {
    'Last Week': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    'Last Month': ['W1', 'W2', 'W3', 'W4'],
    'Last 6 month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  };
  ```
  Obtain `labels` matching active `period`.

- [ ] **Step 2: Filter segments and legend by active category**
  Update Recharts `<XAxis dataKey="label" />`.
  Filter/Hide other categories' `<Bar>` elements when `rule !== 'All Categories'`.

---

### Task 2: Update components/analytics/StatusAlertsChart.tsx

**Files:**
- Modify: [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx)

- [ ] **Step 1: Dynamic time period labels on X-axis**
  Implement dynamic `LABELS` matching active `period` and use `label` key on XAxis.

- [ ] **Step 2: Scale stats when filtering by single category**
  If `rule !== 'All Categories'`, scale stats values down (e.g. `* 0.25`) since it is showing alerts for only one category.

---

### Task 3: Update components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Update chart container title**
  Change title from `"Alerts Treated [%]"` to `"Alerts Treated by Status"`.

---

### Task 4: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
