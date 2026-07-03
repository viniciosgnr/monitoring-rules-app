# Inline Parameter Changes Column in Audit History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "Details" modal from the MR Audit Changes page and replace it with a direct "Parameter Changes" column inside the table.

---

### Task 1: Update app/audit-changes/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx)

- [ ] **Step 1: Add diffing helper resolvers**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx).
  Add `getRuleCategory` and `getDiffText` helper functions above `AuditChangesPage`:
  ```typescript
  function getRuleCategory(ruleName: string): 'surge' | 'spike' | 'generic' {
    const name = ruleName.toUpperCase();
    if (name.includes('SPK') || name.includes('SPIKE')) return 'spike';
    if (name.includes('SURG') || name.includes('THR') || name.includes('TME_NRS')) return 'surge';
    return 'generic';
  }

  function getDiffText(beforeState: unknown, afterState: unknown, ruleName: string): string {
    const ruleCategory = getRuleCategory(ruleName);
    const diffs: string[] = [];
    const before = (beforeState as { processingSteps?: any }) || {};
    const after = (afterState as { processingSteps?: any }) || {};

    if (ruleCategory === 'surge') {
      const vBefore = before.processingSteps?.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
      const vAfter = after.processingSteps?.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
      if (vBefore !== vAfter) {
        diffs.push(`Threshold Value: ${vBefore} → ${vAfter}`);
      }
    } else if (ruleCategory === 'spike') {
      const sdBefore = before.processingSteps?.rule_trigger_params?.[0]?.spike_detection || {};
      const sdAfter = after.processingSteps?.rule_trigger_params?.[0]?.spike_detection || {};
      if (sdBefore.height !== sdAfter.height) {
        diffs.push(`Height: ${sdBefore.height ?? 'null'} → ${sdAfter.height ?? 'null'}`);
      }
      if (sdBefore.threshold !== sdAfter.threshold) {
        diffs.push(`Threshold: ${sdBefore.threshold ?? 'null'} → ${sdAfter.threshold ?? 'null'}`);
      }
      if (sdBefore.distance !== sdAfter.distance) {
        diffs.push(`Distance: ${sdBefore.distance ?? '—'} → ${sdAfter.distance ?? '—'}`);
      }
      if (sdBefore.prominence !== sdAfter.prominence) {
        diffs.push(`Prominence: ${sdBefore.prominence ?? '—'} → ${sdAfter.prominence ?? '—'}`);
      }
    }
    return diffs.length > 0 ? diffs.join(', ') : '—';
  }
  ```

- [ ] **Step 2: Map paramChanges in serialization**
  Update the `.map` serialization callback to include the computed `paramChanges` diff string:
  ```typescript
    const serialized = rows.map(r => ({
      ...r,
      system:       getSystemFromTimeseries(r.timeseries),
      subsystem:    getSubsystem(r.timeseries, r.equipmentCode),
      paramChanges: getDiffText(r.beforeState, r.afterState, r.ruleName),
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
  git commit -m "feat: compute and resolve inline paramChanges string on audit changes page"
  ```

---

### Task 2: Update components/audit-changes/AuditHistoryTable.tsx

**Files:**
- Modify: [AuditHistoryTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/audit-changes/AuditHistoryTable.tsx)

- [ ] **Step 1: Remove imports and states of ParamDiffModal**
  Open [AuditHistoryTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/audit-changes/AuditHistoryTable.tsx).
  - Remove `import ParamDiffModal from './ParamDiffModal';`
  - Remove `diffEntry` state variables (`const [diffEntry, setDiffEntry] = ...`).
  - Update `AuditEntry` interface to include `paramChanges: string`.

- [ ] **Step 2: Update cols and render block**
  - Add `['paramChanges', 'Parameter Changes']` to `cols` array list:
    ```typescript
      const cols = [
        ['timestamp', 'Timestamp'],
        ['userEmail', 'User'],
        ['equipmentCode', 'Equipment'],
        ['system', 'System'],
        ['subsystem', 'Subsystem'],
        ['ruleName', 'Rule'],
        ['description', 'Description'],
        ['paramChanges', 'Parameter Changes'],
      ];
    ```
  - In individual rows map rendering, delete the Details button cell (`<td className="px-4 py-3">...</td>` containing the button) and replace it with the new column:
    ```tsx
    <td className="px-4 py-3 text-text-muted text-xs font-mono">{row.paramChanges}</td>
    ```
  - Remove the table header trailing empty `<th>` (`<th className="px-4 py-3 w-24" />` or similar spacers).
  - Remove the `<ParamDiffModal ... />` JSX component call from the bottom of the table code block.

- [ ] **Step 3: Update downloadExcel export columns**
  - Update CSV `headers` to include `'Parameter Changes'`.
  - Include `row.paramChanges` in exported values mapping.

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add components/audit-changes/AuditHistoryTable.tsx
  git commit -m "feat: display inline Parameter Changes column in AuditHistoryTable and remove details button"
  ```

---

### Task 3: Delete unused components

- [ ] **Step 1: Delete ParamDiffModal.tsx**
  Run:
  ```bash
  git rm components/audit-changes/ParamDiffModal.tsx
  git commit -m "cleanup: delete unused ParamDiffModal component"
  ```

---

### Task 4: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Verification**
  - Go to the MR Audit Changes page.
  - Verify that the "Details" button is gone, and the "Parameter Changes" column is populated with textual diffs.
  - Try typing in the "Parameter Changes" column input filter to confirm it dynamically queries records.
