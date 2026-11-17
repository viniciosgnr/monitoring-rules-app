'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ResponsibleAlertPoint {
  responsible: string;
  eligible: number;
  rejected: number;
  reviewInProgress: number;
  total: number;
}

interface Props {
  data: ResponsibleAlertPoint[];
}

// Standardized Semantic Status Palette:
// Eligible for Event Manager: #22C55E (Green)
// Rejected: #EF4444 (Red)
// Review in Progress: #F59E0B (Amber/Orange)
const ELIGIBLE_COLOR = '#22C55E';
const REJECTED_COLOR = '#EF4444';
const REVIEW_IN_PROGRESS_COLOR = '#F59E0B';

export default function AlertsPerResponsibleChart({ data }: Props) {
  const totals = (data || []).map(d => d.total).filter(v => typeof v === 'number' && !isNaN(v));
  const maxVal = totals.length > 0 ? Math.max(...totals) : 10;
  const yMax = Math.max(10, Math.ceil((maxVal * 1.15) / 5) * 5);

  return (
    <div>
      {/* Official SLB Optisite Left-Aligned Legend */}
      <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mb-4 select-none">
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0"
            style={{ backgroundColor: ELIGIBLE_COLOR }}
          />
          <span className="text-xs text-[#CBD5E1]">
            Eligible for Event Manager
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0"
            style={{ backgroundColor: REJECTED_COLOR }}
          />
          <span className="text-xs text-[#CBD5E1]">
            Rejected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0"
            style={{ backgroundColor: REVIEW_IN_PROGRESS_COLOR }}
          />
          <span className="text-xs text-[#CBD5E1]">
            Review in Progress
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 15, left: -15, bottom: 10 }}
        >
          <XAxis
            dataKey="responsible"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, yMax]}
          />
          <Tooltip
            cursor={{ fill: '#1E293B', opacity: 0.25 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0]?.payload as ResponsibleAlertPoint | undefined;
              if (!point) return null;

              const total = point.total || 0;
              const eligPct = total > 0 ? ((point.eligible / total) * 100).toFixed(1) : '0.0';
              const rejPct = total > 0 ? ((point.rejected / total) * 100).toFixed(1) : '0.0';
              const revPct = total > 0 ? ((point.reviewInProgress / total) * 100).toFixed(1) : '0.0';

              return (
                <div className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] shadow-lg space-y-1.5">
                  <div className="font-semibold text-white pb-1 border-b border-[#1E293B]">
                    {label}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] inline-block"
                        style={{ backgroundColor: ELIGIBLE_COLOR }}
                      />
                      Eligible for Event Manager :
                    </span>
                    <span className="font-mono text-white">
                      {point.eligible} alerts ({eligPct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] inline-block"
                        style={{ backgroundColor: REJECTED_COLOR }}
                      />
                      Rejected :
                    </span>
                    <span className="font-mono text-white">
                      {point.rejected} alerts ({rejPct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] inline-block"
                        style={{ backgroundColor: REVIEW_IN_PROGRESS_COLOR }}
                      />
                      Review in Progress :
                    </span>
                    <span className="font-mono text-white">
                      {point.reviewInProgress} alerts ({revPct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#1E293B]/80 text-[#94A3B8]">
                    <span>Total Alerts :</span>
                    <span className="font-mono font-semibold text-white">
                      {total} alerts
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="eligible"
            name="Eligible for Event Manager"
            stackId="responsible"
            fill={ELIGIBLE_COLOR}
            radius={[0, 0, 0, 0]}
            barSize={24}
          />
          <Bar
            dataKey="rejected"
            name="Rejected"
            stackId="responsible"
            fill={REJECTED_COLOR}
            radius={[0, 0, 0, 0]}
            barSize={24}
          />
          <Bar
            dataKey="reviewInProgress"
            name="Review in Progress"
            stackId="responsible"
            fill={REVIEW_IN_PROGRESS_COLOR}
            radius={[0, 0, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
