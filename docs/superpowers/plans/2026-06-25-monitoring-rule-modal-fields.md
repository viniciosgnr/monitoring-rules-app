# Custom Monitoring Rule Modal Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customize `EditRuleModal.tsx` to render specific parameter input fields for Surge (Surge Margin) and Spike rules, while retaining the generic "Data Processing Steps" layout for other rules.

**Architecture:** Extend `EditRuleModal.tsx` to conditionally render inputs based on the friendly name category of the monitoring rule. Store all modified configurations back in the same `processingSteps` JSONB database field.

**Tech Stack:** Next.js App Router, Tailwind CSS, TypeScript, Radix UI

## Global Constraints

- No type compilation or ESLint errors.
- Preserve existing data/keys in `processingSteps` when saving.

---

### Task 1: Refactor `EditRuleModal.tsx` to Render Custom Fields

**Files:**
- Modify: `components/mr-database/EditRuleModal.tsx`

**Interfaces:**
- Consumes: `steps` as `any` prop from `RuleInstanceTable.tsx`
- Produces: Updated layout for Surge, Spike, and generic rule modal forms

- [ ] **Step 1: Update type signatures and state in EditRuleModal.tsx**

Update `Props` and component state to handle any parameter structure:

```tsx
interface Props {
  open: boolean;
  onClose: () => void;
  ruleId: number;
  ruleName: string;
  equipmentCode: string;
  steps: any;
}
```

And inside:

```tsx
  const [s, setS] = useState<any>(steps || {});
```

- [ ] **Step 2: Add category identification helper**

Define helpers inside `EditRuleModal.tsx`:

```typescript
function getRuleCategory(ruleName: string): 'surge' | 'spike' | 'generic' {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('TME_NRS')) return 'surge';
  return 'generic';
}
```

- [ ] **Step 3: Define default values initialization**

Ensure fields are safely initialized:
- For Surge:
  - `s.rule_trigger_params` should default to `[{ threshold_comparison: { value: 10, operator: 'gt' }, status_check: { value: 1 } }]` (or equivalent nested object).
  - `s.event_trigger_params` should default to `[{ time_totalization: { rule: '0&1', value: 50, operator: 'gt', time_period: 24, time_period_unit: 'h' } }]`.
- For Spike:
  - `s.rule_trigger_params` should default to `[{ spike_detection: { distance: 60, prominence: 1.0 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }]`.
  - `s.event_trigger_params` should default to `[{ spike_detection_trigger: { value: 0, operator: 'gt' } }]`.

*(Note: The YAML structure has rule_trigger_params and event_trigger_params as arrays of objects. We should support both direct object structures or arrays containing objects when reading/writing to ensure compatibility).*

Let's standardize the read/write mappings:
- For Surge:
  - `thresholdValue = s.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10`
  - `thresholdOperator = s.rule_trigger_params?.[0]?.threshold_comparison?.operator ?? 'gt'`
  - `eventRule = s.event_trigger_params?.[0]?.time_totalization?.rule ?? '0&1'`
  - `eventValue = s.event_trigger_params?.[0]?.time_totalization?.value ?? 50`
  - `eventOperator = s.event_trigger_params?.[0]?.time_totalization?.operator ?? 'gt'`
  - `timePeriod = s.event_trigger_params?.[0]?.time_totalization?.time_period ?? 24`
  - `timePeriodUnit = s.event_trigger_params?.[0]?.time_totalization?.time_period_unit ?? 'h'`

- For Spike:
  - `height = s.rule_trigger_params?.[0]?.spike_detection?.height ?? null`
  - `threshold = s.rule_trigger_params?.[0]?.spike_detection?.threshold ?? null`
  - `distance = s.rule_trigger_params?.[0]?.spike_detection?.distance ?? 60`
  - `prominence = s.rule_trigger_params?.[0]?.spike_detection?.prominence ?? 1.0`
  - `timedeltaMinutes = s.rule_trigger_params?.[0]?.filter_spikes_near_filter_false?.timedelta_minutes ?? 480`
  - `statusCheckValue = s.rule_trigger_params?.[0]?.status_check?.value ?? 1`
  - `eventValue = s.event_trigger_params?.[0]?.spike_detection_trigger?.value ?? 0`
  - `eventOperator = s.event_trigger_params?.[0]?.spike_detection_trigger?.operator ?? 'gt'`

- [ ] **Step 4: Update JSX content conditionally**

- Render the category's specific description at the top.
- Render Surge Margin Parameters forms when category is `'surge'`.
- Render Spike Parameters forms when category is `'spike'`.
- Render original Data Processing Steps when category is `'generic'`.

- [ ] **Step 5: Run ESLint verification**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Run build verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 7: Commit changes**

Run: `git add components/mr-database/EditRuleModal.tsx && git commit -m "feat: customize EditRuleModal fields by monitoring rule category"`
Expected: PASS
