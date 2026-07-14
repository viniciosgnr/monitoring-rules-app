# Separation and Standardization of Analytics Breakdown Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the Accuracy and False Positive breakdown tables from the line chart cards on the Analytics page, positioning them in a 2-column grid directly below the line charts. Format the tables to match the style of other catalog tables (such as MR Database) and add column-specific search/filter inputs.

---

### Task 1: Update components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Declare state variables and helper component**
  Open [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx).
  - Add state variables:
    ```typescript
    const [accuracyRuleFilter, setAccuracyRuleFilter] = useState('');
    const [accuracyEquipFilter, setAccuracyEquipFilter] = useState('');
    const [fpRuleFilter, setFpRuleFilter] = useState('');
    const [fpEquipFilter, setFpEquipFilter] = useState('');
    ```
  - Define `TableFilterInput` helper component inside the file.
  - Calculate filtered lists: `filteredAccuracyRows` and `filteredFpRows` by matching instance properties with the user filters.

- [ ] **Step 2: Clean Line Chart Cards**
  - Remove the Accuracy Breakdown Table section from inside the `Accuracy Over Time` card (lines 214-251).
  - Remove the False Positive Breakdown Table section from inside the `False Positive Over Time` card (lines 267-303).

- [ ] **Step 3: Add separated standard tables grid**
  - Add a grid container directly below the line charts grid with `grid grid-cols-1 md:grid-cols-2 gap-6 mt-6`.
  - Add two card components, one for Accuracy breakdown and one for False Positive breakdown.
  - Apply the standard style (`bg-bg-card border border-border-panel rounded-card overflow-hidden` wrapper, `px-4 py-3 border-b border-border-panel` header, and inline `TableFilterInput` components inside header row cells).

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
