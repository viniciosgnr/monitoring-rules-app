# Parameter Traceability Implementation Plan (Static Labels)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the parameter inputs in `EditRuleModal.tsx` to display their originally loaded database values permanently underneath as static text reference indicators.

**Architecture:** Remove the comparison checks (e.g. `initialThreshold !== thresholdValue`) before rendering the label block, so the indicator renders unconditionally.

**Tech Stack:** React.

---

### Task 1: Render Previous Value Labels Statically in EditRuleModal.tsx

**Files:**
- Modify: `components/mr-database/EditRuleModal.tsx`

- [ ] **Step 1: Make Surge Threshold Value label static**
  Update the Surge parameter rendering block (around lines 350-380) to render the label unconditionally:
  ```tsx
                  <FieldBlock label="Threshold Value">
                    <input
                      type="number"
                      value={thresholdValue}
                      disabled={isViewer}
                      onChange={e => {
                        ...
                      }}
                      className={inputCls}
                    />
                    <span className="text-xs text-text-muted mt-1 block">
                      Previous value: <span className="font-semibold text-text-primary">{initialThresholdValue}</span>
                    </span>
                  </FieldBlock>
  ```

- [ ] **Step 2: Make Spike Height label static**
  Update the Spike Height parameter block (around lines 390-410) to render the label unconditionally:
  ```tsx
                  <FieldBlock label="Height">
                    <input
                      type="number"
                      value={heightSpike ?? ''}
                      disabled={isViewer}
                      onChange={e => {
                        ...
                      }}
                      placeholder="null"
                      className={inputCls}
                    />
                    <span className="text-xs text-text-muted mt-1 block">
                      Previous value: <span className="font-semibold text-text-primary">{initialHeightSpike === '' ? 'null' : initialHeightSpike}</span>
                    </span>
                  </FieldBlock>
  ```

- [ ] **Step 3: Make Spike Threshold label static**
  Update the Spike Threshold parameter block (around lines 415-435) to render the label unconditionally:
  ```tsx
                  <FieldBlock label="Threshold">
                    <input
                      type="number"
                      value={thresholdSpike ?? ''}
                      disabled={isViewer}
                      onChange={e => {
                        ...
                      }}
                      placeholder="null"
                      className={inputCls}
                    />
                    <span className="text-xs text-text-muted mt-1 block">
                      Previous value: <span className="font-semibold text-text-primary">{initialThresholdSpike === '' ? 'null' : initialThresholdSpike}</span>
                    </span>
                  </FieldBlock>
  ```

- [ ] **Step 4: Make Spike Distance label static**
  Update the Spike Distance parameter block (around lines 440-460) to render the label unconditionally:
  ```tsx
                  <FieldBlock label="Distance">
                    <input
                      type="number"
                      value={distanceSpike}
                      disabled={isViewer}
                      onChange={e => {
                        ...
                      }}
                      className={inputCls}
                    />
                    <span className="text-xs text-text-muted mt-1 block">
                      Previous value: <span className="font-semibold text-text-primary">{initialDistanceSpike}</span>
                    </span>
                  </FieldBlock>
  ```

- [ ] **Step 5: Make Spike Prominence label static**
  Update the Spike Prominence parameter block (around lines 465-485) to render the label unconditionally:
  ```tsx
                  <FieldBlock label="Prominence">
                    <input
                      type="number"
                      step="0.1"
                      value={prominenceSpike}
                      disabled={isViewer}
                      onChange={e => {
                        ...
                      }}
                      className={inputCls}
                    />
                    <span className="text-xs text-text-muted mt-1 block">
                      Previous value: <span className="font-semibold text-text-primary">{initialProminenceSpike}</span>
                    </span>
                  </FieldBlock>
  ```

- [ ] **Step 6: Commit**
  Run:
  ```bash
  git add components/mr-database/EditRuleModal.tsx
  git commit -m "feat: render previous values labels statically under input fields"
  ```

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Testing**
  - Open a rule instance Edit modal.
  - Verify that the "Previous value: X" label is visible directly below each parameter field on open.
  - Modify parameters and check that the label remains static and visible, acting as a permanent visual reference.
