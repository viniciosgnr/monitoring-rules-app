# Alert Review Table Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the Alert Review dashboard page by removing non-pending columns and queries:
- Query only pending alerts (`to_be_validated` and `validation_in_progress`).
- Remove "End Date", "Reviewed At", and "Reviewed By" columns from the list.
- Rename the "Total Alerts" KPI card to "Total Pending".

---

### Task 1: Update app/alert-review/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/alert-review/page.tsx)

- [ ] **Step 1: Filter query for pending statuses and update KPIs**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/alert-review/page.tsx).
  Import `or` from `drizzle-orm`.
  Modify the query to include a `where` clause:
  ```typescript
  import { eq, or } from 'drizzle-orm';
  ...
  const rows = await db
    .select({
      id:            alerts.id,
      fpso:          fpsos.code,
      equipmentCode: equipment.code,
      ruleName:      monitoringRules.name,
      type:          alerts.type,
      endDate:       alerts.endDate,
      triggeredAt:   alerts.triggeredAt,
      reviewedAt:    alerts.reviewedAt,
      reviewedBy:    alerts.reviewedBy,
      status:        alerts.status,
    })
    .from(alerts)
    .innerJoin(ruleInstances,   eq(alerts.instanceId,      ruleInstances.id))
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,    monitoringRules.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,        fpsos.id))
    .where(or(
      eq(alerts.status, 'to_be_validated'),
      eq(alerts.status, 'validation_in_progress')
    ));
  ```
  Update the third KPI card:
  - Title: `"Total Pending"`
  - Subtitle: `"Awaiting action"`
  - Tooltip: `"Total number of active alerts currently awaiting response or validation."`

---

### Task 2: Update components/alert-review/AlertTable.tsx

**Files:**
- Modify: [AlertTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/alert-review/AlertTable.tsx)

- [ ] **Step 1: Remove columns from the table headers**
  Open [AlertTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/alert-review/AlertTable.tsx).
  Remove the `th` elements for:
  - `End Date`
  - `Reviewed At`
  - `Reviewed by`

- [ ] **Step 2: Remove cells from individual rows and adjust colSpans**
  Remove the corresponding `td` elements inside `isExpanded && ruleRows.map(row => (...))` loop (lines 348-350).
  Change `colSpan={10}` to `colSpan={7}` on the group header row (line 308).
  Change `colSpan={11}` to `colSpan={8}` on the "No results found" placeholder row (line 384).

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
