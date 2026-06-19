'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Sorted and color-matched to align exactly with CHANGE_TYPES in AuditClient
const DATA = [
  { name: 'Updated threshold_comparison operator', value: 45 },
  { name: 'Modified surge margin threshold',       value: 9  },
  { name: 'Adjusted time_totalization period',     value: 46 },
  { name: 'Enabled rule after maintenance window', value: 5  },
  { name: 'Updated alert sensitivity',             value: 2  },
];

const COLORS = ['#ec4899', '#a855f7', '#22d3ee', '#0ea5e9', '#1d4ed8'];

export default function DonutChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={DATA}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          dataKey="value"
          paddingAngle={2}
          label={({ value }) => `${value}%`}
          labelLine={{ stroke: '#334155', strokeWidth: 1 }}
        >
          {DATA.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid #1e2a3a',
            borderRadius: 4,
            color: '#e2e8f0',
            fontSize: 11,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
