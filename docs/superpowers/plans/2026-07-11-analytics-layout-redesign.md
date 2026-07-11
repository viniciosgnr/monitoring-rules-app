# Analytics Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Analytics page layout by:
1. Moving the two Column Charts (`RuleAlertsChart` and `StatusAlertsChart`) from the first tab to the top of the second tab ("Bad Actors & Rule Audit").
2. Elevating filters (FPSO, Equipment, Period, Rule Category) to a global filter bar above the tabs.
3. Grouping the rule filter by categories: Drift, Spike, Surge, Trend, Normalized dP.
4. Applying all filters (including time period and category) to the Bad Actors tables.

---

### Task 1: Update components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Move filter controls to a global section above the tabs**
  Place the filters selector row before the tab buttons.
  Use the categories list `'All Categories'`, `'Drift'`, `'Spike'`, `'Surge'`, `'Trend'`, `'Normalized dP'` as the options for the Rule dropdown.

- [ ] **Step 2: Filter the bad actor instances list dynamically**
  Filter `processedInstances` by active FPSO, Equipment, and Rule Category.
  Incorporate `period` dynamically to adjust the metrics (alertsCount, falsePositives, accuracy) for a realistic, reactive behavior when the time filter is changed.

- [ ] **Step 3: Move Column Charts to the Bad Actors tab**
  Remove the two column charts (`RuleAlertsChart` and `StatusAlertsChart`) from the `overview` tab block.
  Render them in a 2-column grid at the top of the `bad_actors` tab block.
  Render the Top 10 tables below the charts.

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
