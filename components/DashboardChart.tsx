'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

interface ChartPoint {
  month: string;
  users: number;
  campaigns: number;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardChart() {
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const buildChartData = async () => {
      try {
        const [usersRes, campsRes] = await Promise.allSettled([
          api.get('/users?limit=100'),
          api.get('/fundraising-campaigns'),
        ]);

        const usersList: any[] = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data?.data || usersRes.value.data?.data || usersRes.value.data || []) : [];
        const campsList: any[] = campsRes.status === 'fulfilled' ? (campsRes.value.data?.data?.data || campsRes.value.data?.data || campsRes.value.data || []) : [];

        const currentYear = new Date().getFullYear();
        const monthlyUsers: number[] = new Array(12).fill(0);
        const monthlyCamps: number[] = new Array(12).fill(0);

        if (Array.isArray(usersList)) {
          usersList.forEach((u) => {
            if (u.createdAt) {
              const d = new Date(u.createdAt);
              if (d.getFullYear() === currentYear) {
                monthlyUsers[d.getMonth()]++;
              }
            }
          });
        }

        if (Array.isArray(campsList)) {
          campsList.forEach((c) => {
            if (c.createdAt) {
              const d = new Date(c.createdAt);
              if (d.getFullYear() === currentYear) {
                monthlyCamps[d.getMonth()]++;
              }
            }
          });
        }

        const chartPoints: ChartPoint[] = months.map((month, idx) => ({
          month,
          users: monthlyUsers[idx],
          campaigns: monthlyCamps[idx],
        }));

        setData(chartPoints);
      } catch (e) {
        setData(months.map((m) => ({ month: m, users: 0, campaigns: 0 })));
      }
    };

    buildChartData();
  }, []);

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#185500" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#185500" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCampaigns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
            allowDecimals={false}
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
            stroke="#185500"
            strokeWidth={2}
            fill="url(#colorUsers)"
            name="New Users"
          />
          <Area
            type="monotone"
            dataKey="campaigns"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorCampaigns)"
            name="Campaigns"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
