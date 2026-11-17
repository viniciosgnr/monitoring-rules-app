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

export default function RuleAlertsChart({ data }: Props) {
  const [page, setPage] = useState(0);

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
        <p className="text-xs text-[#94A3B8] mb-5">
          Volume and share of treated alerts across all active rule groups ({totalGroups} groups)
        </p>

        <div className="space-y-3.5 min-h-[196px]">
          {paginatedItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] italic">
              No treated alerts found for the selected filters.
            </div>
          ) : (
            paginatedItems.map(item => {
              const barWidthPct = item.count > 0 ? Math.max(4, (item.count / maxCount) * 100) : 0;

              return (
                <div
                  key={item.group}
                  className="grid grid-cols-[minmax(130px,1.25fr)_2fr_minmax(88px,auto)] items-center gap-4 group"
                  title={`${item.group}: ${item.count} treated alerts (${item.eligible} Eligible for EM, ${item.rejected} Rejected)`}
                >
                  <span className="text-[13px] text-[#E2E8F0] truncate group-hover:text-white transition-colors">
                    {item.group}
                  </span>

                  <div className="h-2 w-full rounded-full bg-[#1E293B] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4F8EF7] transition-all duration-300"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>

                  <span className="text-[13px] text-[#E2E8F0] tabular-nums text-right whitespace-nowrap">
                    {item.count} ({item.percent.toFixed(1)}%)
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-[#1E293B] mt-5 pt-3 flex items-center justify-end gap-3 text-xs text-[#94A3B8] select-none">
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
