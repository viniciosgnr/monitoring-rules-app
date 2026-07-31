'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { label: string; accuracy: number }[];
}

export default function AccuracyChart({ data }: Props) {
  const values = (data || []).map(d => d.accuracy).filter(v => typeof v === 'number' && !isNaN(v));
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 100;
  
  const yMin = Math.max(0, Math.floor((minVal - 5) / 10) * 10);
  const yMax = Math.min(100, Math.ceil((maxVal + 5) / 10) * 10);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
        <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={15} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[yMin, yMax]} />
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
