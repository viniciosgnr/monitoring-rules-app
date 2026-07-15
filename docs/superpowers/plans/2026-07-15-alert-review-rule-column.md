# Add Rule Column and Remove Rule Search Toolbar in Alert Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the Alert Review table, add a dedicated "Rule" column (positioned between "Asset" and "Type") with its own column-level search filter. Remove the "Rule" search input from the upper right toolbar since column filters are more integrated.

---

### Task 1: Update components/alert-review/AlertTable.tsx

**Files:**
- Modify: [AlertTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/alert-review/AlertTable.tsx)

- [ ] **Step 1: Remove ruleSearch state and logic**
  Open [AlertTable.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/alert-review/AlertTable.tsx).
  - Delete `const [ruleSearch, setRuleSearch] = useState('');` at line 103.
  - Simplify the `filtered` memo logic: remove references to `ruleSearch` and `ruleMatch`, keeping only `colMatch` evaluation. Remove `ruleSearch` from the `useMemo` dependencies list.

- [ ] **Step 2: Remove Rule Search from the toolbar**
  Find the toolbar JSX section rendering:
  ```tsx
          {/* Rule search */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Rule</span>
            <input ... />
          </div>
  ```
  Delete this code block entirely.

- [ ] **Step 3: Add Rule Header Column**
  In the table header `<thead>`, insert the `Rule` column with a `FilterInput` between "Asset" and "Type":
  ```tsx
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Rule
                <FilterInput field="ruleName" />
              </th>
  ```

- [ ] **Step 4: Add Rule Body Column**
  In the body row rendering, insert the rule name cell between `Asset` and `Type`:
  ```tsx
                      <td className="px-4 py-3 text-text-muted font-mono text-xs">{row.ruleName}</td>
  ```

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
