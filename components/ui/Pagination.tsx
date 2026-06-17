'use client';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export default function Pagination({
  total, page, pageSize, onPageChange, onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-end gap-3 px-4 py-3 text-xs text-text-muted border-t border-border-panel">
      <select
        value={pageSize}
        onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
        className="bg-bg-panel border border-border-panel rounded px-1.5 py-0.5 text-text-primary text-xs outline-none cursor-pointer"
      >
        {[5, 10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <span>{start}–{end} of {total}</span>
      <button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="disabled:opacity-30 hover:text-text-primary transition-colors"
      >
        <ChevronFirst size={14} />
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="disabled:opacity-30 hover:text-text-primary transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-text-primary font-medium min-w-[16px] text-center">{page}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="disabled:opacity-30 hover:text-text-primary transition-colors"
      >
        <ChevronRight size={14} />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        className="disabled:opacity-30 hover:text-text-primary transition-colors"
      >
        <ChevronLast size={14} />
      </button>
    </div>
  );
}
