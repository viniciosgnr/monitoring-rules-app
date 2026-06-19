'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DATA: Record<string, { day: string; rate: number }[]> = {
  'Last Week': [
    { day: 'Mon', rate: 44 }, { day: 'Tue', rate: 50 }, { day: 'Wed', rate: 49 },
    { day: 'Thu', rate: 63 }, { day: 'Fri', rate: 45 }, { day: 'Sat', rate: 47 },
    { day: 'Sun', rate: 25 },
  ],
  'Last Month': [
    { day: 'W1', rate: 38 }, { day: 'W2', rate: 55 },
    { day: 'W3', rate: 60 }, { day: 'W4', rate: 42 },
  ],
  'Last 6 month': [
    { day: 'Jan', rate: 48 }, { day: 'Feb', rate: 55 }, { day: 'Mar', rate: 60 },
    { day: 'Apr', rate: 52 }, { day: 'May', rate: 45 }, { day: 'Jun', rate: 58 },
  ],
};

export default function SuccessRateChart({ period }: { period: string }) {
  const data = DATA[period] ?? DATA['Last Week'];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 4, color: '#e2e8f0' }}
          cursor={{ stroke: '#1e2a3a' }}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ fill: '#0ea5e9', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#0ea5e9' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
