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
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 15 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
        <XAxis dataKey="timeKey" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={15} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 8, color: '#E2E8F0', fontSize: 12 }}
        />
        <Legend verticalAlign="top" height={36} iconType="rect" iconSize={10} wrapperStyle={{ fontSize: 10, color: '#94A3B8', paddingTop: 0 }} />
        {(showAll || selectedCategories.includes('Drift')) && <Bar dataKey="Drift" stackId="a" fill="#C084FC" radius={[0, 0, 0, 0]} />}
        {(showAll || selectedCategories.includes('Normalized dP')) && <Bar dataKey="Normalized dP" stackId="a" fill="#EC4899" radius={[0, 0, 0, 0]} />}
        {(showAll || selectedCategories.includes('Spike')) && <Bar dataKey="Spike" stackId="a" fill="#D946EF" radius={[0, 0, 0, 0]} />}
        {(showAll || selectedCategories.includes('Surge')) && <Bar dataKey="Surge" stackId="a" fill="#8B5CF6" radius={[0, 0, 0, 0]} />}
        {(showAll || selectedCategories.includes('Trend')) && <Bar dataKey="Trend" stackId="a" fill="#3B82F6" radius={[3, 3, 0, 0]} />}
      </BarChart>
    </ResponsiveContainer>
  );
}
