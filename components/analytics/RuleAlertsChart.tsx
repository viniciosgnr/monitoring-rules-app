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

const CATEGORIES = [
  'Drift',
  'Spike',
  'Normalized dP',
  'Surge',
  'Trend',
];

export default function RuleAlertsChart({ period, fpso, equipment, rule }: Props) {
  const seed = getStringHash(fpso) + getStringHash(equipment) + getStringHash(rule) + getStringHash(period);

  const data = CATEGORIES.map(c => {
    const catSeed = seed + getStringHash(c);
    const toBeValidated = 10 + (catSeed % 25);
    const validationInProgress = 5 + ((catSeed * 3) % 15);
    const validated = 25 + ((catSeed * 7) % 45);
    const rejected = 2 + ((catSeed * 11) % 10);
    const closed = 4 + ((catSeed * 13) % 12);

    return {
      category: c,
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
        <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
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
