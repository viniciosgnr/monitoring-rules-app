# Analytics Page Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Analytics dashboard by adding new Treated Alerts charts, configuring KPI cards, and styling the Top 10 rankings table.

---

### Task 1: Update app/analytics/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/analytics/page.tsx)

- [ ] **Step 1: Fetch alerts list from database**
  Import `alerts` from `@/db/schema`.
  Add a query for `alerts` joined with `ruleInstances` and `monitoringRules` to select rule name, status, and triggeredAt.
  ```typescript
  const alertsList = await db
    .select({
      id:            alerts.id,
      ruleName:      monitoringRules.name,
      status:        alerts.status,
      fpsoCode:      fpsos.code,
      equipmentCode: equipment.code,
    })
    .from(alerts)
    .innerJoin(ruleInstances,   eq(alerts.instanceId,       ruleInstances.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,    monitoringRules.id))
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,        fpsos.id));
  ```
  Pass the serialized list to `AnalyticsClient`.

---

### Task 2: Create new chart components

**Files:**
- Create: [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx)
- Create: [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx)

- [ ] **Step 1: Create RuleAlertsChart component**
  Create `components/analytics/RuleAlertsChart.tsx` using `BarChart` from `recharts`. It will display alert counts by Monitoring Rule, responding dynamically to filters.

- [ ] **Step 2: Create StatusAlertsChart component**
  Create `components/analytics/StatusAlertsChart.tsx` using `BarChart` from `recharts`. It will display alert counts by Status (`Validated`, `Rejected`, `Closed`, `Validation in Progress`, `To Be Validated`), responding dynamically to filters.

---

### Task 3: Update components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Import new charts and clean imports**
  Import `RuleAlertsChart` and `StatusAlertsChart`.

- [ ] **Step 2: Update table row styling to match MR Database catalog**
  Update the table head row background to `bg-bg-panel/40`.
  Update the row borders to `border-border-panel` and hover effect to `hover:bg-bg-panel/40`.

- [ ] **Step 3: Update layout grids and add new charts**
  Render the 4 charts in a responsive 2x2 grid:
  - Top Left: Accuracy Over Time
  - Top Right: False Positive Over Time
  - Bottom Left: Alerts by Monitoring Rule
  - Bottom Right: Alerts by Status

---

### Task 4: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
