# Align Analytics Tables Row Border Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the row border lines on the Analytics tables by removing the `/40` opacity modifier from the `border-border-panel/40` class. This ensures the table row borders compile and display exactly like the catalog tables (such as MR Database Catalog) which use `border-border-panel` directly.

---

### Task 1: Update components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Update Accuracy Breakdown Table Rows**
  Open [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx).
  On line 296, change `className="border-b border-border-panel/40 hover:bg-bg-panel/10 transition-colors"` to `className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors"`.

- [ ] **Step 2: Update False Positive Breakdown Table Rows**
  On line 343, change `className="border-b border-border-panel/40 hover:bg-bg-panel/10 transition-colors"` to `className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors"`.

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
