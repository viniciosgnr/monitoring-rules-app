# Design Spec: Parameter Change Traceability in Edit Modal (Simplified for SLB Optisite)

This spec details the simplified implementation of traceability controls in the Edit Modal (`EditRuleModal`) to align with SLB Optisite limitations, allowing users to compare pending edits with previous values directly in the inputs while logging changes in the database.

## 1. Dynamic "Previous Value" Display
- When editing a parameter value, the UI will compare the current input value with the value originally loaded from the database (initial state).
- If the value is modified, a small label `"Previous value: X"` will appear below the input field.

## 2. Server-side Audit Logging for Parameters
Modify the `updateProcessingSteps` action in `app/actions/ruleInstances.ts` to accept an optional `instanceId`. If provided:
- Read the current `processingSteps` from `monitoring_rules`.
- Perform the database update.
- Insert a record into `audit_log` table:
  - `instanceId`: ID of the rule instance.
  - `userEmail`: `'operator@sbmoffshore.com'`.
  - `description`: `"Updated rule parameters"`.
  - `beforeState`: `{ processingSteps: oldSteps }`.
  - `afterState`: `{ processingSteps: newSteps }`.

## 3. History UI Limitation (SLB Optisite Alignment)
- In order to comply with the SLB Optisite interface constraints, the full historical timeline of past changes is omitted from the modal UI.
- All parameter modifications remain fully traced and queryable in the backend database `audit_log` table.
