'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Heart,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/StatCard';
import { ActivityTable } from '@/components/ActivityTable';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

const DashboardChart = dynamic(
  () => import('@/components/DashboardChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-xl bg-muted/50" />
    ),
  }
);

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Admin';

  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalFunds, setTotalFunds] = useState('PKR 0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardOverview = async () => {
      try {
        setLoading(true);
        const [usersRes, campsRes, kycRes] = await Promise.allSettled([
          api.get('/users?limit=100'),
          api.get('/fundraising-campaigns'),
          api.get('/kyc/admin/requests', { params: { limit: 100 } }),
        ]);

        if (usersRes.status === 'fulfilled') {
          const raw = usersRes.value.data;
          const userList = Array.isArray(raw?.data?.data)
            ? raw.data.data
            : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
            ? raw
            : [];
          setTotalUsers(typeof raw?.total === 'number' ? raw.total : userList.length);
          const verified = userList.filter((u: any) => u.isVerified || u.accountStatus === 'Verified').length;
          setVerifiedUsers(verified);
        }

        if (campsRes.status === 'fulfilled') {
          const raw = campsRes.value.data;
          const campList = Array.isArray(raw?.data?.data)
            ? raw.data.data
            : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
            ? raw
            : [];
          setTotalCampaigns(typeof raw?.total === 'number' ? raw.total : campList.length);

          const sumRaised = campList.reduce((acc: number, c: any) => acc + (Number(c.collectedAmount) || 0), 0);
          setTotalFunds(`PKR ${sumRaised.toLocaleString()}`);
        }
      } catch (err) {
        // silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardOverview();
  }, []);

  const liveStats = [
    {
      title: 'Total Users',
      value: loading ? '...' : totalUsers.toString(),
      change: 'Realtime',
      trend: 'up' as const,
      icon: Users,
      iconColor: 'text-[#185500] dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      title: 'Verified Members',
      value: loading ? '...' : verifiedUsers.toString(),
      change: 'Active',
      trend: 'up' as const,
      icon: UserCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      title: 'Campaigns',
      value: loading ? '...' : totalCampaigns.toString(),
      change: 'Platform',
      trend: 'up' as const,
      icon: Heart,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      title: 'Total Raised',
      value: loading ? '...' : totalFunds,
      change: 'Gross',
      trend: 'up' as const,
      icon: DollarSign,
      iconColor: 'text-[#185500] dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {firstName}! Here&apos;s what&apos;s happening on Doneto today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {liveStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Chart */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-bold">Platform Registration Overview</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#185500]" />
              <span className="text-muted-foreground">New Users</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1]" />
              <span className="text-muted-foreground">Campaigns</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <DashboardChart />
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Recent Platform Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTable />
        </CardContent>
      </Card>
    </div>
  );
}
