# Parameter Traceability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement parameter update audit logging, dynamic dirty state indicators ("Previous value: X"), and a parameter changes history timeline in the Edit Modal.

**Architecture:** Extend the server actions to fetch parameter audit history and insert logs on parameter updates. Update the client modal component to fetch and render the change logs, as well as track changes relative to initial values.

**Tech Stack:** React, Next.js, Drizzle ORM, Radix UI.

---

### Task 1: Update Server Actions in ruleInstances.ts

**Files:**
- Modify: `app/actions/ruleInstances.ts`

**Interfaces:**
- Produces: `getAuditLogsForInstance` action.
- Modifies: `updateProcessingSteps` signature and behavior.

- [ ] **Step 1: Update updateProcessingSteps signature and implement beforeState capture**
  Modify `updateProcessingSteps` in [ruleInstances.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/actions/ruleInstances.ts) to read the current state of rules and log details on change:
  ```typescript
  export async function updateProcessingSteps(ruleId: number, steps: object, instanceId?: number) {
    const [currentRule] = await db
      .select({
        processingSteps: monitoringRules.processingSteps,
      })
      .from(monitoringRules)
      .where(eq(monitoringRules.id, ruleId));

    if (!currentRule) return;

    await db.update(monitoringRules)
      .set({ processingSteps: steps })
      .where(eq(monitoringRules.id, ruleId));

    if (instanceId) {
      const beforeState = { processingSteps: currentRule.processingSteps };
      const afterState = { processingSteps: steps };

      await db.insert(auditLog).values({
        instanceId,
        userEmail: 'operator@sbmoffshore.com',
        description: 'Updated rule parameters',
        beforeState,
        afterState,
      });
    }

    revalidatePath('/');
  }
  ```

- [ ] **Step 2: Add getAuditLogsForInstance action**
  Define `getAuditLogsForInstance` in [ruleInstances.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/actions/ruleInstances.ts):
  ```typescript
  export async function getAuditLogsForInstance(instanceId: number) {
    return await db
      .select({
        id: auditLog.id,
        userEmail: auditLog.userEmail,
        description: auditLog.description,
        beforeState: auditLog.beforeState,
        afterState: auditLog.afterState,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(eq(auditLog.instanceId, instanceId))
      .orderBy(desc(auditLog.createdAt));
  }
  ```
  Ensure `desc` is imported alongside `eq` from `'drizzle-orm'`.

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add app/actions/ruleInstances.ts
  git commit -m "feat: add getAuditLogsForInstance and update processing steps logger action"
  ```

---

### Task 2: Pass instanceId to EditRuleModal

**Files:**
- Modify: `components/mr-database/RuleInstanceTable.tsx`
- Modify: `components/mr-database/EditRuleModal.tsx`

- [ ] **Step 1: Update Props interface in EditRuleModal**
  Open [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx) and declare `instanceId?: number` in `Props`.

- [ ] **Step 2: Pass instanceId in RuleInstanceTable**
  Open [RuleInstanceTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/RuleInstanceTable.tsx) and set `instanceId={editRow.id}` in the `<EditRuleModal />` tag instantiation (around line 380).

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add components/mr-database/RuleInstanceTable.tsx components/mr-database/EditRuleModal.tsx
  git commit -m "feat: pass instanceId to EditRuleModal"
  ```

---

### Task 3: Implement Dynamic "Previous value: X" Under Inputs

**Files:**
- Modify: `components/mr-database/EditRuleModal.tsx`

- [ ] **Step 1: Capture initial values on mount**
  Extract initial values from the starting `steps` prop into memoized values or variables:
  ```typescript
  const initialThreshold = steps.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
  const initialHeight = steps.rule_trigger_params?.[0]?.spike_detection?.height ?? '';
  const initialThresholdSpike = steps.rule_trigger_params?.[0]?.spike_detection?.threshold ?? '';
  const initialDistance = steps.rule_trigger_params?.[0]?.spike_detection?.distance ?? 60;
  const initialProminence = steps.rule_trigger_params?.[0]?.spike_detection?.prominence ?? 1.0;
  ```

- [ ] **Step 2: Render comparison label beside inputs**
  For each input, display a small indicator if the current value is different from the initial value:
  ```tsx
  {initialValue !== currentValue && (
    <span className="text-xs text-text-muted mt-1 block">
      Previous value: <span className="font-semibold text-text-primary">{initialValue}</span>
    </span>
  )}
  ```

---

### Task 4: Fetch and Display Parameter Change History Timeline

**Files:**
- Modify: `components/mr-database/EditRuleModal.tsx`

- [ ] **Step 1: Fetch change logs on mount**
  Add state and effect to fetch the audit log:
  ```typescript
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (open && instanceId) {
      import('@/app/actions/ruleInstances').then(({ getAuditLogsForInstance }) => {
        getAuditLogsForInstance(instanceId).then(logs => {
          // Filter logs to those which are parameter updates (description: "Updated rule parameters")
          setHistory(logs.filter((l: any) => l.description === 'Updated rule parameters'));
        });
      });
    }
  }, [open, instanceId]);
  ```

- [ ] **Step 2: Implement parameter extraction and diffing helpers**
  Implement helper functions inside `EditRuleModal` to calculate and render parameter differences between `beforeState` and `afterState`:
  ```typescript
  function getDiffElements(before: any, after: any, category: string) {
    const diffs: React.ReactNode[] = [];
    if (category === 'surge') {
      const vBefore = before.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
      const vAfter = after.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
      if (vBefore !== vAfter) {
        diffs.push(<div key="thresh"><strong>Threshold Value</strong>: {vBefore} → {vAfter}</div>);
      }
    } else if (category === 'spike') {
      const sdBefore = before.rule_trigger_params?.[0]?.spike_detection || {};
      const sdAfter = after.rule_trigger_params?.[0]?.spike_detection || {};
      if (sdBefore.height !== sdAfter.height) {
        diffs.push(<div key="h"><strong>Height</strong>: {sdBefore.height ?? '—'} → {sdAfter.height ?? '—'}</div>);
      }
      if (sdBefore.threshold !== sdAfter.threshold) {
        diffs.push(<div key="t"><strong>Threshold</strong>: {sdBefore.threshold ?? '—'} → {sdAfter.threshold ?? '—'}</div>);
      }
      if (sdBefore.distance !== sdAfter.distance) {
        diffs.push(<div key="d"><strong>Distance</strong>: {sdBefore.distance ?? '—'} → {sdAfter.distance ?? '—'}</div>);
      }
      if (sdBefore.prominence !== sdAfter.prominence) {
        diffs.push(<div key="p"><strong>Prominence</strong>: {sdBefore.prominence ?? '—'} → {sdAfter.prominence ?? '—'}</div>);
      }
    }
    return diffs;
  }
  ```

- [ ] **Step 3: Render timeline at the bottom**
  Render a vertical timeline of changes at the bottom of the modal.
  ```tsx
  {/* Parameter Change History */}
  <div className="border-t border-border-panel mt-6 pt-5">
    <h3 className="text-xs font-semibold text-text-primary mb-3">Parameter Change History</h3>
    {history.length === 0 ? (
      <div className="text-xs text-text-muted italic">No past parameter updates recorded for this instance.</div>
    ) : (
      <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
        {history.map(log => {
          const diffs = getDiffElements(log.beforeState, log.afterState, category);
          if (diffs.length === 0) return null;
          return (
            <div key={log.id} className="border-l-2 border-border-panel pl-3 text-xs py-0.5">
              <div className="text-text-muted font-medium mb-1">
                {new Date(log.createdAt).toLocaleString('pt-BR')} by <span className="text-text-primary">{log.userEmail}</span>
              </div>
              <div className="text-text-muted space-y-1 pl-1.5 border-l border-border-panel/40">
                {diffs}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
  ```

- [ ] **Step 4: Update handleSave to pass instanceId**
  Modify `handleSave` inside `EditRuleModal` to pass `instanceId` when calling `updateProcessingSteps`:
  ```typescript
  await updateProcessingSteps(ruleId, finalS, instanceId);
  ```

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add components/mr-database/EditRuleModal.tsx
  git commit -m "feat: render previous values indicators and historical change logs in EditRuleModal"
  ```

---

### Task 5: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Testing**
  - Open a rule instance Edit modal.
  - Modify a parameter (e.g. Height/Threshold value) and verify that "Previous value: X" appears dynamically underneath.
  - Revert the change and verify the label disappears.
  - Save the change and open the Edit modal again. Verify that the "Parameter Change History" displays the saved changes with the correct user, date, and diff.
