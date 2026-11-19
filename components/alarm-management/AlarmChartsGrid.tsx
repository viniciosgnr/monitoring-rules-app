'use client';
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import InfoTooltip from '@/components/ui/InfoTooltip';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface StackedBarSeries {
  key: string;
  label: string;
  color: string;
}

export interface StackedBarPoint {
  category: string;
  total: number;
  [seriesKey: string]: number | string;
}

export type LeftChartConfig =
  | {
      kind: 'donut';
      title: string;
      subtitle: string;
      formula: string;
      data: DonutSlice[];
    }
  | {
      kind: 'bar';
      title: string;
      subtitle: string;
      formula: string;
      data: StackedBarPoint[];
      series: StackedBarSeries[];
    };

export interface BarChartConfig {
  kind: 'bar';
  title: string;
  subtitle: string;
  formula: string;
  data: StackedBarPoint[];
  series: StackedBarSeries[];
}

interface AlarmChartsGridProps {
  leftChart: LeftChartConfig;
  rightChart: BarChartConfig;
  totalValue: number;
  unitLabel?: string;
}

const RADIAN = Math.PI / 180;

interface DonutLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  payload?: DonutSlice;
}

function renderOptisiteDonutLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius = 82,
  percent = 0,
  payload,
}: DonutLabelProps) {
  const pctValue = percent * 100;
  if (pctValue <= 0) return null;

  const pctStr = `${pctValue.toFixed(2)}%`;
  const radius = outerRadius + 22;
  const cos = Math.cos(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const x = cx + radius * cos;
  const y = cy + radius * sin;

  const isRightSide = cos >= 0;
  const dotColor = payload?.color || '#3B82F6';
  const dotX = isRightSide ? x : x - (pctStr.length * 6.3 + 8);
  const textX = isRightSide ? x + 8 : x;

  return (
    <g>
      <circle cx={dotX} cy={y} r={3.5} fill={dotColor} />
      <text
        x={textX}
        y={y}
        fill="#F8FAFC"
        textAnchor={isRightSide ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {pctStr}
      </text>
    </g>
  );
}

function OptisiteDonutCard({
  title,
  subtitle,
  formula,
  data,
  totalValue,
  unitLabel,
}: {
  title: string;
  subtitle: string;
  formula: string;
  data: DonutSlice[];
  totalValue: number;
  unitLabel: string;
}) {
  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              <InfoTooltip title={title} formula={formula} description={subtitle} />
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B] whitespace-nowrap">
            Total: <strong className="text-white">{totalValue}</strong>
          </span>
        </div>

        {/* Optisite Left-Aligned Legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-2 mt-3 select-none">
          {data.map(item => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-[2px] inline-block shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-[#CBD5E1]">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 || totalValue === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-xs text-[#64748B] italic">
          No data available for the selected filters.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={50}
              outerRadius={82}
              paddingAngle={0}
              stroke="none"
              labelLine={false}
              label={renderOptisiteDonutLabel}
            >
              {data.map(entry => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const item = payload[0]?.payload as DonutSlice | undefined;
                if (!item) return null;
                const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(2) : '0.00';
                return (
                  <div className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] shadow-lg space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <div className="font-mono text-[#CBD5E1]">
                      {item.value} {unitLabel} ({pct}%)
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function OptisiteBarCard({
  title,
  subtitle,
  formula,
  data,
  series,
  totalValue,
}: {
  title: string;
  subtitle: string;
  formula: string;
  data: StackedBarPoint[];
  series: StackedBarSeries[];
  totalValue: number;
}) {
  const barTotals = data.map(d => d.total).filter(v => typeof v === 'number' && !isNaN(v));
  const maxBar = barTotals.length > 0 ? Math.max(...barTotals) : 10;
  const yMax = Math.max(10, Math.ceil((maxBar * 1.15) / 5) * 5);

  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              <InfoTooltip title={title} formula={formula} description={subtitle} />
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B] whitespace-nowrap">
            Total: <strong className="text-white">{totalValue}</strong>
          </span>
        </div>

        {/* Optisite Left-Aligned Legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-2 mt-3 select-none">
          {series.map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-[2px] inline-block shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-[#CBD5E1]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 || totalValue === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-xs text-[#64748B] italic">
          No data available for the selected filters.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
            <XAxis
              dataKey="category"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
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
                const point = payload[0]?.payload as StackedBarPoint | undefined;
                if (!point) return null;
                const isSingleSeries = series.length === 1;
                const denominator = isSingleSeries ? totalValue : point.total || 0;

                return (
                  <div className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] shadow-lg space-y-1.5 min-w-[200px]">
                    <div className="font-semibold text-white pb-1 border-b border-[#1E293B]">
                      {label}
                    </div>
                    {series.map(s => {
                      const count = Number(point[s.key]) || 0;
                      if (count === 0) return null;
                      const pct = denominator > 0 ? ((count / denominator) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={s.key} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                            <span
                              className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.label} :
                          </span>
                          <span className="font-mono text-white">
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#1E293B]/80 text-[#94A3B8]">
                      <span>Total :</span>
                      <span className="font-mono font-semibold text-white">{denominator}</span>
                    </div>
                  </div>
                );
              }}
            />
            {series.map(s => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="alarmBar"
                fill={s.color}
                radius={[0, 0, 0, 0]}
                barSize={24}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function AlarmChartsGrid({
  leftChart,
  rightChart,
  totalValue,
  unitLabel = 'occurrences',
}: AlarmChartsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {leftChart.kind === 'donut' ? (
        <OptisiteDonutCard
          title={leftChart.title}
          subtitle={leftChart.subtitle}
          formula={leftChart.formula}
          data={leftChart.data}
          totalValue={totalValue}
          unitLabel={unitLabel}
        />
      ) : (
        <OptisiteBarCard
          title={leftChart.title}
          subtitle={leftChart.subtitle}
          formula={leftChart.formula}
          data={leftChart.data}
          series={leftChart.series}
          totalValue={totalValue}
        />
      )}

      <OptisiteBarCard
        title={rightChart.title}
        subtitle={rightChart.subtitle}
        formula={rightChart.formula}
        data={rightChart.data}
        series={rightChart.series}
        totalValue={totalValue}
      />
    </div>
  );
}
