# Analytics Category-based Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the X-axis of the Treated Alerts charts on the Analytics page to display categories (`Drift`, `Spike`, `Normalized dP`, `Surge`, `Trend`) instead of rule instances/names, preventing overflow.

---

### Task 1: Update components/analytics/RuleAlertsChart.tsx

**Files:**
- Modify: [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx)

- [ ] **Step 1: Set category list and generate seeded status counts**
  Open [RuleAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/RuleAlertsChart.tsx).
  Replace `RULES` array with:
  ```typescript
  const CATEGORIES = ['Drift', 'Spike', 'Normalized dP', 'Surge', 'Trend'];
  ```
  Update the `data` array mapper to map `category` instead of `rule`:
  ```typescript
  const data = CATEGORIES.map(cat => {
    const catSeed = seed + getStringHash(cat);
    const toBeValidated = 10 + (catSeed % 25);
    const validationInProgress = 5 + ((catSeed * 3) % 15);
    const validated = 25 + ((catSeed * 7) % 45);
    const rejected = 2 + ((catSeed * 11) % 10);
    const closed = 4 + ((catSeed * 13) % 12);

    return {
      category: cat,
      'To Be Validated': toBeValidated,
      'Validation in Progress': validationInProgress,
      'Validated': validated,
      'Rejected': rejected,
      'Closed': closed,
    };
  });
  ```
  Update `<XAxis dataKey="category" ... />`.

---

### Task 2: Update components/analytics/StatusAlertsChart.tsx

**Files:**
- Modify: [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx)

- [ ] **Step 1: Set category list and generate percentage stack**
  Open [StatusAlertsChart.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/StatusAlertsChart.tsx).
  Replace `RULES` array with:
  ```typescript
  const CATEGORIES = ['Drift', 'Spike', 'Normalized dP', 'Surge', 'Trend'];
  ```
  Update the `data` array mapper to calculate dynamic percentages for each category:
  ```typescript
  const data = CATEGORIES.map(cat => {
    const catSeed = seed + getStringHash(cat);
    const toBeValidated = 10 + (catSeed % 25);
    const validationInProgress = 5 + ((catSeed * 3) % 15);
    const validated = 25 + ((catSeed * 7) % 45);
    const rejected = 2 + ((catSeed * 11) % 10);
    const closed = 4 + ((catSeed * 13) % 12);

    const total = toBeValidated + validationInProgress + validated + rejected + closed;

    return {
      category: cat,
      'To Be Validated': parseFloat(((toBeValidated / total) * 100).toFixed(1)),
      'Validation in Progress': parseFloat(((validationInProgress / total) * 100).toFixed(1)),
      'Validated': parseFloat(((validated / total) * 100).toFixed(1)),
      'Rejected': parseFloat(((rejected / total) * 100).toFixed(1)),
      'Closed': parseFloat(((closed / total) * 100).toFixed(1)),
    };
  });
  ```
  Update `<XAxis dataKey="category" ... />`.

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
