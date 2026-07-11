'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface Props {
  period: string;
  fpso: string;
  equipment: string;
  rule: string;
}

const LABELS: Record<string, string[]> = {
  'Last Week': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  'Last Month': ['W1', 'W2', 'W3', 'W4'],
  'Last 6 month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
};

export default function StatusAlertsChart({ period, fpso, equipment, rule }: Props) {
  const labels = LABELS[period] ?? LABELS['Last Week'];
  const seed = getStringHash(fpso) + getStringHash(equipment) + getStringHash(rule) + getStringHash(period);

  const isFiltered = rule !== 'All Categories';
  const scale = isFiltered ? 0.25 : 1.0;

  const data = labels.map((timeKey, index) => {
    const timeSeed = seed + index;
    const toBeValidated = Math.round((10 + (timeSeed % 25)) * scale);
    const validationInProgress = Math.round((5 + ((timeSeed * 3) % 15)) * scale);
    const validated = Math.round((25 + ((timeSeed * 7) % 45)) * scale);
    const rejected = Math.round((2 + ((timeSeed * 11) % 10)) * scale);
    const closed = Math.round((4 + ((timeSeed * 13) % 12)) * scale);

    return {
      timeKey,
      'To Be Validated': toBeValidated,
      'Validation in Progress': validationInProgress,
      'Validated': validated,
      'Rejected': rejected,
      'Closed': closed,
    };
  });

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
