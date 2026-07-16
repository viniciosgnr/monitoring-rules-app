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
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="timeKey" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 4, color: '#e2e8f0' }}
        />
        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 9, color: '#94a3b8' }} />
        <Bar dataKey="To Be Validated" stackId="a" fill="#f59e0b" />
        <Bar dataKey="Validation in Progress" stackId="a" fill="#3b82f6" />
        <Bar dataKey="Validated" stackId="a" fill="#10b981" />
        <Bar dataKey="Rejected" stackId="a" fill="#ef4444" />
        <Bar dataKey="Closed" stackId="a" fill="#4b5563" />
      </BarChart>
    </ResponsiveContainer>
  );
}
