# Audit History Description Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize the content of the "Description" column of `MR Audit Changes` with the actual action taken in `MR Database`:
- `Enabled Rule` when rule instance is enabled.
- The actual selected justification reason (Disabled Reason A/B/C/D) when disabled.
- `Update rule parameters` when parameters are updated.

---

### Task 1: Update app/actions/ruleInstances.ts

**Files:**
- Modify: [ruleInstances.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/actions/ruleInstances.ts)

- [ ] **Step 1: Set correct descriptions in toggle and update actions**
  Open [ruleInstances.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/actions/ruleInstances.ts).
  In `toggleInstance`:
  Change description assignment to:
  ```typescript
  const description = enabled ? 'Enabled Rule' : (reason || 'Disabled Rule');
  ```
  In `toggleInstancesBulk`:
  Change description assignment to:
  ```typescript
  const description = enabled ? 'Enabled Rule' : (reason || 'Disabled Rule');
  ```
  In `updateProcessingSteps`:
  Change description assignment to:
  ```typescript
  description: 'Update rule parameters',
  ```

---

### Task 2: Update app/audit-changes/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx)

- [ ] **Step 1: Add a getFriendlyDescription helper**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx).
  Define the helper to map old seed values and format descriptions uniformly:
  ```typescript
  function getFriendlyDescription(description: string, afterState: any): string {
    if (description.includes('Enabled') || description.includes('enabled')) {
      return 'Enabled Rule';
    }
    if (
      description.includes('Updated rule parameters') ||
      description.includes('Updated Abs Value') ||
      description.includes('Adjusted Round') ||
      description.includes('Modified Drop') ||
      description.includes('Updated Join') ||
      description.includes('Update rule parameters')
    ) {
      return 'Update rule parameters';
    }
    if (description.includes('Disabled') || description.includes('disabled')) {
      return afterState?.reason || description;
    }
    return description;
  }
  ```
  Apply this helper inside the row mapper:
  ```typescript
  description: getFriendlyDescription(r.description, r.afterState),
  ```

---

### Task 3: Update db/seed.ts

**Files:**
- Modify: [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts)

- [ ] **Step 1: Normalize descriptions in seed**
  Open [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts).
  Replace `'Disabled rule instance (Bulk)'` with `'Sensor Calibration'`.
  Replace `'Enabled rule after maintenance window'` with `'Enabled Rule'`.
  Replace `'Updated rule parameters'` with `'Update rule parameters'`.
  Replace other parameter updates like `'Updated Abs Value tags'`, `'Adjusted Round Timestamp period'`, `'Modified Drop Missing tags'`, `'Updated Join Timeseries tags'` with `'Update rule parameters'`.

- [ ] **Step 2: Run Seed to reset database logs**
  Run `npm run db:setup` or `npx tsx db/seed.ts` to refresh database entries.

---

### Task 4: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
