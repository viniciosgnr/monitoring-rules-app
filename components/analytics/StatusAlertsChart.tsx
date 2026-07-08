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

const STATUSES = [
  'To Be Validated',
  'Validation in Progress',
  'Validated',
  'Rejected',
  'Closed',
];

export default function StatusAlertsChart({ period, fpso, equipment, rule }: Props) {
  const seed = getStringHash(fpso) + getStringHash(equipment) + getStringHash(rule) + getStringHash(period);

  const data = STATUSES.map(s => {
    const statusSeed = seed + getStringHash(s);
    const drift = 8 + (statusSeed % 15);
    const spike = 12 + ((statusSeed * 3) % 20);
    const normalizedDp = 6 + ((statusSeed * 7) % 18);
    const surge = 15 + ((statusSeed * 11) % 25);
    const trend = 10 + ((statusSeed * 13) % 22);

    return {
      status: s,
      'Drift': drift,
      'Spike': spike,
      'Normalized dP': normalizedDp,
      'Surge': surge,
      'Trend': trend,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 4, color: '#e2e8f0' }}
        />
        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 9, color: '#94a3b8' }} />
        <Bar dataKey="Drift" stackId="a" fill="#a855f7" />
        <Bar dataKey="Spike" stackId="a" fill="#ec4899" />
        <Bar dataKey="Normalized dP" stackId="a" fill="#8b5cf6" />
        <Bar dataKey="Surge" stackId="a" fill="#0ea5e9" />
        <Bar dataKey="Trend" stackId="a" fill="#1d4ed8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
