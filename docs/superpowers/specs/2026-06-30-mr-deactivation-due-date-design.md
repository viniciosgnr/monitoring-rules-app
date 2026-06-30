# Design Spec: Monitoring Rule Deactivation Due Date

This spec covers implementing deactivation due dates (maintenance windows) for Monitoring Rule instances in the catalog, including visual warnings for expired configurations and database integration.

## Database Integration

### 1. Database Schema (`db/schema.ts`)
- Add the `deactivatedUntil` column to the `rule_instances` table:
  ```typescript
  deactivatedUntil: timestamp('deactivated_until'),
  ```

### 2. Database Seeding (`db/seed.ts`)
- The seeding script will be updated to seed one of the disabled rule instances with a deactivation due date set in the past (e.g. `2026-01-15T00:00:00`), so it appears as `"Expired"` on initial page load.
- Another rule instance will be seeded as disabled with a future date to show the active maintenance window status.

---

## UI/UX Changes

### 1. Individual & Bulk Deactivation Modals (`RuleInstanceTable.tsx`)
- Inside the justification dialog for both individual disable action and group bulk disable action:
  - Add a **"Deactivation Period (Due Date)"** date picker input field.
  - Render fast preset buttons: **"+7 Days"**, **"+30 Days"**, and **"+90 Days"**.
  - Clicking a preset calculates the date based on the current local time and updates the date picker input value.
  - The date picker input will be optional. If not set, the rule is disabled indefinitely.

### 2. Main Rule Instance Table (`RuleInstanceTable.tsx`)
- Add a new column header `"Disabled Until"` right before the Enabled toggle switch.
- Display values:
  - Enabled instances: render `—`.
  - Disabled instances with no due date: render `"Indefinite"`.
  - Disabled instances with future due date: render the date formatted as `DD/MM/YYYY`.
  - Disabled instances with past due date: render a glowing red badge/dot with `"Expired (DD/MM/YYYY)"`.
- Update the **Export to Excel** routine to export the `Disabled Until` values.

---

## Server Actions (`app/actions/ruleInstances.ts`)
- Update `toggleInstance` and `toggleInstancesBulk` to accept `deactivatedUntil` as a string/Date.
- Update `auditLog` to include the `deactivatedUntil` property in the `afterState` state capture.
- When toggling a rule to Enabled, clear `deactivatedUntil` (set to `null`) in the database.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify compiling.
- Run `npm run lint` to verify ESLint compliance.

### Manual Verification
- Verify that one of the rules (e.g. the first Spike rule instance) shows as `"Expired"` in red on the MR Database catalog.
- Disable a rule instance, select a custom date or use the "+30 Days" preset, confirm deactivation, and check the date in the column.
- Turn it back on and check that the column goes back to `—`.
- Export to Excel and verify the `Disabled Until` column is correctly populated in the CSV.
