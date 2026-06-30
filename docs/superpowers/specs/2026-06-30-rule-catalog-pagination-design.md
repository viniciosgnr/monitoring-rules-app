# Design Spec: Paginated Rule Instance Catalog Rendering

This spec details the fix for the pagination functionality in `RuleInstanceTable`, ensuring that the displayed rows are sliced correctly according to the active `page` and `pageSize` states.

## 1. Current Behavior (Bug)
- The `Pagination` component is rendered at the bottom of the table, showing the correct page navigation controls and total records (`filtered.length`).
- However, the table maps the entire `groups` array (which is grouped from the full `filtered` instances list) without slicing it.
- As a result, all Rule Instances are displayed on a single page, and changing the page or page size has no effect on the rendered table body.

## 2. Proposed Paginated Slicing
To fix this, we will slice the `filtered` instances list by the active pagination parameters before grouping them:
- Compute `paginatedInstances` using `page` and `pageSize` bounds:
  ```typescript
  const paginatedInstances = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, page, pageSize]);
  ```
- Group the sliced `paginatedInstances` by their friendly rule name to compute `groups`:
  ```typescript
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

## 3. Safe Page Boundary Reset
- Whenever filters are modified, the active `page` must be reset to `1`.
- (This is already correctly implemented via `setPage(1)` in the `FilterInput` handler).
