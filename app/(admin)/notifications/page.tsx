'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Heart,
  DollarSign,
  FileCheck,
  CheckCheck,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Layers,
  Inbox
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LoadingState } from '@/components/brand/states';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: { actionType?: string; targetId?: string };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.allSettled([
        api.get(`/notifications?page=${page}&limit=15${filterType === 'unread' ? '&unreadOnly=true' : ''}`),
        api.get('/notifications/unread-count'),
      ]);

      if (listRes.status === 'fulfilled') {
        const payload = listRes.value.data?.data || listRes.value.data;
        if (Array.isArray(payload)) {
          setNotifications(payload);
          setTotalPages(1);
          setTotalCount(payload.length);
        } else if (payload?.data) {
          setNotifications(payload.data || []);
          setTotalPages(payload.lastPage || 1);
          setTotalCount(payload.total || 0);
        }
      }

      if (countRes.status === 'fulfilled') {
        setUnreadCount(countRes.value.data?.unreadCount || countRes.value.data?.data?.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [fetchNotifications, currentPage]);

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('kyc')) return <FileCheck className="h-4 w-4 text-purple-500" />;
    if (t.includes('donation') || t.includes('goal')) return <DollarSign className="h-4 w-4 text-emerald-500" />;
    if (t.includes('campaign')) return <Heart className="h-4 w-4 text-primary" />;
    if (t.includes('withdraw')) return <Sparkles className="h-4 w-4 text-amber-500" />;
    if (t.includes('report') || t.includes('security')) return <ShieldAlert className="h-4 w-4 text-red-500" />;
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  const getTargetLink = (n: NotificationItem) => {
    const action = n.data?.actionType;
    if (action === 'kyc') return '/users/kyc';
    if (action === 'campaign_detail' || action === 'campaigns') return '/campaigns';
    if (action === 'withdrawals') return '/financials/withdrawals';
    if (action === 'reports') return '/campaigns/reports';
    return null;
  };

  const filtered = notifications.filter((n) => {
    const term = search.toLowerCase();
    const matchSearch = n.title?.toLowerCase().includes(term) || n.body?.toLowerCase().includes(term);
    if (!matchSearch) return false;
    if (filterType === 'unread') return !n.isRead;
    if (filterType === 'kyc') return n.type?.toLowerCase().includes('kyc');
    if (filterType === 'campaigns') return n.type?.toLowerCase().includes('campaign');
    if (filterType === 'financial') return n.type?.toLowerCase().includes('donation') || n.type?.toLowerCase().includes('withdraw');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notifications Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time activity feed, verification updates, and platform alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="rounded-xl border-border text-xs"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 mr-1.5 text-primary" />
              )}
              Mark all as read
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => fetchNotifications(currentPage)}
            className="rounded-xl border-border text-xs"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread Alerts
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Bell className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{unreadCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires your review or acknowledgment</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Notifications
            </CardTitle>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <Layers className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCount || notifications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total recorded system events</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {unreadCount === 0 ? 'All Caught Up' : 'Active Updates'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Live webhook & dispatch active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main List */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none overflow-hidden">
        {/* Filter bar */}
        <div className="pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'campaigns', label: 'Campaigns' },
              { key: 'kyc', label: 'KYC' },
              { key: 'financial', label: 'Financial' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setFilterType(tab.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                  filterType === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingState text="Loading notifications…" size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-3">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No Notifications</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              You do not have any notifications matching your current filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const link = getTargetLink(item);
              return (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkSingleRead(item.id)}
                  className={cn(
                    'p-4 transition-colors flex items-start gap-3.5 cursor-pointer group hover:bg-muted/30',
                    !item.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
                  )}
                >
                  <div className="mt-0.5 rounded-xl bg-card border border-border p-2.5 shrink-0 shadow-sm">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className={cn('text-sm text-foreground', !item.isRead ? 'font-bold' : 'font-medium')}>
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex items-center gap-3 mt-2.5">
                      <Badge variant="outline" className="text-[10px] rounded-md font-normal text-muted-foreground">
                        {item.type}
                      </Badge>

                      {link && (
                        <Link
                          href={link}
                          className="inline-flex items-center text-[11px] font-medium text-primary hover:underline"
                        >
                          View details <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-lg"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
