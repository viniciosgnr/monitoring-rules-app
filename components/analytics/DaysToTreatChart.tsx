'use client';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface DaysToTreatPoint {
  label: string;
  Fleet: number;
  _counts?: Record<string, number>;
  _totalAlerts?: number;
  [fpsoCode: string]: number | string | Record<string, number> | undefined;
}

interface Props {
  data: DaysToTreatPoint[];
  fpsos: string[];
}

const PURPLE_PALETTE = [
  '#E595F7', // Light Orchid / Lavender
  '#9E28B5', // Deep Magenta / Plum
  '#C843E6', // Bright Fuchsia / Orchid
  '#6E24C9', // Deep Violet
  '#A855F7', // Medium Purple
];

const FPSO_COLOR_MAP: Record<string, string> = {
  ADG: '#E595F7',
  ATD: '#9E28B5',
  CDI: '#C843E6',
  SEP: '#6E24C9',
  UNY: '#A855F7',
  DNY: '#E595F7',
  ONE: '#9E28B5',
  PTY: '#C843E6',
};

const FLEET_COLOR = '#60A5FA';

function getFpsoColor(fpso: string, index: number): string {
  return FPSO_COLOR_MAP[fpso] || PURPLE_PALETTE[index % PURPLE_PALETTE.length];
}

export default function DaysToTreatChart({ data, fpsos }: Props) {
  const allNumericValues: number[] = [];
  (data || []).forEach(point => {
    if (typeof point.Fleet === 'number' && !isNaN(point.Fleet)) {
      allNumericValues.push(point.Fleet);
    }
    fpsos.forEach(fpso => {
      const val = point[fpso];
      if (typeof val === 'number' && !isNaN(val)) {
        allNumericValues.push(val);
      }
    });
  });

  const maxVal = allNumericValues.length > 0 ? Math.max(...allNumericValues) : 5;
  const yMax = Math.max(5, Math.ceil(maxVal + 1));

  return (
    <div>
      {/* Custom Legend aligned to left below subtitle */}
      <div className="flex items-center flex-wrap gap-5 mb-4 select-none">
        {fpsos.map((fpso, index) => (
          <div key={fpso} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-[2px] inline-block shrink-0"
              style={{ backgroundColor: getFpsoColor(fpso, index) }}
            />
            <span className="text-xs text-[#CBD5E1] font-medium">{fpso}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-[2px] inline-block shrink-0"
            style={{ backgroundColor: FLEET_COLOR }}
          />
          <span className="text-xs text-[#CBD5E1] font-medium">Fleet</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 15, left: -15, bottom: 10 }}
          barGap={3}
          barCategoryGap="24%"
        >
          <CartesianGrid stroke="#1E293B" opacity={0.65} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
            minTickGap={15}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, yMax]}
          />
          <Tooltip
            cursor={{ fill: '#1E293B', opacity: 0.25 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0]?.payload as DaysToTreatPoint | undefined;
              if (!point) return null;

              const totalAlerts = point._totalAlerts ?? 0;

              return (
                <div className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] shadow-lg space-y-1.5 min-w-[210px]">
                  <div className="font-semibold text-white pb-1 border-b border-[#1E293B]">
                    {label}
                  </div>
                  {fpsos.map((fpso, index) => {
                    const daysVal = point[fpso];
                    const numDays = typeof daysVal === 'number' ? daysVal.toFixed(1) : '—';
                    const alertCount = point._counts ? point._counts[fpso] : undefined;
                    const countSuffix = typeof alertCount === 'number'
                      ? ` (${alertCount} alerts)`
                      : '';

                    return (
                      <div key={fpso} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <span
                            className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                            style={{ backgroundColor: getFpsoColor(fpso, index) }}
                          />
                          {fpso} :
                        </span>
                        <span className="font-mono text-white text-right">
                          {numDays} days{countSuffix}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#1E293B]/80 text-[#94A3B8]">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: FLEET_COLOR }}
                      />
                      Fleet Avg :
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {point.Fleet.toFixed(1)} days ({totalAlerts} total)
                    </span>
                  </div>
                </div>
              );
            }}
          />
          {fpsos.map((fpso, index) => (
            <Bar
              key={fpso}
              dataKey={fpso}
              name={fpso}
              fill={getFpsoColor(fpso, index)}
              radius={[1, 1, 0, 0]}
              maxBarSize={22}
            />
          ))}
          <Line
            type="linear"
            dataKey="Fleet"
            name="Fleet"
            stroke={FLEET_COLOR}
            strokeWidth={1.75}
            dot={{ fill: FLEET_COLOR, r: 4.5, strokeWidth: 0 }}
            activeDot={{ r: 6.5, fill: FLEET_COLOR, stroke: '#0B0F19', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
