# Design Spec: Parameter Change Traceability in Edit Modal

This spec details the implementation of traceability controls in the Edit Modal (`EditRuleModal`), allowing users to compare pending edits with previous values and view a historical timeline of parameter modifications.

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

## 3. History Timeline UI
- Add a server action `getAuditLogsForInstance(instanceId)` in `app/actions/ruleInstances.ts` to query the `audit_log` records for the given rule instance, ordered by creation date descending.
- In `EditRuleModal`, fetch this history list on mount.
- Render a `"Parameter Change History"` section at the bottom of the modal.
- For each audit log entry:
  - Display the modification date (formatted to `DD/MM/YYYY HH:MM:SS`), the user who made the change (`userEmail`), and the specific parameters that changed (e.g. `Distance: 60 → 90` or `Threshold Value: 10 → 12`).
  - Use a clean vertical timeline layout with a dark theme aesthetic (subtle borders, muted texts, highlighted changes).
