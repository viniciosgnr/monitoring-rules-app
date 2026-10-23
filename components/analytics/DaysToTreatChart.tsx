'use client';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface DaysToTreatPoint {
  timeKey: string;
  Fleet: number;
  [fpsoCode: string]: number | string;
}

interface Props {
  data: DaysToTreatPoint[];
  fpsos: string[];
}

const FPSO_COLORS: Record<string, string> = {
  DNY: '#3B82F6', // Blue
  ONE: '#6366F1', // Indigo
  PTY: '#F59E0B', // Amber
  UNY: '#8B5CF6', // Purple
  ATD: '#10B981', // Emerald
  MV24: '#EC4899', // Pink
  MV26: '#14B8A6', // Teal
};

export default function DaysToTreatChart({ data, fpsos }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 15, right: 15, left: -5, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
        <XAxis
          dataKey="timeKey"
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={15}
        />
        <YAxis
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          unit=" d"
          domain={[0, 'auto']}
        />
        <Tooltip
          formatter={(val: unknown) => [typeof val === 'number' ? `${val.toFixed(2)} days` : '—']}
          contentStyle={{
            background: '#111827',
            border: '1px solid #1E293B',
            borderRadius: 8,
            color: '#E2E8F0',
            fontSize: 12,
          }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          iconSize={10}
          wrapperStyle={{ fontSize: 11, color: '#94A3B8', paddingTop: 0 }}
        />
        {/* Bars for individual FPSOs */}
        {fpsos.map((fpso, index) => (
          <Bar
            key={fpso}
            dataKey={fpso}
            name={fpso}
            fill={FPSO_COLORS[fpso] || `hsl(${(index * 60) % 360}, 70%, 55%)`}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        ))}

        {/* Fleet Average Line */}
        <Line
          type="monotone"
          dataKey="Fleet"
          name="Fleet Average"
          stroke="#F8FAFC"
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: '#38BDF8', stroke: '#0B0F19', strokeWidth: 1.5 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
