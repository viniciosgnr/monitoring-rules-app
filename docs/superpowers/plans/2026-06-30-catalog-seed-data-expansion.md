# Catalog Seed Data Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `db/seed.ts` to insert more equipment and rule instances for Spike and Surge rules (reaching 17 instances total), update audit log generation accordingly, and execute the seed script.

**Tech Stack:** TypeScript, Drizzle ORM, SQLite/PostgreSQL.

---

### Task 1: Modify db/seed.ts

**Files:**
- Modify: [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts)

- [ ] **Step 1: Expand equipment seed data**
  Open [seed.ts](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/db/seed.ts).
  Replace the equipment insertion values array to include 13 total records:
  - Compressors: COCE 0220, COCE 0221, COCE 0222, COCE 0223, COCE 0224
  - Pumps: 0420, 0421, 0422, 0423
  - Heat Exchangers: 0145, 0146
  - Turbines: 0312, 0313

- [ ] **Step 2: Expand instancesData mapping**
  Update the `instancesData` array to contain 17 instances, placing Spike (6) and Surge (7) rules across various equipments, while keeping the original 6 instances at indices `0` to `5` to maintain alerts compatibility.

- [ ] **Step 3: Update audit log distribution logic**
  - Change `equipmentDistribution` to divide `i % 17` instead of `i % 6`.
  - Update `isSpike` condition check to: `instIdx === 0 || (instIdx >= 6 && instIdx <= 10)`.
  - Update `isSurge` condition check to: `instIdx === 2 || instIdx === 3 || (instIdx >= 11 && instIdx <= 16)`.

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add db/seed.ts
  git commit -m "feat: expand seed.ts with additional rule instances of spike and surge rules"
  ```

---

### Task 2: Execute Seed Script

- [ ] **Step 1: Run seed**
  Run: `npx tsx db/seed.ts`
  Verify the script outputs `✅ Seed complete` successfully.

---

### Task 3: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`

- [ ] **Step 3: Manual Check**
  - Open the application, go to the MR Database page.
  - Verify that the catalog displays 17 instances.
  - Verify pagination and filters are fully functional with the expanded dataset.
