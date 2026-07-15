# Remove FPSO Column from All Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "FPSO" column from the tables and downloaded files across the entire application (MR Database, Analytics, and Alert Review pages) since each app instance works on a single dedicated FPSO partition.

---

### Task 1: Update MR Database (components/mr-database/RuleInstanceTable.tsx)

- [ ] **Step 1: Remove FPSO Excel Header**
  Open [RuleInstanceTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/RuleInstanceTable.tsx).
  On line 160, remove `'FPSO'` from `const headers` array.

- [ ] **Step 2: Remove FPSO Excel Data row value**
  On line 176, remove `row.fpso,` from `const values` array.

- [ ] **Step 3: Remove FPSO Column from columns mapping**
  On line 215, delete the element `['fpso', 'FPSO'],` from the `cols` definition.

- [ ] **Step 4: Remove FPSO Cell from body rows rendering**
  Around line 309, delete the cell `<td className="px-4 py-3 text-text-muted text-sm">{row.fpso}</td>`.

---

### Task 2: Update Alert Review (components/alert-review/AlertTable.tsx)

- [ ] **Step 1: Remove FPSO Header Column**
  Open [AlertTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/alert-review/AlertTable.tsx).
  Delete the header cell:
  ```tsx
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                FPSO
                <FilterInput field="fpso" />
              </th>
  ```

- [ ] **Step 2: Remove FPSO Body Cell**
  Delete the body cell:
  ```tsx
                      <td className="px-4 py-3 text-text-muted text-sm">{row.fpso}</td>
  ```

---

### Task 3: Update Analytics (components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Remove FPSO Header from Top 10 Bad Actors**
  Open [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx).
  Around line 439, delete the header cell `<th className="px-4 py-3">FPSO</th>`.

- [ ] **Step 2: Remove FPSO cells from rankings lists rendering**
  Delete `<td className="px-4 py-3 text-text-muted">{item.fpsoCode}</td>` cells around lines 462, 473, and 484.

---

### Task 4: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
