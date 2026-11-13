# Technical Specification: Analytics Mathematical Model, Filters & SQL Queries

This document provides the complete technical specification for the calculation engine powering the **Analytics** page in the **Monitoring Rules Management (SLB Optisite)** application. It details the official status lifecycle (`New`, `Review in Progress`, `Eligible for Event Manager`, `Rejected`), mathematical formulas for all KPI cards and charts across both tabs (**Overview & Trends** and **Alerts Treated**), the cumulative time-series strategy, global filter intersections, and production-ready SQL query implementations.

---

## 1. Overview & Layout Architecture

The **Analytics** page is organized into global controls, top-level KPI summary cards, and two specialized analytical tabs:

1. **Global KPI Summary Cards**:
   - **Accuracy (%)**
   - **False Positive Rate (%)**
   - **Avg. Time to Treat (days)**
2. **Tab 1 — Overview & Trends**:
   - **Trend Line Charts**: *Accuracy Over Time* and *False Positive Over Time* (cumulative percentage progression alongside the cumulative count on hover).
   - **Breakdown Tables**: *Accuracy Breakdown by Instance* and *False Positive Breakdown by Instance*.
   - **Ranking Table**: *Bad Actors List* (ranked by highest alert volume and noise).
3. **Tab 2 — Alerts Treated**:
   - **Lead Time Composed Chart**: *Days to Treat an Alert (Average)* (grouped vertical bars per FPSO unit overlaid with the weighted *Fleet* average trend line, displaying average days and absolute treated alerts in tooltips).
   - **Distribution Charts**: *Alerts Treated by Status* (with Volume vs. 100% Normalized Percentage toggle) and *Alerts Treated by Monitoring Rule* (dynamic Top 5 rule families + `Other`).
   - **Workforce & Process Breakdown**: *Alerts by Responsible* (stacked bars for `Eligible for Event Manager`, `Rejected`, and `Review in Progress` per reviewer) and *Alerts by System* (stacked bars for all 4 lifecycle statuses per monitored process system).

### 1.1 Official Alert Status Lifecycle & Mapping

| UI Status Name | Database `status` Value | Lifecycle Role in Analytics |
| :--- | :--- | :--- |
| **New** | `'new'`, `'to_be_validated'` | Pending initial review (excluded from evaluation denominators; included in volume/system distributions). |
| **Review in Progress** | `'review_in_progress'`, `'validation_in_progress'` | Currently under operator investigation (included in workforce review charts and status/system distributions). |
| **Eligible for Event Manager** | `'eligible_for_em'`, `'validated'` | Confirmed true positive operational alert (numerator for *Accuracy*; included in *Total Evaluations* and *Time to Treat*). |
| **Rejected** | `'rejected'` | Discarded false positive / noise alert (numerator for *False Positive Rate*; included in *Total Evaluations* and *Time to Treat*). |

### Mathematical Integrity Principle

To prevent discrepancies where charts show different values from top summary cards, **100% of calculations are unified and derived from the exact same alert database history (`alerts`)**:

> **NOTE:** All components utilize the exact same time window (`periodStart` to `periodEnd`) and the same globally filtered alert dataset (`FPSO ∩ Period ∩ Asset ∩ Category`).

---

## 2. Unified Calculation Formulas

### 2.1 Total Evaluations (Resolved Alert Denominator)

Only alerts that have reached a final operator resolution (**Eligible for Event Manager** or **Rejected**) are counted as evaluations. Pending alerts (**New** and **Review in Progress**) are excluded from the denominator so they do not artificially depress accuracy or false positive rates before review.

$$\text{Total Evaluations} = \text{Eligible for Event Manager} + \text{Rejected}$$

### 2.2 Accuracy (Accuracy %)

Accuracy measures the proportion of evaluated alerts that were confirmed as legitimate operational events (**Eligible for Event Manager**):

$$\text{Accuracy \%} = \frac{\text{Eligible for Event Manager}}{\text{Eligible for Event Manager} + \text{Rejected}} \times 100$$

- **Eligible for Event Manager (`eligible_for_em`)**: Alerts confirmed as real operational events and eligible for release to Event Manager.
- **Complementarity Property**: For any evaluated dataset where $\text{Total Evaluations} > 0$, $\text{Accuracy \%} + \text{False Positive \%} = 100\%$.

### 2.3 False Positive Rate (False Positive %)

The false positive rate measures the percentage of discarded/noise alerts (**Rejected**) relative to total evaluated alerts:

$$\text{False Positive \%} = \frac{\text{Rejected}}{\text{Eligible for Event Manager} + \text{Rejected}} \times 100$$

- **Rejected (`rejected`)**: Alerts classified by the operator as false alarms or sensor/process noise.

### 2.4 Average Time to Treat (Avg. Time to Treat)

Measures the mean lead time in days required for an operator to resolve an alert from creation (`triggeredAt`) to final review (`reviewedAt`):

$$\text{Avg. Time to Treat (days)} = \frac{1}{N_{\text{treated}}} \sum_{k=1}^{N_{\text{treated}}} \max\left(0, \frac{\text{reviewedAt}_k - \text{triggeredAt}_k}{86,400,000\text{ ms}}\right)$$

- **$N_{\text{treated}}$**: Total alerts within the filtered period with status in (`Eligible for Event Manager`, `Rejected`) and a non-null `reviewedAt` timestamp.

---

## 3. Cumulative Trend Line Strategy (Overview & Trends)

### 3.1 Cumulative Formulation

In the cumulative model, for each bucket $i$ in the time-series (from bucket $0$ to bucket $N-1$), the percentage curve aggregates resolved alerts occurring **from the start of the selected period (`periodStart`) up to the end boundary of that bucket (`bucket_i.end`)**, while the tooltip surfaces the **cumulative count** to maintain 100% mathematical fidelity with the percentage:

- **Bucket $i$ Cumulative Window**: $[\text{periodStart} \rightarrow \text{bucket\_i.end}]$
- **Cumulative Eligible Count ($\text{CumEligible}_i$)**: Count of `Eligible for Event Manager` alerts in $[\text{periodStart}, \text{bucket\_i.end}]$.
- **Cumulative Rejected Count ($\text{CumRejected}_i$)**: Count of `Rejected` alerts in $[\text{periodStart}, \text{bucket\_i.end}]$.

$$\text{Accuracy}(i) = \frac{\text{CumEligible}_i}{\text{CumEligible}_i + \text{CumRejected}_i} \times 100$$

$$\text{False Positive \%}(i) = \frac{\text{CumRejected}_i}{\text{CumEligible}_i + \text{CumRejected}_i} \times 100$$

- **Interactive Tooltip Format**: Hovering over bucket $i$ displays the cumulative percentage and the cumulative count of alerts:
  - *Accuracy Over Time*: `Accuracy : {Accuracy(i)}% ({CumEligible_i} alerts)`
  - *False Positive Over Time*: `False Positive Rate : {False Positive %(i)}% ({CumRejected_i} alerts)`

---

## 4. Tab-Specific Chart Mathematical Definitions

### 4.1 Tab 1 — Overview & Trends

#### 4.1.1 Accuracy & False Positive Breakdown Tables
- **Evaluations**: $\text{TotalEvaluations} = \text{Eligible} + \text{Rejected}$ per instance.
- **Accuracy**: $(\text{Eligible} / \text{TotalEvaluations}) \times 100$.
- **FP Rate**: $(\text{Rejected} / \text{TotalEvaluations}) \times 100$.

#### 4.1.2 Bad Actors List
- **Ranking Metric**: Sort descending by total alert volume $\text{AlertsCount} = \text{Eligible} + \text{Rejected} + \text{Review in Progress} + \text{New}$.
- Displays FPSO, Rule Name, Asset, Accuracy (%), FP Rate (%), and Alerts Count.

---

### 4.2 Tab 2 — Alerts Treated

#### 4.2.1 Days to Treat an Alert — Per FPSO & Fleet Average
For each time bucket $i$ ($\text{bucket\_i.start}$ to $\text{bucket\_i.end}$), grouped vertical bars represent each active FPSO $u$ alongside an overlaid **Fleet** line:

- **Per-FPSO Bar ($\text{Days}_{u,i}$)**:
  $$\text{Days}_{u,i} = \frac{1}{|T_{u,i}|} \sum_{a \in T_{u,i}} \max\left(0, \frac{a.\text{reviewedAt} - a.\text{triggeredAt}}{86,400,000\text{ ms}}\right)$$
- **Fleet Average Line ($\text{Fleet}_i$)**:
  $$\text{Fleet}_i = \frac{1}{|T_i|} \sum_{a \in T_i} \max\left(0, \frac{a.\text{reviewedAt} - a.\text{triggeredAt}}{86,400,000\text{ ms}}\right)$$
- **Tooltip**: Displays lead time in days and treated alert count: `{Days} days ({Count} alerts)` and `Fleet Avg : {Fleet} days ({Total} total)`.

#### 4.2.2 Alerts Treated by Status
- **Volume Mode (`Vol`)**: Plots raw counts of `New`, `Review in Progress`, `Eligible for Event Manager`, and `Rejected` in bucket $i$.
- **Normalized Mode (`%`)**: Plots 100% normalized proportions:
  $$\text{Status \%}_{s,i} = \frac{\text{Count}_{s,i}}{\text{Total}_i} \times 100$$
- **Tooltip**: Details counts, percentages, and total alerts.

#### 4.2.3 Alerts Treated by Monitoring Rule
- Dynamically calculates the **Top 5 rule families by volume** for the active period/filters, aggregating all remaining families into an **`Other`** series.
- **Tooltip**: Displays individual count and percentage share per rule family plus total alerts.

#### 4.2.4 Alerts by Responsible
- Stacked bar chart grouped by reviewer (`reviewedBy`):
  $$\text{Total}_r = \text{Eligible}_r + \text{Rejected}_r + \text{ReviewInProgress}_r$$
- **Colors**: Blue (`#5C9DFF`) for Eligible, Purple (`#8F75FF`) for Rejected, Amber (`#F59E0B`) for Review in Progress.
- **Tooltip**: Details counts and percentages for all 3 review statuses.

#### 4.2.5 Alerts by System
- Stacked bar chart grouped by monitored process system (`Gas System`, `Water Injection System`, `Utility System`, `Crude Oil System`, `Power Generation System`):
  $$\text{Total}_{\text{sys}} = \text{Eligible}_{\text{sys}} + \text{Rejected}_{\text{sys}} + \text{ReviewInProgress}_{\text{sys}} + \text{New}_{\text{sys}}$$
- **Colors**: Blue (`#5C9DFF`), Coral (`#F87171`), Amber (`#F59E0B`), Emerald (`#4ADE80`).
- **Tooltip**: Details counts and percentages for all 4 statuses plus total alerts per system.

---

## 5. Time Windows & Cross-Filter Intersections

### 5.1 Time Windows per Period Filter

| Period Filter | Bucket Count | Label Format | Start Time (`periodStart`) | End Time (`periodEnd`) |
| :--- | :--- | :--- | :--- | :--- |
| **Last Week** | 7 daily buckets | `DD/MM` | `00:00:00` 6 days ago | `23:59:59` Today |
| **Last Month** | 30 daily buckets | `DD/MM` | `00:00:00` 29 days ago | `23:59:59` Today |
| **Last 6 month** | 6 monthly buckets | `Jan`, `Feb`... | `00:00:00` 1st day 5 months ago | `23:59:59` End of current month |
| **1 Year** | 12 monthly buckets | `Jan`, `Feb`... | `00:00:00` 1st day 11 months ago | `23:59:59` End of current month |
| **All time** | 12 monthly buckets | `Jan`, `Feb`... | `00:00:00` First record (`1970`) | `23:59:59` Today |

### 5.2 Global Cross-Filter Intersections

$$\text{Filtered Alerts} = \text{FpsoFilter}(\text{alerts}) \cap \text{PeriodFilter}(\text{alerts}) \cap \text{AssetFilter}(\text{alerts}) \cap \text{CategoryFilter}(\text{alerts})$$

---

## 6. Production SQL Query Implementations

### 6.1 Query 1: KPI Summary Cards & Instance Breakdown

```sql
SELECT
  f.code AS fpso_code,
  e.code AS equipment_code,
  mr.name AS rule_name,
  COUNT(a.id) AS total_alerts,
  SUM(CASE WHEN a.status IN ('eligible_for_em', 'validated', 'rejected') THEN 1 ELSE 0 END) AS total_evaluations,
  SUM(CASE WHEN a.status IN ('eligible_for_em', 'validated') THEN 1 ELSE 0 END) AS correct_actions,
  SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS false_positives,
  ROUND(
    (SUM(CASE WHEN a.status IN ('eligible_for_em', 'validated') THEN 1 ELSE 0 END) * 100.0) /
    NULLIF(SUM(CASE WHEN a.status IN ('eligible_for_em', 'validated', 'rejected') THEN 1 ELSE 0 END), 0),
    1
  ) AS accuracy_percentage,
  ROUND(
    (SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) * 100.0) /
    NULLIF(SUM(CASE WHEN a.status IN ('eligible_for_em', 'validated', 'rejected') THEN 1 ELSE 0 END), 0),
    1
  ) AS fp_rate_percentage,
  ROUND(
    AVG(
      CASE
        WHEN a.status IN ('eligible_for_em', 'validated', 'rejected') AND a.reviewed_at IS NOT NULL
        THEN GREATEST(0, EXTRACT(EPOCH FROM (a.reviewed_at - a.triggered_at)) / 86400.0)
        ELSE NULL
      END
    )::numeric,
    2
  ) AS avg_days_to_treat
FROM alerts a
JOIN rule_instances ri ON a.instance_id = ri.id
JOIN equipment e ON ri.equipment_id = e.id
JOIN fpsos f ON e.fpso_id = f.id
JOIN monitoring_rules mr ON ri.rule_id = mr.id
WHERE a.triggered_at >= :periodStart
  AND a.triggered_at <= :periodEnd
GROUP BY f.code, e.code, mr.name;
```

### 6.2 Query 2: Cumulative Trend Line Charts

```sql
WITH bucket_aggregates AS (
  SELECT
    DATE_TRUNC(:bucketGranularity, a.triggered_at) AS bucket_date,
    SUM(CASE WHEN a.status IN ('eligible_for_em', 'validated', 'rejected') THEN 1 ELSE 0 END) AS bucket_evaluations,
    SUM(CASE WHEN a.status IN ('eligible_for_em', 'validated') THEN 1 ELSE 0 END) AS bucket_correct,
    SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS bucket_fp
  FROM alerts a
  JOIN rule_instances ri ON a.instance_id = ri.id
  JOIN equipment e ON ri.equipment_id = e.id
  JOIN fpsos f ON e.fpso_id = f.id
  JOIN monitoring_rules mr ON ri.rule_id = mr.id
  WHERE a.triggered_at >= :periodStart
    AND a.triggered_at <= :periodEnd
  GROUP BY DATE_TRUNC(:bucketGranularity, a.triggered_at)
)
SELECT
  bucket_date,
  SUM(bucket_correct) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_correct_count,
  SUM(bucket_fp) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_rejected_count,
  ROUND(
    (SUM(bucket_correct) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) * 100.0) /
    NULLIF(SUM(bucket_evaluations) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0),
    1
  ) AS cumulative_accuracy_pct,
  ROUND(
    (SUM(bucket_fp) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) * 100.0) /
    NULLIF(SUM(bucket_evaluations) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0),
    1
  ) AS cumulative_fp_rate_pct
FROM bucket_aggregates
ORDER BY bucket_date ASC;
```

---

## 7. Tooltip & Formula Reference Matrix

| Metric / Chart | Formula | Tooltip Description | Included Statuses |
| :--- | :--- | :--- | :--- |
| **Accuracy (KPI)** | `Eligible / (Eligible + Rejected) × 100` | Percentage of treated alerts confirmed as true positives relative to resolved alerts. | Eligible for Event Manager, Rejected |
| **False Positive Rate (KPI)** | `Rejected / (Eligible + Rejected) × 100` | Percentage of treated alerts discarded as false positives relative to resolved alerts. | Rejected, Eligible for Event Manager |
| **Avg. Time to Treat (KPI)** | `∑(ReviewedAt - TriggeredAt) / Total Treated` | Average lead time in days for an operator to resolve an alert. | Eligible for Event Manager, Rejected |
| **Accuracy Over Time** | `(Cum. Eligible / Cum. Total Treated) × 100` | Cumulative progression of accuracy across time intervals for active filters. | Eligible for Event Manager, Rejected |
| **False Positive Over Time** | `(Cum. Rejected / Cum. Total Treated) × 100` | Cumulative progression of the proportion of rejected alerts (noise) over time. | Rejected, Eligible for Event Manager |
| **Accuracy Breakdown** | `Eligible / Total Evaluations × 100` | Individual accuracy for each monitoring rule and asset instance in the filtered period. | Eligible for Event Manager, Rejected |
| **FP Breakdown** | `Rejected / Total Evaluations × 100` | Breakdown of discarded alerts (false positives) and noise rate per rule and asset. | Rejected, Eligible for Event Manager |
| **Bad Actors List** | `Rank by Total Volume (All Statuses)` | Ranking of rule instances with highest trigger frequency and noise. | Eligible for EM, Rejected, Review in Progress, New |
| **Days to Treat an Alert** | `∑(ReviewedAt - TriggeredAt) / Total Treated` | Average lead time in days per FPSO and weighted Fleet average from creation to resolution. | Eligible for Event Manager, Rejected |
| **Alerts Treated by Status** | `Count by Status or 100% Proportion` | Distribution of alerts across official lifecycle statuses for selected period. | Eligible for EM, Rejected, Review in Progress, New |
| **Alerts by Rule** | `∑(Treated Alerts) per Rule Family` | Total volume of treated alerts grouped by Top 5 monitoring rule families + Other. | Eligible for Event Manager, Rejected |
| **Alerts by Responsible** | `∑(Eligible + Rejected + In Progress) per Reviewer` | Volume of alerts assigned or treated per responsible reviewer across review statuses. | Eligible for EM, Rejected, Review in Progress |
| **Alerts by System** | `∑(All Alerts) per System` | Distribution of alerts across all lifecycle statuses grouped by monitored process system. | Eligible for EM, Rejected, Review in Progress, New |

---

## 8. Conclusion

The mathematical model rigorously guarantees:
1. **Denominators are never polluted** by unreviewed alerts (`New`, `Review in Progress`) for performance KPIs.
2. **Complementarity** is mathematically preserved: $\text{Accuracy} + \text{False Positive Rate} = 100\%$.
3. **Cumulative alignment**: The final point of the trend line charts matches the global top KPI card to the exact decimal.
4. **Tooltips** are 100% synchronized with the visual curves and bars.
