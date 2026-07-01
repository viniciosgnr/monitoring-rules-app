# Design Spec: Seeding Parameter Audit Logs Alignment

This spec covers aligning the seeded audit log descriptions with the UI query filter, so that past parameter changes show up on startup in the modal's Parameter Change History.

## 1. Filter Criteria in UI
- The `EditRuleModal` queries logs of a specific instance and filters them using:
  `l.description === 'Updated rule parameters'`

## 2. Seed Alignment
We will update `db/seed.ts` so that when creating Spike and Surge parameter audit logs, we set the log `description` to exactly `'Updated rule parameters'`:
- For `isSpike` audit log entries, set `desc = 'Updated rule parameters'`.
- For `isSurge` audit log entries, set `desc = 'Updated rule parameters'`.

## 3. Database Re-Seeding
- Re-run `npx tsx db/seed.ts` to apply the updated descriptions to the database records.
