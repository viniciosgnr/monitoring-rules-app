'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: {
    timeKey: string;
    Drift: number;
    Spike: number;
    'Normalized dP': number;
    Surge: number;
    Trend: number;
  }[];
  selectedCategories?: string[];
}

export default function RuleAlertsChart({ data, selectedCategories = [] }: Props) {
  const showAll = selectedCategories.length === 0 || selectedCategories.length === 5;
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
        {(showAll || selectedCategories.includes('Drift')) && <Bar dataKey="Drift" stackId="a" fill="#a855f7" />}
        {(showAll || selectedCategories.includes('Spike')) && <Bar dataKey="Spike" stackId="a" fill="#ec4899" />}
        {(showAll || selectedCategories.includes('Normalized dP')) && <Bar dataKey="Normalized dP" stackId="a" fill="#8b5cf6" />}
        {(showAll || selectedCategories.includes('Surge')) && <Bar dataKey="Surge" stackId="a" fill="#0ea5e9" />}
        {(showAll || selectedCategories.includes('Trend')) && <Bar dataKey="Trend" stackId="a" fill="#1d4ed8" />}
      </BarChart>
    </ResponsiveContainer>
  );
}
