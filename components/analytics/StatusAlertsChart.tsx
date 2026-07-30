'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: {
    timeKey: string;
    'To Be Validated': number;
    'Validation in Progress': number;
    Validated: number;
    Rejected: number;
    Closed: number;
  }[];
}

export default function StatusAlertsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 15 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
        <XAxis dataKey="timeKey" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={15} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 8, color: '#E2E8F0', fontSize: 12 }}
        />
        <Legend verticalAlign="top" height={36} iconType="rect" iconSize={10} wrapperStyle={{ fontSize: 10, color: '#94A3B8', paddingTop: 0 }} />
        <Bar dataKey="Closed" stackId="a" fill="#64748B" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Rejected" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
        <Bar dataKey="To Be Validated" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Validated" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Validation in Progress" stackId="a" fill="#3B82F6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
