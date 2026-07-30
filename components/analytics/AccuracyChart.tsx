'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { label: string; accuracy: number }[];
}

export default function AccuracyChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
        <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={15} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 20, 40, 60, 80]} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 8, color: '#E2E8F0', fontSize: 12 }}
          cursor={{ stroke: '#1E293B' }}
          formatter={(value) => [`${value}%`, 'Accuracy']}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="#3B82F6"
          strokeWidth={2.5}
          dot={{ fill: '#3B82F6', r: 5, strokeWidth: 0 }}
          activeDot={{ r: 7, fill: '#3B82F6', stroke: '#111827', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
