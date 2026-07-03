# Design Spec: Inline Parameter Changes Column on Audit History

This spec details replacing the "Details" modal with an inline "Parameter Changes" column in the Audit History table on the "MR Audit Changes" page.

## 1. Helper Logic
We will add `getRuleCategory` and `getDiffText` helper functions to `app/audit-changes/page.tsx`. These functions process `beforeState` and `afterState` to return a human-readable text diff string:
- **Surge**: `Threshold Value: [Old] → [New]`
- **Spike**: Lists any changes to `Height`, `Threshold`, `Distance`, or `Prominence`.
- Returns `—` if no parameter changes were detected.

## 2. Server-side Changes
Update `app/audit-changes/page.tsx`:
- Compute the inline text diff string on the server:
  `paramChanges: getDiffText(r.beforeState, r.afterState, r.ruleName)`
- Pass the resolved string to the client.

## 3. Client-side Changes
Update `components/audit-changes/AuditHistoryTable.tsx`:
- Remove imports and references to `ParamDiffModal.tsx`.
- Remove the "Details" action column button.
- Add `['paramChanges', 'Parameter Changes']` to the table column array (`cols`).
- Render the `row.paramChanges` string in the table row cells.
- Include `Parameter Changes` in the Excel export helper.

## 4. File Deletion
- Delete the unused `ParamDiffModal.tsx` file from `components/audit-changes/`.
