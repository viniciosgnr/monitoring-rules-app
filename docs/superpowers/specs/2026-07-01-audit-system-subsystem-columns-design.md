# Design Spec: System and Subsystem Columns in Audit Changes History

This spec details adding "System" and "Subsystem" columns to the "Audit History" table on the "MR Audit Changes" page, enabling users to easily search and filter modifications by their monitored areas.

## 1. Helper Resolvers
We will define `getSystemFromTimeseries` and `getSubsystem` in `app/audit-changes/page.tsx` (identical to the dashboard resolvers) to extract monitored systems based on the timeseries codes and equipment prefix codes:
- **System**: resolves to Gas System (771), Water Injection System (772), Crude Oil System (773), Power Generation System (774), or Utility System.
- **Subsystem**: resolves to Gas Compression, Gas Turbine Fuel System, Gas Dehydration & Treatment, Water Injection Pumps, Crude Oil Export Pumps, TEG Circulation Pumps, or Utility Water Pumps.

## 2. Server-side Changes
Update the database query inside `AuditChangesPage` (`app/audit-changes/page.tsx`):
- Fetch the `timeseries` field: `ruleInstances.timeseries`.
- Map the rows to inject resolved `system` and `subsystem` strings.

## 3. Client-side Changes
Update `AuditHistoryTable.tsx`:
- Add `system` and `subsystem` fields to the `AuditEntry` interface.
- Define a `cols` structure to map headers programmatically:
  `['timestamp', 'Timestamp'], ['userEmail', 'User'], ['equipmentCode', 'Equipment'], ['system', 'System'], ['subsystem', 'Subsystem'], ['ruleName', 'Rule'], ['description', 'Description']`
- Adjust the group header row to use `colSpan={cols.length}`.
- Render the text-filtered columns in the table body.
- Update `downloadExcel()` to export `System` and `Subsystem` data aligned in the CSV.
