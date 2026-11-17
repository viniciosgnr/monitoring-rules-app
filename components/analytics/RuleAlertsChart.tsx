'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface RuleGroupAlertItem {
  group: string;
  count: number;
  eligible: number;
  rejected: number;
  percent: number;
}

interface Props {
  data: RuleGroupAlertItem[];
}

const PAGE_SIZE = 7;

const ELIGIBLE_COLOR = '#22C55E'; // Green
const REJECTED_COLOR = '#EF4444'; // Red

export default function RuleAlertsChart({ data }: Props) {
  const [page, setPage] = useState(0);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const totalGroups = data.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / PAGE_SIZE));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [totalGroups, totalPages, page]);

  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count), 1) : 1;
  const paginatedItems = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const startIdx = totalGroups === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIdx = Math.min(totalGroups, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <p className="text-xs text-[#94A3B8] mb-3">
          Volume and share of treated alerts across all active rule groups ({totalGroups} groups)
        </p>

        {/* Official SLB Optisite Left-Aligned Legend */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mb-4 select-none">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0"
              style={{ backgroundColor: ELIGIBLE_COLOR }}
            />
            <span className="text-xs text-[#CBD5E1]">Eligible for Event Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0"
              style={{ backgroundColor: REJECTED_COLOR }}
            />
            <span className="text-xs text-[#CBD5E1]">Rejected</span>
          </div>
        </div>

        <div className="space-y-3.5 min-h-[180px]">
          {paginatedItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] italic">
              No treated alerts found for the selected filters.
            </div>
          ) : (
            paginatedItems.map(item => {
              const eligibleWidthPct = item.count > 0 ? (item.eligible / maxCount) * 100 : 0;
              const rejectedWidthPct = item.count > 0 ? (item.rejected / maxCount) * 100 : 0;
              const eligPct = item.count > 0 ? ((item.eligible / item.count) * 100).toFixed(1) : '0.0';
              const rejPct = item.count > 0 ? ((item.rejected / item.count) * 100).toFixed(1) : '0.0';
              const isHovered = hoveredGroup === item.group;

              return (
                <div
                  key={item.group}
                  onMouseEnter={() => setHoveredGroup(item.group)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  className="relative grid grid-cols-[minmax(130px,1.25fr)_2fr_minmax(88px,auto)] items-center gap-4 group py-0.5 rounded-md hover:bg-[#1E293B]/30 px-1.5 -mx-1.5 transition-colors cursor-default"
                >
                  <span className="text-[13px] text-[#E2E8F0] truncate group-hover:text-white transition-colors">
                    {item.group}
                  </span>

                  <div className="h-2.5 w-full rounded-full bg-[#1E293B] overflow-hidden flex">
                    {item.eligible > 0 && (
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${eligibleWidthPct}%`,
                          backgroundColor: ELIGIBLE_COLOR,
                        }}
                      />
                    )}
                    {item.rejected > 0 && (
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${rejectedWidthPct}%`,
                          backgroundColor: REJECTED_COLOR,
                        }}
                      />
                    )}
                  </div>

                  <span className="text-[13px] text-[#E2E8F0] tabular-nums text-right whitespace-nowrap font-mono">
                    {item.count} ({item.percent.toFixed(1)}%)
                  </span>

                  {/* Standardized Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] shadow-xl space-y-1.5 min-w-[250px] pointer-events-none">
                      <div className="font-semibold text-white pb-1 border-b border-[#1E293B]">
                        {item.group}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <span
                            className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                            style={{ backgroundColor: ELIGIBLE_COLOR }}
                          />
                          Eligible for Event Manager :
                        </span>
                        <span className="font-mono text-white">
                          {item.eligible} alerts ({eligPct}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <span
                            className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                            style={{ backgroundColor: REJECTED_COLOR }}
                          />
                          Rejected :
                        </span>
                        <span className="font-mono text-white">
                          {item.rejected} alerts ({rejPct}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#1E293B]/80 text-[#94A3B8]">
                        <span>Total Alerts :</span>
                        <span className="font-mono font-semibold text-white">
                          {item.count} alerts
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-[#1E293B] mt-4 pt-3 flex items-center justify-end gap-3 text-xs text-[#94A3B8] select-none">
        <span>
          {startIdx}–{endIdx} of {totalGroups} groups
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="p-0.5 text-[#94A3B8] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            className="p-0.5 text-[#94A3B8] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
