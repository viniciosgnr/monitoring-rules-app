# Analytics Page Sub-tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement sub-tabs on the Analytics page ("Overview & Trends" and "Bad Actors & Rule Audit") to divide the dashboard layout, making it clean, readable, and highly professional.

---

### Task 1: Modify components/analytics/AnalyticsClient.tsx

**Files:**
- Modify: [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx)

- [ ] **Step 1: Add a state for active sub-tab**
  Open [AnalyticsClient.tsx](file:///home/marcosgnr/Monitoring%20Rules%20Management/monitoring-rules-app/components/analytics/AnalyticsClient.tsx).
  Define the active sub-tab state:
  ```typescript
  const [activeTab, setActiveTab] = useState<'overview' | 'bad_actors'>('overview');
  ```

- [ ] **Step 2: Render the sub-tab navigation buttons**
  Add a stylized sub-tab bar at the top of the main container:
  ```typescript
  <div className="flex border-b border-border-panel mb-6">
    <button
      onClick={() => setActiveTab('overview')}
      className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
        activeTab === 'overview'
          ? 'border-accent text-accent bg-bg-panel/20'
          : 'border-transparent text-text-muted hover:text-text-main'
      }`}
    >
      Overview & Trends
    </button>
    <button
      onClick={() => setActiveTab('bad_actors')}
      className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
        activeTab === 'bad_actors'
          ? 'border-accent text-accent bg-bg-panel/20'
          : 'border-transparent text-text-muted hover:text-text-main'
      }`}
    >
      Bad Actors & Rule Audit
    </button>
  </div>
  ```

- [ ] **Step 3: Condition component rendering**
  - If `activeTab === 'overview'`: render Global Filters, KPI Cards, and the Charts Grid.
  - If `activeTab === 'bad_actors'`: render the Top 10 Bad Actors Ranking Table.

---

### Task 2: Verify and Build

- [ ] **Step 1: Check Linter**
  Run: `npm run lint`

- [ ] **Step 2: Check Build**
  Run: `npm run build`
