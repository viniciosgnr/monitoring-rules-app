# Subsystem Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a new "Subsystem" column in the MR Database catalog table, resolving the values dynamically based on equipment codes and timeseries.

**Architecture:** Create a `getSubsystem` resolver function in `app/page.tsx` that determines the subsystem. Add the resolved property to the serialized row objects. Modify the table component to define the column, render cells, support filtering, and export the values in CSV format.

**Tech Stack:** React, Next.js, Tailwind CSS, Drizzle ORM.

## Global Constraints
- Dynamically resolve subsystem values according to:
  - Equipment contains `COCE` -> `"Gas Compression"`
  - Equipment contains `TRB` (Gas system) -> `"Gas Turbine Fuel System"`
  - Equipment contains `TRB` (Power Gen) -> `"Power Generation"`
  - Equipment contains `HX` -> `"Gas Dehydration & Treatment"`
  - Equipment contains `PUM` (Gas system) -> `"TEG Circulation Pumps"`
  - Equipment contains `PUM` (Water injection) -> `"Water Injection Pumps"`
  - Equipment contains `PUM` (Crude oil) -> `"Crude Oil Export Pumps"`
  - Fallback -> `"General Process"`
- Display the column between `"System"` and `"Rule"` columns.
- Update text search filtering and Excel CSV download routine.

---

### Task 1: Implement Dynamic Subsystem Resolution in page.tsx

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: Updated serialized rule instance rows containing a `subsystem` string property.

- [ ] **Step 1: Implement getSubsystem function**
  Define `getSubsystem` in [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/page.tsx) (around line 18):
  ```typescript
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

- [ ] **Step 2: Map subsystem in serialization block**
  Serialize the `subsystem` field in each rule instance row in [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/page.tsx) (around line 45):
  ```typescript
    const serialized = rows.map(r => ({
      ...r,
      system:          getSystemFromTimeseries(r.timeseries),
      subsystem:       getSubsystem(r.timeseries, r.equipmentCode),
      lastRunAt:       r.lastRunAt?.toLocaleString('pt-BR') ?? '—',
      nextRunAt:       r.nextRunAt?.toLocaleString('pt-BR') ?? '—',
      processingSteps: (r.processingSteps as object) ?? {},
      deactivatedUntil: r.deactivatedUntil ? r.deactivatedUntil.toISOString() : null,
    }));
  ```

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add app/page.tsx
  git commit -m "feat: implement dynamic subsystem resolver and serialize value on load"
  ```

---

### Task 2: Add Column, Filter, Cell Rendering and Excel Exporter in Table

**Files:**
- Modify: `components/mr-database/RuleInstanceTable.tsx`

**Interfaces:**
- Consumes: `subsystem` from `InstanceRow` objects.

- [ ] **Step 1: Add subsystem to InstanceRow type definition**
  Modify [RuleInstanceTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/RuleInstanceTable.tsx) type definition:
  ```typescript
  interface InstanceRow {
    id: number;
    fpso: string;
    equipmentCode: string;
    timeseries: string;
    system: string;
    subsystem: string;
    ruleName: string;
    ruleId: number;
    schedule: string;
    lastRunAt: string;
    nextRunAt: string;
    enabled: boolean;
    processingSteps: object;
    deactivatedUntil: string | null;
    [key: string]: unknown;
  }
  ```

- [ ] **Step 2: Add Subsystem to cols array**
  Modify the `cols` declaration (around line 180) to position `"Subsystem"` column between `"System"` and `"Rule"`:
  ```typescript
    const cols: [string, string][] = [
      ['fpso', 'FPSO'],
      ['equipmentCode', 'Equipment'],
      ['timeseries', 'Timeseries'],
      ['system', 'System'],
      ['subsystem', 'Subsystem'],
      ['ruleName', 'Rule'],
      ['schedule', 'Schedule'],
      ['lastRunAt', 'Last Run At'],
      ['nextRunAt', 'Next Run At'],
      ['deactivatedUntil', 'Disabled Until'],
    ];
  ```

- [ ] **Step 3: Render cell in table row**
  Modify the cell rendering block in individual row render section (around line 278) to render `subsystem` text cell:
  ```tsx
                        <td className="px-4 py-3 text-text-muted text-sm">{row.system}</td>
                        <td className="px-4 py-3 text-text-muted text-sm">{row.subsystem}</td>
                        <td className="px-4 py-3 text-text-primary font-mono text-xs">{row.ruleName}</td>
  ```

- [ ] **Step 4: Update downloadExcel CSV export exporter**
  Modify the `downloadExcel()` columns layout to export Subsystem data between System and Rule columns:
  ```typescript
    function downloadExcel() {
      const headers = ['FPSO', 'Equipment', 'Timeseries', 'System', 'Subsystem', 'Rule', 'Schedule', 'Last Run At', 'Next Run At', 'Disabled Until', 'Enabled'];
      const csvRows = [headers.join(',')];

      for (const row of filtered) {
        let disabledUntilStr = '—';
        if (!row.enabled) {
          if (!row.deactivatedUntil) {
            disabledUntilStr = 'Indefinite';
          } else {
            const limit = new Date(row.deactivatedUntil);
            const dateStr = limit.toLocaleDateString('pt-BR');
            disabledUntilStr = new Date() > limit ? `Expired (${dateStr})` : dateStr;
          }
        }

        const values = [
          row.fpso,
          row.equipmentCode,
          row.timeseries,
          row.system,
          row.subsystem,
          row.ruleName,
          row.schedule,
          row.lastRunAt,
          row.nextRunAt,
          disabledUntilStr,
          row.enabled ? 'Yes' : 'No'
        ].map(val => `"${String(val).replace(/"/g, '""')}"`);
        csvRows.push(values.join(','));
      }
      // ... rest of CSV export ...
    }
  ```

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add components/mr-database/RuleInstanceTable.tsx
  git commit -m "feat: render subsystem column with filters and CSV export support"
  ```

---

### Task 3: Verify and Build

**Files:**
- None.

- [ ] **Step 1: Verify TypeScript & Build**
  Run: `npm run build`
  Expected: Compiled successfully with zero errors.

- [ ] **Step 2: Verify Lint**
  Run: `npm run lint`
  Expected: Clean without warnings or errors.

- [ ] **Step 3: Verify Manual Checks**
  - Open http://localhost:3000 in browser.
  - Verify that the "Subsystem" column header and values show up.
  - Type in search filters underneath "Subsystem" to check filtering.
  - Click Export to Excel and verify CSV structure.
