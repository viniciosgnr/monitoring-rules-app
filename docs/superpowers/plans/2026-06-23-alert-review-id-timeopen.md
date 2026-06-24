# Alert Review Event ID and Time Open Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Alert Review page table: rename the column "Event Manager" to "Event ID", remove button links and render formatted plain text, and add a search/filter field to the "Time Open" column.

**Architecture:** Update `AlertTable.tsx` to pre-calculate unique Event IDs and Time Open values in a `useMemo` block, hook up search filtering, update headers/cells JSX.

**Tech Stack:** Next.js App Router, Tailwind CSS, TypeScript, Radix UI

## Global Constraints

- No type errors or lint warnings.
- Keep table styled identically to surrounding dashboard tables.

---

### Task 1: Refactor `AlertTable.tsx` Table and Filters

**Files:**
- Modify: `components/alert-review/AlertTable.tsx`

**Interfaces:**
- Consumes: None
- Produces: Updated table header and cells for Event ID and Time Open

- [ ] **Step 1: Edit components/alert-review/AlertTable.tsx**

Update the component's imports, data mapping logic, headers, and cells.

```tsx
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { updateAlertStatus } from '@/app/actions/alerts';
import { SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import type { Status } from '@/components/ui/StatusBadge';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  type: string;
  endDate: string;
  triggeredAt: string;
  triggeredAtRaw?: string;
  reviewedAt: string;
  reviewedBy: string;
  status: Status;
  [key: string]: unknown;
}

// ... keep existing order maps and friendly rule name / duration formatting ...
```

Inside the component:
- Add a helper `getEventId` to format the ID (e.g. `event_UNY26-FW1`).
- Map `data` to `enrichedRows` adding `eventId` and `timeOpen` fields.
- Update `filtered` logic to use `enrichedRows` and filter on them.
- Render the correct column headers and search fields.
- Remove link `<a>` from Event ID cell.

- [ ] **Step 2: Run verification tests**

Run: `npm run lint`
Expected: PASS with no lint errors/warnings.

- [ ] **Step 3: Run build verification**

Run: `npm run build`
Expected: PASS with successful next.js compile.

- [ ] **Step 4: Commit changes**

Run: `git add components/alert-review/AlertTable.tsx && git commit -m "feat: refine Event ID and Time Open search filters on Alert Review page"`
Expected: PASS
