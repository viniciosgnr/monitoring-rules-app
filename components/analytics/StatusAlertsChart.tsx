'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: {
    timeKey: string;
    'New': number;
    'Review in Progress': number;
    'Eligible for Event Manager': number;
    'Rejected': number;
  }[];
  mode?: 'count' | 'percent';
}

export default function StatusAlertsChart({ data, mode = 'count' }: Props) {
  const isPercent = mode === 'percent';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 15 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
        <XAxis dataKey="timeKey" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={15} />
        <YAxis
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={isPercent}
          domain={isPercent ? [0, 100] : [0, 'auto']}
          unit={isPercent ? '%' : ''}
        />
        <Tooltip
          formatter={(val: unknown) => [
            isPercent ? `${Number(val).toFixed(1)}%` : Number(val),
          ]}
          contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 8, color: '#E2E8F0', fontSize: 12 }}
        />
        <Legend verticalAlign="top" height={36} iconType="rect" iconSize={10} wrapperStyle={{ fontSize: 10, color: '#94A3B8', paddingTop: 0 }} />
        <Bar dataKey="Rejected" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
        <Bar dataKey="New" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Review in Progress" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Eligible for Event Manager" stackId="a" fill="#22C55E" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
