# Analytics Guide & Mathematical Specification for Reliability Engineers

## Monitoring Rules Management Analytics Page

---

## 1. Executive Summary & Purpose

The **Analytics Module** in **Monitoring Rules Management** empowers Reliability, Surveillance, and Process Engineers to continuously evaluate monitoring rule effectiveness, minimize alarm fatigue, monitor fleet-wide lead times, and pinpoint "bad actor" assets or rules requiring parameter recalibration.

This guide provides reliability engineers with:
- The operational definition of the alert lifecycle.
- Descriptive mathematical formulations for all KPIs and visual components, naming every variable in full.
- The reliability engineering objective and practical interpretation for every metric.
- Clear instructions on how filters and time windows interact.

---

## 2. Alert Lifecycle & Evaluation Scope

In surveillance and predictive monitoring workflows, every triggered alert passes through an operational lifecycle. For reliability metrics, a clear boundary is established between **in-flight** alerts and **resolved** evaluations.

| UI Status Name | Operational Definition | Role in Reliability Analytics |
| :--- | :--- | :--- |
| **New** | Newly triggered alert awaiting initial surveillance triage. | Excluded from evaluation denominators (Accuracy / FP Rate). Included in total trigger volume, process system distribution, and bad actor rankings. |
| **Review in Progress** | Currently assigned to a surveillance engineer and under active technical investigation. | Excluded from final evaluation denominators. Included in review workload analysis (Alerts by Responsible) and system distributions. |
| **Eligible for Event Manager** | Validated as a genuine operational anomaly and escalated to Event Manager for corrective maintenance. | **True Positive**. Serves as the primary numerator for **Accuracy**, evaluation denominator, and lead time calculations. |
| **Rejected** | Reviewed and discarded by the engineer as nuisance alarm, sensor noise, or unactionable fluctuation. | **False Positive / Noise**. Serves as the primary numerator for **False Positive Rate**, evaluation denominator, and lead time calculations. |

> **Key Reliability Principle:**  
> Unreviewed alerts (`New`, `Review in Progress`) are **never** included in performance denominators. This prevents artificial dilution of accuracy when a high volume of alerts is awaiting review.

---

## 3. Global Reliability KPI Summary Cards

The top of the Analytics dashboard displays three global performance indicators reflecting the active cross-filter selection.

### 3.1 Accuracy (%)
- **Reliability Objective:** Measures surveillance precision — the percentage of treated alerts that represented actionable equipment degradation rather than false alarms.
- **Reliability Engineering Benchmark:** Target $> 80\%$. Lower values indicate excessive sensitivity or loose thresholds that require recalibration.
- **Mathematical Formula:**

$$\text{Accuracy \%} = \frac{\text{Eligible for Event Manager Alerts}}{\text{Total Evaluations (Eligible for Event Manager Alerts} + \text{Rejected Alerts)}} \times 100$$

---

### 3.2 False Positive Rate (%)
- **Reliability Objective:** Measures noise and operator workload burden. Quantifies the fraction of alerts dismissed without requiring maintenance action.
- **Reliability Engineering Benchmark:** Target $< 20\%$. High rates cause alarm fatigue and delay responses to genuine equipment failures.
- **Mathematical Complementarity:** $\text{Accuracy \%} + \text{False Positive Rate \%} = 100\%$.
- **Mathematical Formula:**

$$\text{False Positive Rate \%} = \frac{\text{Rejected Alerts}}{\text{Total Evaluations (Eligible for Event Manager Alerts} + \text{Rejected Alerts)}} \times 100$$

---

### 3.3 Average Time to Treat (Avg. Time to Treat)
- **Reliability Objective:** Quantifies operational responsiveness and surveillance latency — the average lead time in days elapsed from automated detection to operator resolution.
- **Reliability Engineering Benchmark:** Target $< 3.0\text{ days (72 hours)}$. Longer response times diminish the P-F interval advantage of predictive monitoring.
- **Mathematical Formula:**

$$\text{Avg. Time to Treat} = \frac{\sum(\text{Resolution Date} - \text{Trigger Date})\text{ in Days}}{\text{Total Treated Alerts (Eligible for Event Manager Alerts} + \text{Rejected Alerts)}}$$

---

## 4. Tab 1 — Overview & Trends

This tab provides high-level temporal trends, instance-level breakdowns, and worst-performing rule rankings.

### 4.1 Accuracy Over Time
- **Component Type:** Temporal Line Chart.
- **Reliability Objective:** Tracks whether surveillance precision is improving or degrading over time as rules are calibrated and operational regimes change.
- **Formulation:** Cumulative percentage progression from the beginning of the filtered period up to each time interval $i$:

$$\text{Cumulative Accuracy \%}(i) = \frac{\text{Cumulative Eligible for Event Manager Alerts}_i}{\text{Cumulative Total Evaluations (Eligible} + \text{Rejected)}_i} \times 100$$

- **Interactive Tooltip:** Displays the cumulative percentage alongside the isolated alert count of that specific month/bucket:
  `Accuracy : 80.1% (159 alerts)`
- **Operational Interpretation:** A downward slope indicates sensor drift, changed operating baselines, or uncalibrated rule instances.

---

### 4.2 False Positive Over Time
- **Component Type:** Temporal Line Chart.
- **Reliability Objective:** Tracks the evolution of surveillance noise and operator nuisance alarm rate over time.
- **Formulation:** Cumulative percentage progression from the beginning of the filtered period up to each time interval $i$:

$$\text{Cumulative False Positive Rate \%}(i) = \frac{\text{Cumulative Rejected Alerts}_i}{\text{Cumulative Total Evaluations (Eligible} + \text{Rejected)}_i} \times 100$$

- **Interactive Tooltip:** Displays the cumulative percentage alongside the isolated rejected alert count of that specific month/bucket:
  `False Positive Rate : 19.9% (27 alerts)`
- **Operational Interpretation:** Upward trends highlight growing signal degradation or changed process noise requiring threshold adjustments.

---

### 4.3 Accuracy Breakdown by Instance
- **Component Type:** Interactive Sortable Table.
- **Reliability Objective:** Pinpoints exact equipment tags and monitoring rule combinations delivering optimal vs. sub-optimal performance across FPSO units.
- **Mathematical Formulation:** For each instance (`FPSO ∩ Rule ∩ Asset`):

$$\text{Total Evaluations} = \text{Eligible for Event Manager Alerts} + \text{Rejected Alerts}$$

$$\text{Instance Accuracy \%} = \frac{\text{Eligible for Event Manager Alerts}}{\text{Total Evaluations}} \times 100$$

- **Operational Interpretation:** High-evaluation instances with low accuracy ($< 60\%$) identify immediate targets for threshold adjustment or suppression filtering.

---

### 4.4 False Positive Breakdown by Instance
- **Component Type:** Interactive Sortable Table.
- **Reliability Objective:** Identifies specific rule instances that generate the highest proportion of nuisance alarms.
- **Mathematical Formulation:** For each instance (`FPSO ∩ Rule ∩ Asset`):

$$\text{Instance False Positive Rate \%} = \frac{\text{Rejected Alerts}}{\text{Total Evaluations}} \times 100$$

---

### 4.5 Bad Actors List
- **Component Type:** Ranked Priority Table.
- **Reliability Objective:** Identifies the rule configurations generating the highest volume of alerts and noise across the fleet.
- **Ranking Formulation:**
  $$\text{Total Alerts Count} = \text{Eligible Alerts} + \text{Rejected Alerts} + \text{Review in Progress Alerts} + \text{New Alerts}$$
- **Operational Interpretation:** Following Pareto’s 80/20 rule, the top 5–10 bad actors typically account for $> 70\%$ of surveillance workload. Re-tuning these instances yields the highest reduction in operator fatigue.

---

## 5. Tab 2 — Alerts Treated

This tab analyzes operational throughput, lead times per vessel, rule family distribution, and team workload allocation.

### 5.1 Days to Treat an Alert (Average)
- **Component Type:** Composed Chart (Grouped Bars per FPSO + Weighted Fleet Line).
- **Reliability Objective:** Benchmarks response latency across different offshore units against the fleet-wide average.
- **Mathematical Formulation:**

$$\text{FPSO Average Days to Treat} = \frac{\sum(\text{Resolution Date} - \text{Trigger Date})\text{ in Days for FPSO}}{\text{Total Treated Alerts for FPSO}}$$

$$\text{Fleet Average Days to Treat} = \frac{\sum(\text{Resolution Date} - \text{Trigger Date})\text{ in Days across All Selected FPSOs}}{\text{Total Treated Alerts across All Selected FPSOs}}$$

- **Interactive Tooltip:** Displays lead time and absolute alert volume:
  - `ADG : 2.3 days (39 alerts)`
  - `Fleet Avg : 2.3 days (309 total)`
- **Operational Interpretation:** Identifies offshore facilities or teams facing surveillance backlogs or staffing bottlenecks.

---

### 5.2 Alerts Treated by Status
- **Component Type:** Stacked Bar Chart with Volume (`Vol`) vs. 100% Normalized Proportion (`%`) toggle.
- **Reliability Objective:** Visualizes the operational pipeline health across all four lifecycle statuses.
- **Mathematical Formulation:**

$$\text{Status Proportion \%} = \frac{\text{Alerts in Specific Status}}{\text{Total Alerts across All 4 Statuses (New} + \text{In Progress} + \text{Eligible} + \text{Rejected)}} \times 100$$

- **Operational Interpretation:** An expanding proportion of `New` alerts indicates an accumulating backlog; a growing `Rejected` segment signals increasing nuisance alarms.

---

### 5.3 Alerts Treated by Monitoring Rule
- **Component Type:** Scalable Stacked Bar Chart (Dynamic Top 5 Rule Families + `Other`).
- **Reliability Objective:** Analyzes failure mode recurrence by monitoring rule family (e.g., Spike, Surge, Drift, Trend, Normalized dP).
- **Scalability Engine:**
  To support 30+ rule families without visual clutter:
  1. The top 5 categories by alert volume within the active window are allocated distinct primary series.
  2. All remaining rule categories are dynamically aggregated into an **`Other`** slice.
- **Mathematical Formulation:**

$$\text{Rule Family Treated Alerts} = \text{Eligible for Event Manager Alerts} + \text{Rejected Alerts}$$

- **Operational Interpretation:** Highlights prevailing process dynamics — e.g., high `Spike` volume may indicate instrumentation electrical noise, whereas high `Normalized dP` points to filter/heat exchanger fouling.

---

### 5.4 Alerts by Responsible
- **Component Type:** Stacked Bar Chart grouped by surveillance engineer (`reviewedBy`).
- **Reliability Objective:** Monitors workforce distribution and triage efficiency across review stages.
- **Mathematical Formulation:** For each engineer:

$$\text{Total Assigned Alerts} = \text{Eligible for Event Manager Alerts} + \text{Rejected Alerts} + \text{Review in Progress Alerts}$$

- **Operational Interpretation:** Balances surveillance workload across the team and verifies individual review consistency.

---

### 5.5 Alerts by System
- **Component Type:** Stacked Bar Chart grouped by monitored process system (`Gas System`, `Water Injection System`, `Utility System`, `Crude Oil System`, `Power Generation System`).
- **Reliability Objective:** Identifies process plant sections experiencing high recurrence of alerts across all 4 lifecycle statuses.
- **Mathematical Formulation:** For each system:

$$\text{Total System Alerts} = \text{Eligible Alerts} + \text{Rejected Alerts} + \text{Review in Progress Alerts} + \text{New Alerts}$$

- **Operational Interpretation:** Directs reliability capital and root-cause analysis (RCA) toward the process systems with highest instability.

---

## 6. Global Cross-Filter Operations

Every visual component on the Analytics page strictly respects the global filter bar:

$$\text{Active Dataset} = \text{FPSO Filter} \cap \text{Period Filter} \cap \text{Asset Filter} \cap \text{Category Filter}$$

1. **FPSO Filter:** Multi-select filtering across asset units (`ADG`, `ATD`, `CDI`, `SEP`, `UNY`).
2. **Period Filter:** Dynamic boundary calculator (`Last Week`: 7 days; `Last Month`: 30 days; `Last 6 month`: 6 months; `1 Year`: 12 months; `All time`).
3. **Asset Filter:** Multi-select filtering by equipment tag.
4. **Category Filter:** Multi-select filtering by rule family.

---

## 7. Reliability Engineering Reference Matrix

| Metric / Component | Descriptive Formula | Tooltip Description | Target Benchmark |
| :--- | :--- | :--- | :--- |
| **Accuracy (KPI)** | $\frac{\text{Eligible Alerts}}{\text{Eligible Alerts} + \text{Rejected Alerts}} \times 100$ | Percentage of treated alerts confirmed as true positives. | $> 80\%$ |
| **False Positive Rate (KPI)** | $\frac{\text{Rejected Alerts}}{\text{Eligible Alerts} + \text{Rejected Alerts}} \times 100$ | Percentage of treated alerts dismissed as noise. | $< 20\%$ |
| **Avg. Time to Treat (KPI)** | $\frac{\sum(\text{Resolution Date} - \text{Trigger Date})\text{ in Days}}{\text{Total Treated Alerts}}$ | Average lead time in days for operator resolution. | $< 3.0\text{ days (72h)}$ |
| **Accuracy Over Time** | $\frac{\text{Cumulative Eligible Alerts}}{\text{Cumulative Total Evaluations}} \times 100$ | Cumulative accuracy % + isolated monthly count. | Upward / Stable |
| **False Positive Over Time** | $\frac{\text{Cumulative Rejected Alerts}}{\text{Cumulative Total Evaluations}} \times 100$ | Cumulative FP rate % + isolated monthly count. | Downward $< 20\%$ |
| **Accuracy Breakdown** | $\frac{\text{Eligible Alerts}}{\text{Total Evaluations}} \times 100$ | Accuracy % per rule and equipment instance. | $> 80\%$ |
| **FP Breakdown** | $\frac{\text{Rejected Alerts}}{\text{Total Evaluations}} \times 100$ | Noise rate % per rule and equipment instance. | $< 20\%$ |
| **Bad Actors List** | Sort by Total Volume Descending | Ranking of rule instances by alert volume and noise. | Prioritize Top 5 |
| **Days to Treat an Alert** | $\frac{\sum(\text{Resolution Date} - \text{Trigger Date})\text{ in Days}}{\text{Treated Alerts per FPSO}}$ | Average lead time in days per FPSO and Fleet average. | Fleet Avg $< 3.0\text{d}$ |
| **Alerts Treated by Status** | Absolute Volume or Normalized Share % | Counts and percentages for all 4 statuses + Total. | Low New Backlog |
| **Alerts by Rule** | Top 5 Rule Families + Other | Volume per rule family + Total Alerts. | Failure Modes |
| **Alerts by Responsible** | $\sum(\text{Eligible} + \text{Rejected} + \text{Review in Progress})$ | Volume and % for 3 review statuses per engineer. | Balanced Load |
| **Alerts by System** | $\sum(\text{All 4 Lifecycle Statuses})$ | Volume and % for 4 statuses per process system. | System Stability |

---

## 8. Summary for Surveillance Engineers

- **High Accuracy ($> 80\%$) + Low FP Rate ($< 20\%$):** Healthy, high-confidence monitoring configuration.
- **Low Accuracy ($< 60\%$):** Priority candidate for threshold tuning, persistence adjustment, or signal de-noising.
- **Long Time to Treat ($> 3.0\text{ days / 72h}$):** Surveillance bottleneck requiring workflow balancing or alert suppression.
- **Bad Actors Table:** The quickest starting point for monthly surveillance review meetings.
