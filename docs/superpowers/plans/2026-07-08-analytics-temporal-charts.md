# Analytics Temporal Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify both Treated Alerts charts on the Analytics page so that the X-axis always represents time (months/weeks/days depending on the selected Period filter):
1. **RuleAlertsChart:** X-axis shows time period labels, stacked by Monitoring Rule Categories (`Drift`, `Spike`, `Normalized dP`, `Surge`, `Trend`).
2. **StatusAlertsChart:** X-axis shows time period labels, stacked by Treatment Statuses (`To Be Validated`, `Validation in Progress`, `Validated`, `Rejected`, `Closed`).

---

### Task 1: Update components/analytics/RuleAlertsChart.tsx

**Files:**
- Modify: [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx)

- [ ] **Step 1: Set time labels on the X-axis and stack by categories**
  Open [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx).
  Implement `LABELS` lookup:
  ```typescript
  const LABELS: Record<string, string[]> = {
    'Last Week': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    'Last Month': ['W1', 'W2', 'W3', 'W4'],
    'Last 6 month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  };
  ```
  Map over the `labels` for the selected period to generate data stacked by rule categories:
  ```typescript
  const labels = LABELS[period] ?? LABELS['Last Week'];
  const data = labels.map((label, index) => {
    const timeSeed = seed + index;
    const drift = 5 + (timeSeed % 12);
    const spike = 8 + ((timeSeed * 3) % 15);
    const normalizedDp = 4 + ((timeSeed * 7) % 10);
    const surge = 10 + ((timeSeed * 11) % 20);
    const trend = 6 + ((timeSeed * 13) % 14);

    return {
      label,
      'Drift': drift,
      'Spike': spike,
      'Normalized dP': normalizedDp,
      'Surge': surge,
      'Trend': trend,
    };
  });
  ```
  Update `<XAxis dataKey="label" ... />` and stack `<Bar>` elements using purple, pink, violet, light blue, and dark blue colors.

---

### Task 2: Update components/analytics/StatusAlertsChart.tsx

**Files:**
- Modify: [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx)

- [ ] **Step 1: Set time labels on the X-axis and stack by statuses**
  Open [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx).
  Implement `LABELS` lookup.
  Map over the `labels` for the selected period to generate data stacked by treatment statuses:
  ```typescript
  const labels = LABELS[period] ?? LABELS['Last Week'];
  const data = labels.map((label, index) => {
    const timeSeed = seed + index;
    const toBeValidated = 10 + (timeSeed % 25);
    const validationInProgress = 5 + ((timeSeed * 3) % 15);
    const validated = 25 + ((timeSeed * 7) % 45);
    const rejected = 2 + ((timeSeed * 11) % 10);
    const closed = 4 + ((timeSeed * 13) % 12);

    return {
      label,
      'To Be Validated': toBeValidated,
      'Validation in Progress': validationInProgress,
      'Validated': validated,
      'Rejected': rejected,
      'Closed': closed,
    };
  });
  ```
  Update `<XAxis dataKey="label" ... />` and stack `<Bar>` elements using amber, blue, green, red, and gray colors.

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
