# System and Subsystem Columns in Audit Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "System" and "Subsystem" columns with interactive filters and Excel export support to the Audit Changes page.

---

### Task 1: Update app/audit-changes/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx)

- [ ] **Step 1: Add system and subsystem helper resolvers**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx).
  Add `getSystemFromTimeseries` and `getSubsystem` functions above `AuditChangesPage`:
  ```typescript
  function getSystemFromTimeseries(timeseries: string): string {
    if (timeseries.includes('771')) return 'Gas System';
    if (timeseries.includes('772')) return 'Water Injection System';
    if (timeseries.includes('773')) return 'Crude Oil System';
    if (timeseries.includes('774')) return 'Power Generation System';
    return 'Utility System';
  }

  function getSubsystem(timeseries: string, equipmentCode: string): string {
    const code = equipmentCode.toUpperCase();
    const has771 = timeseries.includes('771');
    const has772 = timeseries.includes('772');
    const has773 = timeseries.includes('773');
    const has774 = timeseries.includes('774');

    if (code.includes('COCE')) {
      return 'Gas Compression';
    }
    if (code.includes('TRB')) {
      if (has774) return 'Power Generation';
      return 'Gas Turbine Fuel System';
    }
    if (code.includes('HX')) {
      return 'Gas Dehydration & Treatment';
    }
    if (code.includes('PUM')) {
      if (has772) return 'Water Injection Pumps';
      if (has773) return 'Crude Oil Export Pumps';
      if (has771) return 'TEG Circulation Pumps';
      return 'Utility Water Pumps';
    }
    return 'General Process';
  }
  ```

- [ ] **Step 2: Update database query and map system/subsystem**
  Modify the `db.select` block to select `timeseries: ruleInstances.timeseries`, and update the `.map` mapper to inject resolved `system` and `subsystem` values:
  ```typescript
    const serialized = rows.map(r => ({
      ...r,
      system:       getSystemFromTimeseries(r.timeseries),
      subsystem:    getSubsystem(r.timeseries, r.equipmentCode),
      timestamp:    r.timestamp.toLocaleString('pt-BR'),
      timestampRaw: r.timestamp.toISOString(),
      beforeState:  (r.beforeState as object) ?? {},
      afterState:   (r.afterState  as object) ?? {},
    }));
  ```

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add app/audit-changes/page.tsx
  git commit -m "feat: select and resolve system/subsystem properties on audit-changes page"
  ```

---

### Task 2: Update components/audit-changes/AuditHistoryTable.tsx

**Files:**
- Modify: [AuditHistoryTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/audit-changes/AuditHistoryTable.tsx)

- [ ] **Step 1: Update interfaces and Excel export**
  Open [AuditHistoryTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/audit-changes/AuditHistoryTable.tsx).
  - Add `system` and `subsystem` properties to `AuditEntry` interface.
  - Update `downloadExcel()` to include `System` and `Subsystem` headers and values in CSV output.

- [ ] **Step 2: Implement cols mapping structure**
  Define `cols` right inside the component:
  ```typescript
    const cols = [
      ['timestamp', 'Timestamp'],
      ['userEmail', 'User'],
      ['equipmentCode', 'Equipment'],
      ['system', 'System'],
      ['subsystem', 'Subsystem'],
      ['ruleName', 'Rule'],
      ['description', 'Description'],
    ];
  ```
  - Map `cols` to render table headers and input filters.
  - Adjust the group header row to use `colSpan={cols.length}`.
  - Adjust the "No results found" cell to use `colSpan={cols.length + 2}`.

- [ ] **Step 3: Render system/subsystem columns in table body**
  In the list mapping of individual audit logs under the group, render:
  ```tsx
                          <td className="px-4 py-3 text-text-muted text-xs">{row.system}</td>
                          <td className="px-4 py-3 text-text-muted text-xs">{row.subsystem}</td>
  ```
  placed after the equipment badge and before the rule name.

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add components/audit-changes/AuditHistoryTable.tsx
  git commit -m "feat: render System and Subsystem columns in AuditHistoryTable with filter support"
  ```

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Verification**
  - Go to the MR Audit Changes tab.
  - Verify that the "System" and "Subsystem" columns are displayed correctly with values populated.
  - Type in the filters for System and Subsystem to confirm real-time filtering is fully functional.
  - Click Export to Excel and check that the generated CSV contains the new columns.
