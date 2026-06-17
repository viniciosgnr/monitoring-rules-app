'use client';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const DATA = [
  { cause: 'No data',    count: 45 },
  { cause: 'Time total', count: 62 },
  { cause: 'NDFrame',    count: 63 },
  { cause: 'The data',   count: 52 },
  { cause: 'List idx',   count: 52 },
  { cause: 'Other',      count: 8  },
];
const COLORS = ['#a855f7', '#ec4899', '#8b5cf6', '#0ea5e9', '#1d4ed8', '#22d3ee'];

export default function ParetoChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="cause" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 80]} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 4, color: '#e2e8f0' }}
        />
        <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={32}>
          {DATA.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
        <Line
          type="monotone"
          dataKey="count"
          stroke="#ffffff"
          strokeWidth={1.5}
          dot={{ fill: '#ffffff', r: 3, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
