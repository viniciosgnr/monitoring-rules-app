# Monitoring Rule Deactivation Due Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement maintenance window deactivation due dates for rule instances, featuring custom date presets in deactivation modals, a new "Disabled Until" column with glowing expired badges, and database integration.

**Architecture:** Schema updates to include a `deactivatedUntil` timestamp in `rule_instances`. Update the toggle actions to write the due date to the database. Render a date input and preset buttons (+7, +30, +90 days) in deactivation modals, and display formatted dates or glowing red "Expired" badges in a new table column.

**Tech Stack:** React, Next.js, Tailwind CSS, Lucide React, Drizzle ORM, Postgres.

## Global Constraints
- Persist `deactivatedUntil` in `rule_instances` as a nullable timestamp.
- Provide `+7 Days`, `+30 Days`, and `+90 Days` preset buttons in the individual and bulk deactivation modals that dynamically calculate and populate a date picker input.
- Add a new "Disabled Until" column right before the Enabled toggle switch.
- Display `—` for enabled, `"Indefinite"` for disabled without date, formatted `DD/MM/YYYY` for future dates, and a red warning badge `"Expired (DD/MM/YYYY)"` for past dates.
- Include "Disabled Until" in Excel CSV export.

---

### Task 1: Update Database Schema & Database Seeding

**Files:**
- Modify: `db/schema.ts`
- Modify: `db/seed.ts`

**Interfaces:**
- Produces: Updated database schema with `deactivatedUntil` column and fresh seed data containing one expired and one active deactivated rule.

- [ ] **Step 1: Update schema.ts**
  Add the `deactivatedUntil` column to the `ruleInstances` table in [schema.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/schema.ts) (around line 35):
  ```typescript
  export const ruleInstances = pgTable('rule_instances', {
    id:          serial('id').primaryKey(),
    ruleId:      integer('rule_id').notNull().references(() => monitoringRules.id),
    equipmentId: integer('equipment_id').notNull().references(() => equipment.id),
    timeseries:  text('timeseries').notNull(),
    schedule:    varchar('schedule', { length: 20 }).notNull().default('Daily'),
    enabled:     boolean('enabled').notNull().default(true),
    lastRunAt:   timestamp('last_run_at'),
    nextRunAt:   timestamp('next_run_at'),
    deactivatedUntil: timestamp('deactivated_until'),
  });
  ```

- [ ] **Step 2: Update seed.ts**
  Update `db/seed.ts` to include the `deactivatedUntil` field in `ruleInstances` insertion. We'll set the first instance (index 0, which is disabled) to have an expired due date in the past (`2026-01-15T00:00:00`), and the third instance (index 2, which we will force to be disabled) to have a future due date (`2026-09-15T00:00:00`) (around line 65):
  ```typescript
    const instances = await db.insert(ruleInstances).values(
      instancesData.map((data, i) => {
        let enabled = i !== 0 && i !== 2; // Make instance 0 and 2 disabled
        let deactivatedUntil: Date | null = null;
        if (i === 0) {
          deactivatedUntil = new Date('2026-01-15T00:00:00'); // Expired
        } else if (i === 2) {
          deactivatedUntil = new Date('2026-09-15T00:00:00'); // Future
        }
        return {
          ruleId:      data.ruleId,
          equipmentId: data.equipmentId,
          timeseries:  `UNY:FPSO:771-VI-181${i + 1}_X`,
          schedule:    'Hourly',
          enabled,
          lastRunAt:   lastRun,
          nextRunAt:   nextRun,
          deactivatedUntil,
        };
      })
    ).returning();
  ```

- [ ] **Step 3: Run Database Migrations and Seed**
  Apply schema updates to Supabase using:
  ```bash
  npx drizzle-kit push
  ```
  Run the seed script to clean and repopulate the tables:
  ```bash
  npx tsx db/seed.ts
  ```

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add db/schema.ts db/seed.ts
  git commit -m "feat: add deactivatedUntil column to ruleInstances schema and seed expired/future statuses"
  ```

---

### Task 2: Update Server Actions for Toggling Instances

**Files:**
- Modify: `app/actions/ruleInstances.ts`

**Interfaces:**
- Produces: Updated `toggleInstance` and `toggleInstancesBulk` function signatures supporting `deactivatedUntil?: Date | null`.

- [ ] **Step 1: Modify toggleInstance**
  Update `toggleInstance` to accept an optional `deactivatedUntil` parameter, save it to the DB when disabling, and clear it when enabling:
  ```typescript
  export async function toggleInstance(id: number, enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
    const [current] = await db
      .select({
        enabled: ruleInstances.enabled,
      })
      .from(ruleInstances)
      .where(eq(ruleInstances.id, id));

    if (!current) return;

    // When enabling, we reset deactivatedUntil to null
    const updateValues: Record<string, any> = { enabled };
    if (enabled) {
      updateValues.deactivatedUntil = null;
    } else if (deactivatedUntil !== undefined) {
      updateValues.deactivatedUntil = deactivatedUntil;
    }

    await db.update(ruleInstances).set(updateValues).where(eq(ruleInstances.id, id));

    const description = enabled ? 'Enabled rule instance' : 'Disabled rule instance';
    const beforeState = { enabled: current.enabled };
    const afterState = { 
      enabled, 
      reason: reason ?? null,
      deactivatedUntil: enabled ? null : (deactivatedUntil ?? null)
    };

    await db.insert(auditLog).values({
      instanceId: id,
      userEmail: 'operator@sbmoffshore.com',
      description,
      beforeState,
      afterState,
    });

    revalidatePath('/');
  }
  ```

- [ ] **Step 2: Modify toggleInstancesBulk**
  Update `toggleInstancesBulk` to support bulk deactivation with a due date:
  ```typescript
  export async function toggleInstancesBulk(ids: number[], enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
    for (const id of ids) {
      const [current] = await db
        .select({
          enabled: ruleInstances.enabled,
        })
        .from(ruleInstances)
        .where(eq(ruleInstances.id, id));

      if (!current) continue;

      const updateValues: Record<string, any> = { enabled };
      if (enabled) {
        updateValues.deactivatedUntil = null;
      } else if (deactivatedUntil !== undefined) {
        updateValues.deactivatedUntil = deactivatedUntil;
      }

      await db.update(ruleInstances).set(updateValues).where(eq(ruleInstances.id, id));

      const description = enabled ? 'Enabled rule instance (Bulk)' : 'Disabled rule instance (Bulk)';
      const beforeState = { enabled: current.enabled };
      const afterState = { 
        enabled, 
        reason: reason ?? null,
        deactivatedUntil: enabled ? null : (deactivatedUntil ?? null)
      };

      await db.insert(auditLog).values({
        instanceId: id,
        userEmail: 'operator@sbmoffshore.com',
        description,
        beforeState,
        afterState,
      });
    }

    revalidatePath('/');
  }
  ```

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add app/actions/ruleInstances.ts
  git commit -m "feat: support saving and resetting deactivation due dates in toggle actions"
  ```

---

### Task 3: Implement UI Modals, Main Table Column and Excel Export

**Files:**
- Modify: `components/mr-database/RuleInstanceTable.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `deactivatedUntil` from the rule instances database query.

- [ ] **Step 1: Pass deactivatedUntil field in page.tsx**
  Ensure the `deactivatedUntil` field is queried in [page.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/app/page.tsx) and returned in the serialized object:
  - Query select:
    ```typescript
    deactivatedUntil: ruleInstances.deactivatedUntil,
    ```
  - Serialization mapper:
    ```typescript
    deactivatedUntil: r.deactivatedUntil ? new Date(r.deactivatedUntil).toISOString() : null,
    ```

- [ ] **Step 2: Declare custom properties and methods in RuleInstanceTable**
  Update the `InstanceRow` interface in `RuleInstanceTable.tsx`:
  ```typescript
  interface InstanceRow {
    id: number;
    fpso: string;
    equipmentCode: string;
    timeseries: string;
    system: string;
    ruleName: string;
    ruleId: number;
    schedule: string;
    lastRunAt: string;
    nextRunAt: string;
    enabled: boolean;
    processingSteps: object;
    deactivatedUntil: string | null;
    [key: string]: unknown;
  }
  ```

- [ ] **Step 3: Update Toggle handlers inside RuleInstanceTable.tsx**
  Update `handleToggle` and `handleGroupToggle` to accept `deactivatedUntil`:
  ```typescript
  async function handleToggle(id: number, enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
    setData(d => d.map(r => r.id === id ? { ...r, enabled, deactivatedUntil: deactivatedUntil ? deactivatedUntil.toISOString() : null } : r));
    await toggleInstance(id, enabled, reason, deactivatedUntil);
  }

  async function handleGroupToggle(ids: number[], enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
    setData(d => d.map(r => ids.includes(r.id) ? { ...r, enabled, deactivatedUntil: deactivatedUntil ? deactivatedUntil.toISOString() : null } : r));
    await toggleInstancesBulk(ids, enabled, reason, deactivatedUntil);
  }
  ```

- [ ] **Step 4: Update Deactivation Modals State and Layout**
  Inside the individual deactivation modal and group deactivation modal, declare state for the due date and preset handlers:
  ```typescript
  const [dueDate, setDueDate] = useState('');

  // Preset setter helper:
  function applyPresetDays(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  }
  ```
  Render the due date section right below the justification select box in the dialog body:
  ```tsx
  <div>
    <label className="text-xs text-text-muted font-medium">Deactivation Due Date (Optional)</label>
    <div className="flex gap-2 mt-1.5">
      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        className="bg-bg-input border border-border-panel rounded px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors flex-1"
      />
      <button
        type="button"
        onClick={() => applyPresetDays(7)}
        className="px-2.5 py-1.5 text-xs font-semibold rounded bg-bg-panel border border-border-panel text-text-primary hover:border-accent-blue transition-colors cursor-pointer"
      >
        +7 Days
      </button>
      <button
        type="button"
        onClick={() => applyPresetDays(30)}
        className="px-2.5 py-1.5 text-xs font-semibold rounded bg-bg-panel border border-border-panel text-text-primary hover:border-accent-blue transition-colors cursor-pointer"
      >
        +30 Days
      </button>
      <button
        type="button"
        onClick={() => applyPresetDays(90)}
        className="px-2.5 py-1.5 text-xs font-semibold rounded bg-bg-panel border border-border-panel text-text-primary hover:border-accent-blue transition-colors cursor-pointer"
      >
        +90 Days
      </button>
    </div>
  </div>
  ```
  Make sure `setDueDate('')` is called when resetting/opening the deactivation modals, and pass the selected date (if any) to the confirm toggle handlers:
  ```typescript
  function confirmDisable() {
    if (!disableRow) return;
    const reason = disableReason === 'Other' ? customReason : disableReason;
    const d = dueDate ? new Date(dueDate) : null;
    handleToggle(disableRow.id, false, reason, d);
    setDisableRow(null);
  }

  function confirmGroupDisable() {
    if (!disableGroupData) return;
    const reason = disableReason === 'Other' ? customReason : disableReason;
    const d = dueDate ? new Date(dueDate) : null;
    const ids = disableGroupData.rows.map(r => r.id);
    handleGroupToggle(ids, false, reason, d);
    setDisableGroupData(null);
  }
  ```

- [ ] **Step 5: Add Column and Exponent Cell Visual Rendering**
  Add `"Disabled Until"` to the `cols` list in `RuleInstanceTable.tsx`:
  ```typescript
  const cols: [string, string][] = [
    ['fpso', 'FPSO'],
    ['equipmentCode', 'Equipment'],
    ['timeseries', 'Timeseries'],
    ['system', 'System'],
    ['ruleName', 'Rule'],
    ['schedule', 'Schedule'],
    ['lastRunAt', 'Last Run At'],
    ['nextRunAt', 'Next Run At'],
    ['deactivatedUntil', 'Disabled Until'],
  ];
  ```
  Implement custom cell rendering for the new column in the individual rows section. If the column field is `'deactivatedUntil'`, check current time comparison and render appropriate formatting:
  ```tsx
  {cols.map(([field, label]) => {
    if (field === 'deactivatedUntil') {
      let content: React.ReactNode = '—';
      if (!row.enabled) {
        if (!row.deactivatedUntil) {
          content = <span className="text-text-muted">Indefinite</span>;
        } else {
          const limit = new Date(row.deactivatedUntil);
          const now = new Date();
          const dateStr = limit.toLocaleDateString('pt-BR');
          if (now > limit) {
            content = (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Expired ({dateStr})
              </span>
            );
          } else {
            content = <span className="text-text-primary font-medium">{dateStr}</span>;
          }
        }
      }
      return (
        <td key={field} className="px-4 py-3 text-sm">
          {content}
        </td>
      );
    }

    // Default renderings:
    if (field === 'fpso') return <td key={field} className="px-4 py-3 text-text-muted text-sm">{row.fpso}</td>;
    // ... rest of the original fields ...
  })}
  ```

- [ ] **Step 6: Update CSV Export to include column**
  Update `downloadExcel()` inside `RuleInstanceTable.tsx` to export the `"Disabled Until"` value:
  ```typescript
  function downloadExcel() {
    const headers = ['FPSO', 'Equipment', 'Timeseries', 'System', 'Rule', 'Schedule', 'Last Run At', 'Next Run At', 'Disabled Until', 'Enabled'];
    const csvRows = [headers.join(',')];

    for (const row of filtered) {
      let disabledUntilStr = '—';
      if (!row.enabled) {
        if (!row.deactivatedUntil) {
          disabledUntilStr = 'Indefinite';
        } else {
          const limit = new Date(row.deactivatedUntil);
          disabledUntilStr = limit.toLocaleDateString('pt-BR');
          if (new Date() > limit) {
            disabledUntilStr = `Expired (${disabledUntilStr})`;
          }
        }
      }

      const values = [
        row.fpso,
        row.equipmentCode,
        row.timeseries,
        row.system,
        row.ruleName,
        row.schedule,
        row.lastRunAt,
        row.nextRunAt,
        disabledUntilStr,
        row.enabled ? 'Yes' : 'No'
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    }
    // ... rest of csv download trigger logic ...
  }
  ```

- [ ] **Step 7: Commit**
  Run:
  ```bash
  git add app/page.tsx components/mr-database/RuleInstanceTable.tsx
  git commit -m "feat: render deactivation due date inputs, presets, catalog column, and csv export support"
  ```

---

### Task 4: Verify and Build

**Files:**
- None.

- [ ] **Step 1: Run Linter**
  Run: `npm run lint`
  Expected: Success without warnings or errors.

- [ ] **Step 2: Run Build**
  Run: `npm run build`
  Expected: Success without TypeScript or compilation errors.

- [ ] **Step 3: Verification Check**
  - Open http://localhost:3000 in your browser.
  - Check that one rule displays as "Expired (15/01/2026)" in red with a blinking dot.
  - Check that one rule displays as "15/09/2026".
  - Attempt to disable a rule and select a date or use preset "+30 Days", verify that it is populated.
  - Save deactivation and confirm the date is displayed in the new column.
  - Enable it and check it resets.
  - Export CSV and verify data formatting.
