# Analytics Trends Tables Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate raw data breakdown tables underneath each line chart on the "Overview & Trends" tab. The tables will list active Monitoring Rule Instances and their performance details (Evaluations, Actions, Alerts, and FP rates) corresponding to the selected filters and time period.

---

### Task 1: Update components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Add trend data breakdown tables under the Line Charts**
  Open [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx).
  Inside the `overview` tab block:
  - Under `Accuracy Over Time` chart: Add a table listing the active filtered instances, their Total Evaluations, Correct Actions, and Accuracy %.
  - Under `False Positive Over Time` chart: Add a table listing the active filtered instances, their Triggered Alerts, False Positives count, and False Positive %.
  - Style both tables using SLB Optisite dark style (rounded container, subtle borders, highlighted text, and scroll limits).

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
