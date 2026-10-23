'use client';
import React from 'react';
import InfoTooltip from './InfoTooltip';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
  formula?: string;
  statusList?: string[];
}

export default function KpiCard({
  title,
  value,
  subtitle,
  tooltip,
  formula,
  statusList,
}: KpiCardProps) {
  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 flex-1 min-w-[180px] shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-[#94A3B8] font-normal tracking-wide">{title}</p>
          {(tooltip || formula) && (
            <InfoTooltip
              title={title}
              formula={formula}
              description={tooltip || ''}
              statusList={statusList}
              align="left"
            />
          )}
        </div>
        {subtitle && <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>}
      </div>
      <p className="text-2xl font-medium text-white mt-3">{value}</p>
    </div>
  );
}
