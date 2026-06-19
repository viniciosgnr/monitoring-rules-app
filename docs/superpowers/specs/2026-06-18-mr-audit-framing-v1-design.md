# MR Audit Changes — Framing v1 Design Spec

**Date:** 2026-06-18  
**Author:** Proxy PO framing session  
**Status:** Approved for implementation

## Goal

Simplify the MR Audit Changes page to focus on the audit history table and replace the developer-facing JSON diff modal with a human-readable parameter comparison panel compatible with SLB OptiSite UX conventions.

## Changes

### 1. Remove 3 charts
Remove `HBarChart` (Most Modified Equipment), `HBarChart` (Most Modified Rules), and `DonutChart` (Change Types) from `AuditClient.tsx`. The 3-column chart grid section is deleted entirely. KPIs remain unchanged for now (to be refined in a future framing session).

### 2. New "View Diff" — Parameter Comparison Panel
Replace `ViewDiffModal.tsx` (JSON side-by-side) with a new `ParamDiffModal.tsx` that renders a structured parameter table.

**Layout:**
- Modal header: `Parameter Changes` title + Equipment badge + Rule name
- Sub-header line: `timestamp • Changed by: user@email.com`
- Body: a clean table/list of all parameters with 3 columns:
  - **Parameter** — path/name of the field (e.g. `threshold_comparison.operator`)
  - **Before** — old value, styled with red background pill + strikethrough if changed
  - **After** — new value, styled with green/cyan background pill if changed
- Rows where Before === After are shown in muted grey (unchanged context)
- No raw JSON visible at any point

**Color spec:**
- Changed / Before: `bg-red-950 text-red-300 line-through`
- Changed / After: `bg-cyan-950 text-cyan-300 font-medium`
- Unchanged: `text-text-muted` (no background pill)

**Data extraction:**
The `beforeState` and `afterState` JSONB fields are recursively flattened into key-value pairs using dot-notation paths. Comparison is done client-side by diffing the two flat maps.

### 3. Rule nomenclature
Rule names (e.g. `COCE_GEN_SPK_01`) are displayed as plain monospace text in the Audit History table. No badge, no tooltip.

### 4. Seed data enrichment
Update `db/seed.ts` so that `beforeState` and `afterState` contain meaningfully different values (e.g. operator `gt` → `gte`, time_period `24` → `48`) so the new diff panel has real content to display during demos.

## Out of Scope (this iteration)
- KPI redesign (deferred to next framing session)
- Filtering/sorting on the audit table
- Audit log export
