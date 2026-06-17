'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const DATA = [
  { name: 'Updated threshold_comparison operator', value: 45 },
  { name: 'Adjusted time_totalization period',     value: 46 },
  { name: 'Modified surge margin threshold',       value: 9  },
  { name: 'Enabled rule after maintenance window', value: 5  },
  { name: 'Updated alert sensitivity',             value: 2  },
];
const COLORS = ['#ec4899', '#a855f7', '#8b5cf6', '#0ea5e9', '#1d4ed8'];

export default function DonutChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={DATA}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          dataKey="value"
          paddingAngle={2}
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
