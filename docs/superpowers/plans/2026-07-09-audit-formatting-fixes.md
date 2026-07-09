# Audit Formatting Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct Audit Changes formatting:
- Ensure parameter changes (e.g. `Threshold Value: 10 → 12.5`) are properly computed and displayed in the table.
- Change the disable rule description string format to `"Disabled rule for (Disable Reason)"` (e.g., `"Disabled rule for Sensor Calibration"`).

---

### Task 1: Update app/actions/ruleInstances.ts

**Files:**
- Modify: [ruleInstances.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/actions/ruleInstances.ts)

- [ ] **Step 1: Update toggle descriptions in actions**
  Open [ruleInstances.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/actions/ruleInstances.ts).
  In both `toggleInstance` and `toggleInstancesBulk`, change:
  ```typescript
  const description = enabled ? 'Enabled Rule' : (reason || 'Disabled Rule');
  ```
  to:
  ```typescript
  const description = enabled ? 'Enabled Rule' : `Disabled rule for ${reason || 'Unknown Reason'}`;
  ```

---

### Task 2: Update app/audit-changes/page.tsx

**Files:**
- Modify: [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx)

- [ ] **Step 1: Adjust getFriendlyDescription helper**
  Open [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/audit-changes/page.tsx).
  Change the helper logic:
  ```typescript
  function getFriendlyDescription(description: string, afterState: unknown): string {
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
      if (description.startsWith('Disabled rule for ')) {
        return description;
      }
      const reason = (afterState as { reason?: string })?.reason;
      return `Disabled rule for ${reason || 'Unknown Reason'}`;
    }
    return description;
  }
  ```

---

### Task 3: Update db/seed.ts

**Files:**
- Modify: [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts)

- [ ] **Step 1: Restore original changeTypesList and set descriptions dynamically**
  Open [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts).
  Define the original `changeTypesList` list so the states are computed correctly:
  ```typescript
  const changeTypesList: string[] = [
    'Updated Abs Value tags',                // i = 0 (Spike) -> overwritten with parameter changes
    'Disabled rule instance (Bulk)',         // i = 1 (Trend) -> Trend disabled log
    'Updated Abs Value tags',                // i = 2 (Surge) -> overwritten with parameter changes
    'Updated Abs Value tags',                // i = 3 (Surge) -> overwritten with parameter changes
    'Enabled rule after maintenance window', // i = 4 (dP) -> dP enabled log
    ...Array(14).fill('Updated Abs Value tags'),
    ...Array(18).fill('Adjusted Round Timestamp period'),
    ...Array(2).fill('Modified Drop Missing tags'),
    ...Array(3).fill('Updated Join Timeseries tags'),
  ];
  ```
  Update loop logic:
  - If `desc === 'Disabled rule instance (Bulk)'`:
    - `before = { enabled: true };`
    - `after = { enabled: false, reason: 'Sensor Calibration' };`
  - If `desc === 'Enabled rule after maintenance window'`:
    - `before = { enabled: false };`
    - `after = { enabled: true };`
  
  Set `isParamChange`:
  ```typescript
  const isParamChange = desc !== 'Disabled rule instance (Bulk)' && desc !== 'Enabled rule after maintenance window';
  const finalBefore = isParamChange ? { processingSteps: before } : before;
  const finalAfter  = isParamChange ? { processingSteps: after } : after;
  ```
  Set `finalDesc`:
  ```typescript
  let finalDesc = desc;
  if (desc === 'Disabled rule instance (Bulk)') {
    finalDesc = 'Disabled rule for Sensor Calibration';
  } else if (desc === 'Enabled rule after maintenance window') {
    finalDesc = 'Enabled Rule';
  } else {
    finalDesc = 'Update rule parameters';
  }
  ```
  Push `finalDesc` into `auditLogsToInsert`.

- [ ] **Step 2: Re-run seed**
  Run: `npx tsx db/seed.ts`

---

### Task 4: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
