# Design Spec: Simplified In-Modal Parameter Change History

This spec details the simplified implementation of the parameter change history list inside `EditRuleModal` to comply with SLB Optisite layout constraints.

## 1. Parameters Changes Querying
- On modal load (if `instanceId` is present), fetch parameter change logs from the `audit_log` database table using the existing `getAuditLogsForInstance` server action.
- Filter logs to keep only the parameter updates (`description === 'Updated rule parameters'`).

## 2. Textual Diff Engine
A simple JavaScript helper `getDiffElements` computes the modified parameters textually:
- **Surge rules**: checks if the `threshold_comparison.value` changed.
- **Spike rules**: checks if the `height`, `threshold`, `distance`, or `prominence` fields changed.
- Returns a list of strings: `["Threshold Value: 10 → 12.5"]` or `["Height: null → 1.5", "Prominence: 1.0 → 1.2"]`.

## 3. Simplified List UI
- Render a list of change logs at the bottom of the modal.
- Each item is structured as:
  `[Date & Time] by [Email] - [Parameter Name]: [Old Value] → [New Value]`
  joined by commas if multiple fields changed in a single save.
