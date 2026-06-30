# Design Spec: Subsystem Column in MR Database Catalog

This spec covers adding a dynamic "Subsystem" column to the Monitoring Rule Catalog (MR Database), including layout alignment, filters, and Excel export integration.

## Subsystem Resolution Logic
The "Subsystem" for a Monitoring Rule instance will be determined dynamically inside Next.js based on its timeseries code and the equipment type prefix in the code (e.g. `COCE`, `TRB`, `HX`, `PUM`):

- **Gas Compression**: Equipment contains `COCE`.
- **Gas Turbine Fuel System**: Equipment contains `TRB` (when timeseries has `771` for Gas System).
- **Power Generation**: Equipment contains `TRB` (when timeseries has `774` for Power Generation).
- **Gas Dehydration & Treatment**: Equipment contains `HX`.
- **TEG Circulation Pumps**: Equipment contains `PUM` (when timeseries has `771` for Gas System).
- **Water Injection Pumps**: Equipment contains `PUM` (when timeseries has `772` for Water Injection).
- **Crude Oil Export Pumps**: Equipment contains `PUM` (when timeseries has `773` for Crude Oil).
- **General Process**: Fallback for any other equipment codes.

---

## UI/UX Changes

### 1. Catalog Table Columns
- Add a new `"Subsystem"` column between `"System"` and `"Rule"` columns.
- The column will be searchable using a text input search filter, matching the pattern of other catalog columns.
- Group rows' `colSpan` will automatically adjust to the new column count (using `colSpan={cols.length}`).

### 2. Export to Excel
- The Subsystem column value will be included in the Excel CSV export layout between the System and Rule values.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify Next.js compiles without errors.
- Run `npm run lint` to verify ESLint compliance.

### Manual Verification
- Open the **MR Database** page and verify the "Subsystem" column shows up correctly populated.
- Try filtering by subsystem (e.g. typing "Compression" or "Fuel System") and verify the rows are filtered.
- Export to Excel and verify the CSV contains the "Subsystem" column.
