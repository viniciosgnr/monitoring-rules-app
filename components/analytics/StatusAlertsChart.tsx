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

const RULES = [
  'COCE_SURG_MGN',
  'PUMP_VIB_THR',
  'COCE_SPK_DET',
  'PUMP_THR_MGN',
  'HTEX_FOUL_IDX',
  'TRB_LO_DRFT',
  'TRB_TEMP_DEV',
];

export default function StatusAlertsChart({ period, fpso, equipment, rule }: Props) {
  const seed = getStringHash(fpso) + getStringHash(equipment) + getStringHash(rule) + getStringHash(period);

  const data = RULES.map(r => {
    const ruleSeed = seed + getStringHash(r);
    const toBeValidated = 10 + (ruleSeed % 25);
    const validationInProgress = 5 + ((ruleSeed * 3) % 15);
    const validated = 25 + ((ruleSeed * 7) % 45);
    const rejected = 2 + ((ruleSeed * 11) % 10);
    const closed = 4 + ((ruleSeed * 13) % 12);

    const total = toBeValidated + validationInProgress + validated + rejected + closed;

    return {
      rule: r,
      'To Be Validated': parseFloat(((toBeValidated / total) * 100).toFixed(1)),
      'Validation in Progress': parseFloat(((validationInProgress / total) * 100).toFixed(1)),
      'Validated': parseFloat(((validated / total) * 100).toFixed(1)),
      'Rejected': parseFloat(((rejected / total) * 100).toFixed(1)),
      'Closed': parseFloat(((closed / total) * 100).toFixed(1)),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="rule" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} unit="%" />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 4, color: '#e2e8f0' }}
          formatter={(value) => [`${value}%`]}
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
