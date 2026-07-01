# Simplified In-Modal Parameter Change History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a simplified parameter change history list at the bottom of the `EditRuleModal` showing past updates to Surge/Spike parameters.

**Tech Stack:** React, Next.js (Server Actions), Tailwind CSS.

---

### Task 1: Update EditRuleModal.tsx

**Files:**
- Modify: [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx)

- [ ] **Step 1: Re-add useEffect and react hooks imports**
  Open [EditRuleModal.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/EditRuleModal.tsx).
  Update React imports at the top to import `useEffect`:
  ```typescript
  import { useState, useEffect } from 'react';
  ```

- [ ] **Step 2: Define AuditLogEntry and history states**
  Add the `AuditLogEntry` interface and components states:
  ```typescript
  interface AuditLogEntry {
    id: number;
    userEmail: string;
    description: string;
    beforeState: unknown;
    afterState: unknown;
    createdAt: Date;
  }
  ```
  Inside the component, declare the `history` state hook:
  ```typescript
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  ```

- [ ] **Step 3: Add useEffect log fetching on mount**
  Add `useEffect` to fetch audit logs when the modal is opened:
  ```typescript
    useEffect(() => {
      if (open && instanceId) {
        import('@/app/actions/ruleInstances').then(({ getAuditLogsForInstance }) => {
          getAuditLogsForInstance(instanceId).then(logs => {
            setHistory((logs as unknown as AuditLogEntry[]).filter(l => l.description === 'Updated rule parameters'));
          });
        });
      }
    }, [open, instanceId]);
  ```

- [ ] **Step 4: Implement getDiffElements text diffing helper**
  Define `getDiffElements` right after `useEffect` to compute parameter changes:
  ```typescript
    function getDiffElements(beforeState: unknown, afterState: unknown, ruleCategory: string) {
      const diffs: string[] = [];
      const before = (beforeState as { processingSteps?: ProcessingStepsConfig }) || {};
      const after = (afterState as { processingSteps?: ProcessingStepsConfig }) || {};
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
      return diffs;
    }
  ```

- [ ] **Step 5: Render the list markup at the bottom of the modal**
  Place the rendering markup right above the actions footer (`{/* ── Actions ── */}`):
  ```tsx
            {/* Parameter Change History */}
            <div className="border-t border-border-panel mt-6 pt-5">
              <h3 className="text-xs font-semibold text-text-primary mb-3">Parameter Change History</h3>
              {history.length === 0 ? (
                <div className="text-xs text-text-muted italic">No past parameter updates recorded for this instance.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {history.map(log => {
                    const diffs = getDiffElements(log.beforeState, log.afterState, category);
                    if (diffs.length === 0) return null;
                    return (
                      <div key={log.id} className="text-xs text-text-muted leading-relaxed">
                        <span className="text-text-primary">{new Date(log.createdAt).toLocaleDateString('pt-BR')} {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>{' '}
                        by <span className="font-medium text-text-primary">{log.userEmail}</span> -{' '}
                        <span className="text-text-primary font-medium">{diffs.join(', ')}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
  ```

- [ ] **Step 6: Commit**
  Run:
  ```bash
  git add components/mr-database/EditRuleModal.tsx
  git commit -m "feat: add simplified parameter change history list inside EditRuleModal"
  ```

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Verification**
  - Open a rule instance Edit modal.
  - Verify that the "Parameter Change History" section is visible at the bottom of the modal, displaying past changes (e.g. `30/06/2026 12:34 by operator@sbmoffshore.com - Threshold Value: 10 → 12.5`).
  - Modify parameters, save, and reopen to check that the new modification log is correctly appended to the top of the history list.
