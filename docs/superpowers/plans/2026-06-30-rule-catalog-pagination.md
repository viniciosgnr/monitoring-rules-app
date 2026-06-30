# Rule Catalog Pagination Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify `RuleInstanceTable.tsx` to correctly apply `page` and `pageSize` state limits on the displayed rule instances before grouping them.

**Tech Stack:** React, TypeScript.

---

### Task 1: Update RuleInstanceTable.tsx

**Files:**
- Modify: [RuleInstanceTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/RuleInstanceTable.tsx)

- [ ] **Step 1: Implement paginatedInstances and update groups hook**
  Open [RuleInstanceTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/mr-database/RuleInstanceTable.tsx).
  Replace the existing `groups` useMemo block (around lines 89-98) with:
  ```typescript
    const paginatedInstances = useMemo(() => {
      const startIndex = (page - 1) * pageSize;
      return filtered.slice(startIndex, startIndex + pageSize);
    }, [filtered, page, pageSize]);

    const groups = useMemo(() => {
      const map = new Map<string, InstanceRow[]>();
      for (const row of paginatedInstances) {
        const friendly = getFriendlyRuleName(row.ruleName);
        const arr = map.get(friendly) ?? [];
        arr.push(row);
        map.set(friendly, arr);
      }
      return Array.from(map.entries());
    }, [paginatedInstances]);
  ```

- [ ] **Step 2: Commit**
  Run:
  ```bash
  git add components/mr-database/RuleInstanceTable.tsx
  git commit -m "feat: slice rule instances before grouping to support correct table pagination"
  ```

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Verification**
  - Open the MR Database tab.
  - Verify that when page size is set to 5, only 5 rule instances are displayed, grouped cleanly.
  - Navigate to the next page using the pagination chevrons and verify that different instances are displayed.
  - Change page size to 10 or 25 and check that the rows count adapts instantly.
