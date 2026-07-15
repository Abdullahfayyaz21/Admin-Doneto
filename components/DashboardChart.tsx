'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', users: 2400, revenue: 2400 },
  { month: 'Feb', users: 1398, revenue: 2210 },
  { month: 'Mar', users: 3800, revenue: 2290 },
  { month: 'Apr', users: 3908, revenue: 2000 },
  { month: 'May', users: 4800, revenue: 2181 },
  { month: 'Jun', users: 3800, revenue: 2500 },
  { month: 'Jul', users: 4300, revenue: 2100 },
  { month: 'Aug', users: 5100, revenue: 2800 },
  { month: 'Sep', users: 4600, revenue: 2600 },
  { month: 'Oct', users: 5400, revenue: 3100 },
  { month: 'Nov', users: 6200, revenue: 3400 },
  { month: 'Dec', users: 7100, revenue: 3900 },
];

export default function DashboardChart() {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '13px',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#colorUsers)"
            name="Users"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fill="url(#colorRevenue)"
            name="Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
