# Design Spec: Monitoring Rule Modal Fields by Rule Type

This spec covers customizing the edit modal (`EditRuleModal.tsx`) fields based on the Monitoring Rule type.

## Custom Fields by Rule Type

### 1. Surge (Surge Margin)
- **Identification**: Rule name contains `SURG`, `THR`, or `TME_NRS`.
- **Title**: `Surge Margin Parameters`
- **Description**: Rendered as a read-only block at the top:
  > This rule monitors the surge margin by checking if the equipment operates in a condition lower than the minimum threshold limit. An alert is raised if the equipment operates for more than 50% of the last day in such a condition.
- **Rule Trigger Parameters**:
  - `Threshold` (value): Numerical input (editable, default: `10`).
  - `Operator`: Read-only value `gt`.
- **Event Trigger Parameters**:
  - `Rule`: Read-only value `"0&1"`.
  - `Value`: Numerical input (editable, default: `50`).
  - `Operator`: Read-only value `gt`.
  - `Time Period`: Numerical input (editable, default: `24`).
  - `Time Period Unit`: Text input (editable, default: `h`).

### 2. Spike
- **Identification**: Rule name contains `SPK` or `SPIKE`.
- **Title**: `Spike Detection Parameters`
- **Description**: Rendered as a read-only block at the top:
  > This rule monitors equipment for spikes in timeseries data and filters detected spikes based on operational status.
- **Rule Trigger Parameters**:
  - `Height`: Numerical/nullable input (editable, default: `null`/empty).
  - `Threshold`: Numerical/nullable input (editable, default: `null`/empty).
  - `Distance`: Numerical input (editable, default: `60`).
  - `Prominence`: Numerical input (editable, default: `1.0`).
  - `Timedelta (minutes)`: Numerical input (editable, default: `480`).
  - `Status Check Value`: Numerical input (editable, default: `1`).
- **Event Trigger Parameters**:
  - `Value`: Numerical input (editable, default: `0`).
  - `Operator`: Read-only value `gt`.

### 3. Generic Rules (Trend, Drift, Normalized dP, etc.)
- Keep the original `Data Processing Steps` fields:
  - Abs Value (read-only tags view)
  - Drop Missing (read-only tags view)
  - Join Timeseries (read-only tags view)
  - Round Timestamp (editable Period, read-only tags view)

## Database Integration
All parameters will be read from and saved to the `processingSteps` JSONB field of the `ruleInstances` table. The backend server actions will preserve existing fields when saving.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify Next.js compiles without errors.
- Run `npm run lint` to verify ESLint compliance.

### Manual Verification
- Open the **MR Database** page in the browser.
- Open the Edit modal for a Surge rule (e.g. `COCE_SURG_MGN_06` or `PUMP_VIB_THR_02`) and verify custom Surge Margin fields.
- Open the Edit modal for a Spike rule (e.g. `COCE_GEN_SPK_01`) and verify custom Spike fields.
- Open the Edit modal for a Trend rule and verify original Data Processing fields.
