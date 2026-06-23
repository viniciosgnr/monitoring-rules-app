# Design Spec: Remove KPI Cards from MR Audit Changes Page

This spec covers removing the 4 KPI cards (`TOTAL CHANGES`, `PEAK DAY`, `TOP EDITOR SHARE`, `HOT RULE`) from the **MR Audit Changes** page.

## Proposed Changes

- Remove unused imports (`KpiCard`) and the JSX markup rendering the cards inside `components/audit-changes/AuditClient.tsx`.
- Update `AuditClient`'s React `Props` interface and destructured parameters to omit `totalChanges`, `peakDay`, `topEditorShare`, and `hotRule`.
- Update the page container `app/audit-changes/page.tsx` to stop passing the removed KPI props to `<AuditClient />`.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify Next.js compiles without errors.
- Run `npm run lint` to verify ESLint compliance.

### Manual Verification
- Access the **MR Audit Changes** page and confirm that the KPI cards are removed, while the layout and audit history table remain intact.
