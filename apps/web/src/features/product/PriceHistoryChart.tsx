import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '@/shared/lib/format';

export function PriceHistoryChart({
  snapshots,
}: {
  snapshots: Array<{ recordedAt: string; amount: number }>;
}) {
  const data = snapshots.map((snap) => ({
    date: new Date(snap.recordedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
    amount: snap.amount,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#243041" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7a8d', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: '#6b7a8d', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(value: number) =>
              new Intl.NumberFormat('en-IN', {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(value)
            }
          />
          <Tooltip
            contentStyle={{
              background: '#141b24',
              border: '1px solid #243041',
              borderRadius: 8,
              color: '#f4f7fb',
            }}
            formatter={(value) => [
              formatMoney({ amount: Number(value), currency: 'INR' }),
              'Price',
            ]}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#priceFill)"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
