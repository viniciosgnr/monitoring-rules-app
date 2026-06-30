# Design Spec: Parameter Change Traceability in Edit Modal (Static Labels for SLB Optisite)

This spec details the static implementation of traceability controls in the Edit Modal (`EditRuleModal`) to align with SLB Optisite limitations, displaying previous saved values permanently below input fields and logging modifications to the database.

## 1. Static "Previous Value" Display
- Every parameter input field will permanently display its database-saved value below the input, formatted as `"Previous value: X"` (or `"Previous value: null"` if empty).
- This label remains static and visible at all times (even if the user modifies the input) to provide a clear reference baseline.

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
