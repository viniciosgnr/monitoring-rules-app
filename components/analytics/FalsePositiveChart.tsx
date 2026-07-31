'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { label: string; falsePositives: number }[];
}

export default function FalsePositiveChart({ data }: Props) {
  const values = (data || []).map(d => d.falsePositives).filter(v => typeof v === 'number' && !isNaN(v));
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 50;

  const yMin = Math.max(0, Math.floor((minVal - 2) / 5) * 5);
  const yMax = Math.min(100, Math.ceil((maxVal + 2) / 5) * 5);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
        <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={15} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[yMin, yMax]} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 8, color: '#E2E8F0', fontSize: 12 }}
          cursor={{ stroke: '#1E293B' }}
          formatter={(value) => [`${value}%`, 'False Positive Rate']}
        />
        <Line
          type="monotone"
          dataKey="falsePositives"
          stroke="#F59E0B"
          strokeWidth={2.5}
          dot={{ fill: '#F59E0B', r: 5, strokeWidth: 0 }}
          activeDot={{ r: 7, fill: '#F59E0B', stroke: '#111827', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
