'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sun,
  Moon,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Heart,
  DollarSign,
  FileCheck,
  Sparkles,
  Inbox,
  Loader2,
  Clock
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: { actionType?: string; targetId?: string };
}

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const count = res.data?.unreadCount ?? res.data?.data?.unreadCount ?? 0;
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  const fetchLatestNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications?page=1&limit=8');
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setNotifications(list);
      }
      await fetchUnreadCount();
    } catch {
      // silent
    } finally {
      setLoadingNotifs(false);
    }
  }, [fetchUnreadCount]);

  useEffect(() => {
    setMounted(true);
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);

    const handleKycUpdated = () => {
      fetchUnreadCount();
    };
    window.addEventListener('doneto_kyc_updated', handleKycUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('doneto_kyc_updated', handleKycUpdated);
    };
  }, [fetchUnreadCount]);

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      fetchLatestNotifications();
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setMarkingAll(true);
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }

    setIsPopoverOpen(false);

    // Dynamic destination navigation
    const action = notif.data?.actionType;
    if (action === 'kyc') {
      router.push('/users/kyc');
    } else if (action === 'withdrawals') {
      router.push('/financials/withdrawals');
    } else if (action === 'campaign_detail' || action === 'campaigns') {
      router.push('/campaigns');
    } else if (action === 'reports') {
      router.push('/campaigns/reports');
    } else {
      router.push('/notifications');
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date().getTime();
    const past = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString();
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

  const { user } = useAuth();
  const name = user?.name || 'Alex Doe';
  const role = user?.role || 'Administrator';

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const split = nameStr.trim().split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[split.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const displayedNotifications = notifications.filter((n) =>
    filterTab === 'unread' ? !n.isRead : true
  );

  return (
    <header className="flex h-16 items-center justify-between border-none bg-background px-6 select-none dark:bg-background">
      {/* Search Input */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search campaigns, users, transactions..."
          className="h-10 w-full rounded-xl border-0 bg-muted/60 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground focus:bg-muted/90 focus:ring-2 focus:ring-primary/20 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
        />
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:text-white"
          title="Toggle Theme"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notification Bell with Radix Popover */}
        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-150',
                isPopoverOpen ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-foreground'
              )}
              title="Notifications"
            >
              <Bell className={cn('h-5 w-5 transition-transform', isPopoverOpen && 'scale-110')} />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-primary/40 animate-ping" />
                </>
              )}
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 sm:w-96 p-0 rounded-2xl border-border bg-card shadow-xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-[#185500] text-white dark:bg-white dark:text-black text-[10px] h-5 px-1.5 rounded-full font-semibold">
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            {/* Popover Filter Tabs */}
            <div className="px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 border-b border-border/50">
              <button
                onClick={() => setFilterTab('all')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  filterTab === 'all'
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1',
                  filterTab === 'unread'
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* Notification Items List */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60 no-scrollbar">
              {loadingNotifs ? (
                <div className="flex h-36 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : displayedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-full bg-muted/60 p-3 text-muted-foreground mb-2">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-foreground">No notifications</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {filterTab === 'unread' ? 'All caught up!' : 'No recent activity'}
                  </p>
                </div>
              ) : (
                displayedNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'p-3 transition-colors flex items-start gap-3 cursor-pointer hover:bg-muted/40 relative group',
                      !notif.isRead ? 'bg-primary/[0.04] dark:bg-primary/[0.08]' : ''
                    )}
                  >
                    <div className="mt-0.5 rounded-xl bg-muted/60 border border-border p-2 shrink-0 shadow-xs">
                      {getTypeIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn('text-xs truncate text-foreground', !notif.isRead ? 'font-bold' : 'font-medium')}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {getTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {notif.body}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Popover Footer */}
            <div className="p-2 border-t border-border bg-muted/20 text-center">
              <Link
                href="/notifications"
                onClick={() => setIsPopoverOpen(false)}
                className="inline-flex items-center justify-center text-xs font-semibold text-primary hover:underline py-1 w-full gap-1"
              >
                View all in notification center <ExternalLink className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile Avatar & Name */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-700 text-sm font-bold text-white shadow-sm">
            {getInitials(name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
