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
    <div className="flex items-center justify-end gap-3 px-4 py-3 text-xs text-[#94A3B8] border-t border-[#1E293B]">
      <select
        value={pageSize}
        onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
        className="bg-[#111827] border border-[#1E293B] rounded-lg px-2 py-1 text-white text-xs outline-none cursor-pointer hover:border-[#3B82F6] transition-colors"
      >
        {[5, 10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <span className="text-[#94A3B8]">{start}-{end} of {total}</span>
      <div className="flex items-center gap-1 text-[#94A3B8]">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          aria-label="First page"
          className="p-1 rounded hover:bg-[#1E293B] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ChevronFirst size={14} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="p-1 rounded hover:bg-[#1E293B] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-white font-medium min-w-[20px] text-center">{page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="p-1 rounded hover:bg-[#1E293B] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
          className="p-1 rounded hover:bg-[#1E293B] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ChevronLast size={14} />
        </button>
      </div>
    </div>
  );
}
