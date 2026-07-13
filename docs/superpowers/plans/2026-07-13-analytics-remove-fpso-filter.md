# Remove FPSO Filter from Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the FPSO dropdown filter from the Analytics page global filter toolbar, and stop filtering instances by FPSO since each FPSO has a dedicated application instance. Keep the chart components' seed logic intact by passing a hardcoded `'All FPSOs'` value internally.

---

### Task 1: Update components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Remove FPSO filter state and dropdown**
  Open [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx).
  - Remove `const [fpso, setFpso] = useState('All FPSOs');`.
  - Remove `<Sel value={fpso} onChange={setFpso} options={['All FPSOs', ...fpsos]} />` dropdown from rendering.

- [ ] **Step 2: Update instances filtering**
  - Omit the FPSO filter condition from the `filteredInstances` filtering logic.

- [ ] **Step 3: Update chart render tags**
  - Change all chart components (`AccuracyChart`, `FalsePositiveChart`, `RuleAlertsChart`, `StatusAlertsChart`) to pass `fpso="All FPSOs"` statically.

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
