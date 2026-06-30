# Design Spec: Seeding More Spike and Surge Rule Instances

This spec covers expanding the seeded database records to populate more instances of Spike and Surge rules.

## 1. Additional Equipment Records
To support multiple rule instances, we will seed more equipment components of various types:
- **Compressors**: `UNY-775-COCE-0222`, `UNY-775-COCE-0223`, `UNY-775-COCE-0224`.
- **Pumps**: `MMA-100-PUM-0421`, `MMA-100-PUM-0422`, `MMA-100-PUM-0423`.
- **Heat Exchanger**: `PIO-310-HX-0146`.
- **Turbine**: `PIO-220-TRB-0313`.

## 2. Expanded Monitoring Rule Instances (17 Total)
We will increase the catalog size from 6 instances to 17 instances:
- **Spike instances (6)**: mapped across various Compressors and Turbines.
- **Surge instances (7)**: mapped across various Pumps and Compressors.
- **Trend, dP, and Drift instances (4)**: mapped to Turbines and Heat Exchangers.

## 3. Maintenance Window Compatibility
The disabled instances for testing deactivation dates remain at their original indices (index 0 for expired, index 2 for future) so they remain functional on startup.

## 4. Audit Log Round-Robin Distribution
The 42 historical change logs will be distributed across all 17 instances using `i % 17`. The logic to determine rule type (Spike/Surge) is updated to handle the new indices cleanly.
