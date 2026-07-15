# Rename Equipment to Asset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the table column headers and filter option placeholders from "Equipment" to "Asset" (or "Assets") across all 4 main pages (MR Database, Analytics, Alert Review, and MR Audit Changes) to use more generic terminology.

---

### Task 1: Update MR Database (components/mr-database/RuleInstanceTable.tsx)

- [ ] **Step 1: Update columns mapping**
  Open [RuleInstanceTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/RuleInstanceTable.tsx).
  On line 216, change `['equipmentCode', 'Equipment']` to `['equipmentCode', 'Asset']`.

- [ ] **Step 2: Update Excel download headers**
  On line 160, change the string `'Equipment'` to `'Asset'` in the headers array.

---

### Task 2: Update Analytics (components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Update filter state initial value**
  Open [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx).
  On line 72, change `useState('All Equipment')` to `useState('All Assets')`.

- [ ] **Step 2: Update filters logic**
  On line 118, change `selectedEquipment !== 'All Equipment'` to `selectedEquipment !== 'All Assets'`.

- [ ] **Step 3: Update filter dropdown options**
  On line 178, change `['All Equipment', ...equipments]` to `['All Assets', ...equipments]`.

- [ ] **Step 4: Update table column headers**
  On line 278, change `Equipment` header to `Asset` for the Accuracy breakdown table.
  On line 325, change `Equipment` header to `Asset` for the False Positive breakdown table.
  On line 438, change `Equipment` header to `Asset` for the Top 10 rankings table.

---

### Task 3: Update Alert Review (components/alert-review/AlertTable.tsx)

- [ ] **Step 1: Update table column header**
  Open [AlertTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/alert-review/AlertTable.tsx).
  On line 302, change the header text `Equipment` to `Asset`.

---

### Task 4: Update MR Audit Changes (components/audit-changes/AuditHistoryTable.tsx)

- [ ] **Step 1: Update columns mapping**
  Open [AuditHistoryTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/audit-changes/AuditHistoryTable.tsx).
  On line 130, change `['equipmentCode', 'Equipment']` to `['equipmentCode', 'Asset']`.

- [ ] **Step 2: Update Excel download headers**
  On line 58, change the string `'Equipment'` to `'Asset'` in the headers array.

---

### Task 5: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
