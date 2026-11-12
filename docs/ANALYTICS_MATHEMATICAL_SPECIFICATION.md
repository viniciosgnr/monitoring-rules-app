# Technical Specification: Analytics Mathematical Model, Filters & SQL Queries

This document provides the complete technical specification for the calculation engine powering the **Analytics** page in the **Monitoring Rules Management (SLB Optisite)** application. It details the official status lifecycle (`New`, `Review in Progress`, `Eligible for Event Manager`, `Rejected`), mathematical formulas for all KPI cards and charts across both tabs (**Overview & Trends** and **Alerts Treated**), the cumulative time-series strategy, global filter intersections, and production-ready SQL query implementations.

---

## 1. Overview & Calculation Architecture

The **Analytics** page is organized into global controls, top-level KPI summary cards, and two specialized analytical tabs:

1. **Global KPI Summary Cards**:
   - **Accuracy (%)**
   - **False Positive Rate (%)**
   - **Avg. Time to Treat (days)**
2. **Tab 1 — Overview & Trends**:
   - **Trend Line Charts**: *Accuracy Over Time* and *False Positive Over Time* (displaying the cumulative percentage alongside the isolated absolute alert count of that bucket on hover).
   - **Breakdown Tables**: *Accuracy Breakdown by Instance* and *False Positive Breakdown by Instance*.
   - **Reviewer Performance Chart**: *Alerts per Responsible* (stacked bar chart displaying `Eligible for Event Manager` and `Rejected` alert counts and percentage shares per reviewer).
3. **Tab 2 — Alerts Treated**:
   - **Lead Time Composed Chart**: *Days to Treat an Alert (Average)* (grouped vertical bars per FPSO unit overlaid with the weighted *Fleet* average trend line).
   - **Distribution Charts**: *Alerts Treated by Status* (with Volume vs. 100% Normalized Percentage toggle) and *Alerts Treated by Monitoring Rule* (stacked by rule category).
   - **Ranking Table**: *Bad Actors List* (top 30 rule instances ranked by total alert volume).

### 1.1 Official Alert Status Lifecycle & Mapping

| UI Status Name | Database `status` Value | Lifecycle Role in Analytics |
| :--- | :--- | :--- |
| **New** | `'new'` | Pending initial review (excluded from evaluation denominators; included in volume/status distributions). |
| **Review in Progress** | `'review_in_progress'` | Currently under operator investigation (excluded from evaluation denominators; included in status distributions). |
| **Eligible for Event Manager** | `'eligible_for_em'` | Confirmed true positive operational alert (numerator for *Accuracy*; included in *Total Evaluations* and *Time to Treat*). |
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

### 3.1 The Problem with Single-Day Sampling

Previously, each point $i$ on the chart calculated percentages strictly within that isolated day or month. This introduced two major issues:

1. **Chaotic Spikes**: Days with low alert volume (e.g., 2 alerts) created artificial 0% or 100% spikes, cluttering the chart.
2. **KPI Disconnection**: The last point on the chart reflected only the final day (e.g., 79.3%), whereas the top KPI Card reflected the entire period (79.6%).

### 3.2 The Cumulative Solution & Point-Specific Absolute Tooltip Counts

In the cumulative model, for each bucket $i$ in the time-series (from bucket $0$ to bucket $N-1$), the percentage curve aggregates resolved alerts occurring **from the start of the selected period (`periodStart`) up to the end boundary of that bucket (`bucket_i.end`)**, while the tooltip surfaces the **isolated absolute count** of that specific bucket (`[bucket_i.start, bucket_i.end]`):

- **Bucket $i$ Cumulative Window**: $[\text{periodStart} \rightarrow \text{bucket\_i.end}]$
- **Cumulative Eligible Count ($\text{CumEligible}_i$)**: Count of `Eligible for Event Manager` alerts in $[\text{periodStart}, \text{bucket\_i.end}]$.
- **Cumulative Rejected Count ($\text{CumRejected}_i$)**: Count of `Rejected` alerts in $[\text{periodStart}, \text{bucket\_i.end}]$.
- **Point-Specific Absolute Counts ($\text{Eligible}_i$, $\text{Rejected}_i$)**: Count of `Eligible for Event Manager` and `Rejected` alerts strictly within bucket $i$ ($[\text{bucket\_i.start}, \text{bucket\_i.end}]$).

$$\text{Accuracy}(i) = \frac{\text{CumEligible}_i}{\text{CumEligible}_i + \text{CumRejected}_i} \times 100$$

$$\text{False Positive \%}(i) = \frac{\text{CumRejected}_i}{\text{CumEligible}_i + \text{CumRejected}_i} \times 100$$

- **Interactive Tooltip Format**: Hovering over bucket $i$ displays the cumulative percentage and the point-specific absolute alert count of bucket $i$:
  - *Accuracy Over Time*: `Accuracy : {Accuracy(i)}% ({Eligible_i} alerts)`
  - *False Positive Over Time*: `False Positive Rate : {False Positive %(i)}% ({Rejected_i} alerts)`

---

## 4. Tab-Specific Chart Mathematical Definitions

### 4.1 Alerts per Responsible (Overview & Trends Tab)

Displays a stacked vertical bar chart of treated alerts grouped by the responsible reviewer (`reviewedBy` normalized to `"Last Name, First Name"` format in alphabetical order):

- **Eligible Segment (Base)**: $\text{Eligible}_r = \text{Count}(\text{alerts reviewed by } r \text{ with status } = \text{'eligible\_for\_em'})$
- **Rejected Segment (Top)**: $\text{Rejected}_r = \text{Count}(\text{alerts reviewed by } r \text{ with status } = \text{'rejected'})$
- **Total Treated by Reviewer $r$**: $\text{Total}_r = \text{Eligible}_r + \text{Rejected}_r$
- **Tooltip Share Percentages**:
  $$\text{Eligible Share}_r = \frac{\text{Eligible}_r}{\text{Total}_r} \times 100, \quad \text{Rejected Share}_r = \frac{\text{Rejected}_r}{\text{Total}_r} \times 100$$

### 4.2 Days to Treat an Alert — Per FPSO & Fleet Average (Alerts Treated Tab)

For each time bucket $i$ ($\text{bucket\_i.start}$ to $\text{bucket\_i.end}$), this Composed Chart plots grouped vertical bars for each active FPSO $u$ alongside an overlaid **Fleet** line:

- **Per-FPSO Bar ($\text{Days}_{u,i}$)**:
  $$\text{Days}_{u,i} = \frac{1}{|T_{u,i}|} \sum_{a \in T_{u,i}} \max\left(0, \frac{a.\text{reviewedAt} - a.\text{triggeredAt}}{86,400,000\text{ ms}}\right)$$
  where $T_{u,i}$ is the set of treated alerts (`Eligible for Event Manager` or `Rejected`) for FPSO $u$ in bucket $i$.
- **Fleet Average Line ($\text{Fleet}_i$)**: Weighted average across all treated alerts $T_i = \bigcup_{u} T_{u,i}$ of the selected FPSOs in bucket $i$:
  $$\text{Fleet}_i = \frac{1}{|T_i|} \sum_{a \in T_i} \max\left(0, \frac{a.\text{reviewedAt} - a.\text{triggeredAt}}{86,400,000\text{ ms}}\right)$$

### 4.3 Alerts Treated by Status & Monitoring Rule (Alerts Treated Tab)

For each isolated time bucket $i$ ($[\text{bucket\_i.start}, \text{bucket\_i.end}]$):

1. **Alerts Treated by Status**:
   - **Volume Mode (`Vol`)**: Plots raw counts of `New`, `Review in Progress`, `Eligible for Event Manager`, and `Rejected` in bucket $i$.
   - **Normalized Mode (`%`)**: Plots the 100% normalized proportion of each status $s$ in bucket $i$:
     $$\text{Status \%}_{s,i} = \frac{\text{Count}_{s,i}}{\text{New}_i + \text{ReviewInProgress}_i + \text{Eligible}_i + \text{Rejected}_i} \times 100$$
2. **Alerts Treated by Monitoring Rule**:
   - Stacked bar chart partitioning bucket $i$ alerts across the 5 rule categories: `Drift`, `Spike`, `Normalized dP`, `Surge`, and `Trend`.

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

The four global selectors at the top of the Analytics page operate conjunctively (logical **AND**):

$$\text{Filtered Alerts} = \text{FpsoFilter}(\text{alerts}) \cap \text{PeriodFilter}(\text{alerts}) \cap \text{AssetFilter}(\text{alerts}) \cap \text{CategoryFilter}(\text{alerts})$$

1. **FPSO Filter (`All FPSOs`)**: Multi-select filter restricting alerts to selected FPSO units (`ADG`, `ATD`, `CDI`, `SEP`, `UNY`).
2. **Period Filter (`Period`)**: Restricts the timestamp range (`triggeredAt` between `periodStart` and `periodEnd`).
3. **Asset Filter (`All Assets`)**: Multi-select filter restricting rules associated with specific equipment codes (e.g., `UNY-775-COCE-0220`).
4. **Category Filter (`All Categories`)**: Multi-select filter restricting rule categories (`Drift`, `Spike`, `Surge`, `Trend`, `Normalized dP`).

---

## 6. Production SQL Query Implementations

### 6.1 Query 1: KPI Summary Cards & Breakdown Tables by Instance

```sql
-- Query 1: KPI Cards & Breakdown Tables by Instance
SELECT
  f.code AS fpso_code,
  e.code AS equipment_code,
  mr.name AS rule_name,
  COUNT(a.id) AS total_alerts,
  SUM(CASE WHEN a.status IN ('eligible_for_em', 'rejected') THEN 1 ELSE 0 END) AS total_evaluations,
  SUM(CASE WHEN a.status = 'eligible_for_em' THEN 1 ELSE 0 END) AS correct_actions,
  SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS false_positives,
  ROUND(
    (SUM(CASE WHEN a.status = 'eligible_for_em' THEN 1 ELSE 0 END) * 100.0) /
    NULLIF(SUM(CASE WHEN a.status IN ('eligible_for_em', 'rejected') THEN 1 ELSE 0 END), 0),
    1
  ) AS accuracy_percentage,
  ROUND(
    (SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) * 100.0) /
    NULLIF(SUM(CASE WHEN a.status IN ('eligible_for_em', 'rejected') THEN 1 ELSE 0 END), 0),
    1
  ) AS fp_rate_percentage,
  ROUND(
    AVG(
      CASE
        WHEN a.status IN ('eligible_for_em', 'rejected') AND a.reviewed_at IS NOT NULL
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

### 6.2 Query 2: Cumulative Trend Line Charts with Point-Specific Absolute Counts

```sql
-- Query 2: Cumulative Query for Accuracy & False Positive Over Time Line Charts
WITH bucket_aggregates AS (
  SELECT
    DATE_TRUNC(:bucketGranularity, a.triggered_at) AS bucket_date,
    SUM(CASE WHEN a.status IN ('eligible_for_em', 'rejected') THEN 1 ELSE 0 END) AS bucket_evaluations,
    SUM(CASE WHEN a.status = 'eligible_for_em' THEN 1 ELSE 0 END) AS bucket_correct,
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
  -- Point-specific absolute counts for that bucket (displayed in chart tooltips)
  bucket_correct AS point_eligible_count,
  bucket_fp AS point_rejected_count,
  -- Cumulative Accuracy %
  ROUND(
    (SUM(bucket_correct) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) * 100.0) /
    NULLIF(SUM(bucket_evaluations) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0),
    1
  ) AS cumulative_accuracy_pct,
  -- Cumulative False Positive Rate %
  ROUND(
    (SUM(bucket_fp) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) * 100.0) /
    NULLIF(SUM(bucket_evaluations) OVER (ORDER BY bucket_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0),
    1
  ) AS cumulative_fp_rate_pct
FROM bucket_aggregates
ORDER BY bucket_date ASC;
```

### 6.3 Query 3: Alerts per Responsible (Stacked Bar Chart)

```sql
-- Query 3: Alerts per Responsible (Eligible for Event Manager & Rejected)
SELECT
  a.reviewed_by AS responsible_reviewer,
  SUM(CASE WHEN a.status = 'eligible_for_em' THEN 1 ELSE 0 END) AS eligible_count,
  SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
  COUNT(a.id) AS total_treated,
  ROUND(
    (SUM(CASE WHEN a.status = 'eligible_for_em' THEN 1 ELSE 0 END) * 100.0) /
    NULLIF(COUNT(a.id), 0),
    1
  ) AS eligible_share_pct,
  ROUND(
    (SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) * 100.0) /
    NULLIF(COUNT(a.id), 0),
    1
  ) AS rejected_share_pct
FROM alerts a
JOIN rule_instances ri ON a.instance_id = ri.id
JOIN equipment e ON ri.equipment_id = e.id
JOIN fpsos f ON e.fpso_id = f.id
JOIN monitoring_rules mr ON ri.rule_id = mr.id
WHERE a.triggered_at >= :periodStart
  AND a.triggered_at <= :periodEnd
  AND a.status IN ('eligible_for_em', 'rejected')
  AND a.reviewed_by IS NOT NULL
GROUP BY a.reviewed_by
ORDER BY a.reviewed_by ASC;
```

### 6.4 Query 4: Days to Treat an Alert per FPSO & Fleet Average

```sql
-- Query 4: Days to Treat an Alert (Per FPSO Bars & Weighted Fleet Average Line)
SELECT
  DATE_TRUNC(:bucketGranularity, a.triggered_at) AS bucket_date,
  f.code AS fpso_code,
  ROUND(
    AVG(GREATEST(0, EXTRACT(EPOCH FROM (a.reviewed_at - a.triggered_at)) / 86400.0))::numeric,
    1
  ) AS fpso_avg_days,
  ROUND(
    (SUM(GREATEST(0, EXTRACT(EPOCH FROM (a.reviewed_at - a.triggered_at)) / 86400.0)) OVER (
      PARTITION BY DATE_TRUNC(:bucketGranularity, a.triggered_at)
    ) /
    NULLIF(COUNT(a.id) OVER (PARTITION BY DATE_TRUNC(:bucketGranularity, a.triggered_at)), 0))::numeric,
    1
  ) AS fleet_weighted_avg_days
FROM alerts a
JOIN rule_instances ri ON a.instance_id = ri.id
JOIN equipment e ON ri.equipment_id = e.id
JOIN fpsos f ON e.fpso_id = f.id
WHERE a.triggered_at >= :periodStart
  AND a.triggered_at <= :periodEnd
  AND a.status IN ('eligible_for_em', 'rejected')
  AND a.reviewed_at IS NOT NULL
GROUP BY DATE_TRUNC(:bucketGranularity, a.triggered_at), f.code, a.reviewed_at, a.triggered_at, a.id;
```

---

## 7. Conclusion

1. **Mathematical & Status Alignment**: Restricting `Total Evaluations` to resolved alerts (`Eligible for Event Manager + Rejected`) guarantees that `Accuracy % + False Positive % = 100%`, while `New` and `Review in Progress` alerts are accurately represented in status volume and normalized distribution charts.
2. **Data Integrity Across Tabs**: The cumulative model in **Overview & Trends** aligns line chart endpoints to the exact decimal of the top KPI cards while surfacing the isolated bucket absolute counts on hover, and isolated bucket aggregations in **Alerts Treated** provide exact operational throughput per FPSO, status, rule category, and responsible engineer.
