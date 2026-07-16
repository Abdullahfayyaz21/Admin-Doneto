'use client';

import {
  Users,
  UserCheck,
  UserPlus,
  DollarSign,
  Wallet,
  Activity,
  FileText,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/StatCard';
import { ActivityTable } from '@/components/ActivityTable';
import { useAuth } from '@/lib/auth-context';

const DashboardChart = dynamic(
  () => import('@/components/DashboardChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" />
    ),
  }
);
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

const stats = [
  {
    title: 'Total Users',
    value: '12,483',
    change: '12.5%',
    trend: 'up' as const,
    icon: Users,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    title: 'Verified Users',
    value: '8,921',
    change: '8.2%',
    trend: 'up' as const,
    icon: UserCheck,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
  },
  {
    title: 'Pending Users',
    value: '3,562',
    change: '3.1%',
    trend: 'down' as const,
    icon: UserPlus,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
  },
  {
    title: 'Revenue',
    value: '$48,295',
    change: '15.3%',
    trend: 'up' as const,
    icon: DollarSign,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    title: 'Wallet Balance',
    value: '$12,847',
    change: '5.7%',
    trend: 'up' as const,
    icon: Wallet,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
  },
  {
    title: "Today's Activity",
    value: '1,429',
    change: '2.4%',
    trend: 'down' as const,
    icon: Activity,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
  },
  {
    title: 'Reports',
    value: '326',
    change: '9.8%',
    trend: 'up' as const,
    icon: FileText,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
  {
    title: 'Growth',
    value: '23.8%',
    change: '4.5%',
    trend: 'up' as const,
    icon: TrendingUp,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50 dark:bg-teal-500/10',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Alex';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {firstName}! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Analytics Overview</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[hsl(var(--chart-1))]" />
              <span className="text-muted-foreground">Users</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[hsl(var(--chart-2))]" />
              <span className="text-muted-foreground">Revenue</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <DashboardChart />
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTable />
        </CardContent>
      </Card>
    </div>
  );
}
