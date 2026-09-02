'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  Flag,
  Heart,
  Users,
  Building2,
  UserCheck,
  Sparkles,
  Image as ImageIcon,
  DollarSign,
  Wallet,
  Tag,
  Layers,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import Cookies from 'js-cookie';
import { useTheme } from 'next-themes';
import api from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Moderation & Approvals',
    items: [
      { label: 'Approvals Queue', href: '/campaigns/approvals', icon: CheckSquare, badgeKey: 'pendingCampaigns' },
      { label: 'KYC Verifications', href: '/users/kyc', icon: ShieldCheck, badgeKey: 'pendingKyc' },
      { label: 'Deletion Requests', href: '/campaigns/delete-requests', icon: AlertTriangle, badgeKey: 'deleteRequests' },
      { label: 'Reported Campaigns', href: '/campaigns/reports', icon: Flag, badgeKey: 'reports' },
    ],
  },
  {
    title: 'Platform Management',
    items: [
      { label: 'Campaigns', href: '/campaigns', icon: Heart },
      { label: 'All Users', href: '/users', icon: Users },
      { label: 'NGOs', href: '/users/ngos', icon: Building2 },
      { label: 'Donors', href: '/users/donors', icon: UserCheck },
      { label: 'Boost Requests', href: '/campaigns/boosts', icon: Sparkles },
      { label: 'Media Assets', href: '/media', icon: ImageIcon },
    ],
  },
  {
    title: 'Finances & Payouts',
    items: [
      { label: 'Donations', href: '/financials/donations', icon: DollarSign },
      { label: 'Withdrawals', href: '/financials/withdrawals', icon: Wallet, badgeKey: 'pendingWithdrawals' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Campaign Categories', href: '/campaigns/categories', icon: Tag },
      { label: 'NGO Categories', href: '/users/kyc-categories', icon: Layers },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  initialCollapsed?: boolean;
}

export function Sidebar({ initialCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    setMounted(true);

    // Fetch badges/counts in background
    const fetchCounters = async () => {
      try {
        const [pendingRes, delReqRes] = await Promise.allSettled([
          api.get('/fundraising-campaigns/admin/pending'),
          api.get('/fundraising-campaigns/admin/delete-requests'),
        ]);

        const counts: { [key: string]: number } = {};

        if (pendingRes.status === 'fulfilled') {
          const list = pendingRes.value.data?.data || pendingRes.value.data || [];
          counts.pendingCampaigns = Array.isArray(list) ? list.length : 0;
        }
        if (delReqRes.status === 'fulfilled') {
          const list = delReqRes.value.data?.data || delReqRes.value.data || [];
          counts.deleteRequests = Array.isArray(list) ? list.length : 0;
        }

        setBadgeCounts(counts);
      } catch (err) {
        // silent fail
      }
    };

    fetchCounters();
  }, [pathname]);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col text-white transition-all duration-300 select-none shrink-0 z-30 antialiased',
        collapsed
          ? 'w-44 bg-transparent shadow-none'
          : 'w-64 bg-[#061501] border-r border-white/[0.08] dark:bg-background dark:border-none'
      )}
    >
      {/* Logo & Hover Toggle Button */}
      <div
        className={cn(
          'relative flex h-16 items-center px-4 transition-all duration-300',
          collapsed
            ? 'justify-center border-none'
            : 'justify-between border-b border-white/[0.08] dark:border-none'
        )}
      >
        <div className="relative w-[115px] h-10 flex items-center justify-center group/logo">
          <Link
            href="/dashboard"
            className="transition-opacity duration-200 group-hover/logo:opacity-0 flex items-center justify-center h-full"
          >
            <img
              src={collapsed && mounted && resolvedTheme === 'light' ? '/logo-green.svg' : '/logo.svg'}
              alt="DONETO"
              className="h-7 w-auto shrink-0 select-none"
            />
          </Link>
          <button
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              Cookies.set('sidebar_collapsed', String(next), { expires: 365 });
            }}
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/logo:opacity-100 group-hover/logo:pointer-events-auto transition-all duration-200 rounded-lg p-1.5',
              collapsed
                ? resolvedTheme === 'light'
                  ? 'text-slate-800 hover:bg-slate-100'
                  : 'text-white hover:bg-white/10'
                : 'text-white hover:bg-white/10'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation List - Hidden when collapsed */}
      {!collapsed && (
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4 no-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/45 select-none">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const allNavHrefs = navSections.flatMap((s) => s.items.map((i) => i.href));
                  const isExact = pathname === item.href;
                  const isPrefix = item.href !== '/dashboard' && pathname.startsWith(item.href + '/');
                  const hasMoreSpecificMatch = allNavHrefs.some(
                    (otherHref) =>
                      otherHref !== item.href &&
                      (pathname === otherHref ||
                        (otherHref.length > item.href.length && pathname.startsWith(otherHref + '/')))
                  );
                  const active = isExact || (isPrefix && !hasMoreSpecificMatch);
                  const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 antialiased shadow-none',
                        active
                          ? 'bg-[#185500] text-white dark:bg-white dark:text-black font-semibold'
                          : 'text-white/75 hover:bg-white/10 hover:text-white font-medium'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            'h-[19px] w-[19px] shrink-0 transition-transform duration-150 group-hover:scale-105',
                            active
                              ? 'text-white dark:text-black stroke-[2]'
                              : 'text-white/75 group-hover:text-white stroke-[1.75]'
                          )}
                        />
                        <span
                          className={cn(
                            'truncate text-xs tracking-normal',
                            active
                              ? 'text-white dark:text-black font-bold'
                              : 'text-white/80 group-hover:text-white font-medium'
                          )}
                        >
                          {item.label}
                        </span>
                      </div>

                      {badge && badge > 0 ? (
                        <span
                          className={cn(
                            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-none',
                            active
                              ? 'bg-white text-[#185500] dark:bg-black dark:text-white'
                              : 'bg-white/20 text-white'
                          )}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      )}

      {/* Bottom Logout - Hidden when collapsed */}
      {!collapsed && (
        <div className="space-y-1 px-3 py-3 border-t border-white/[0.08] dark:border-none">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/75 transition-all hover:bg-red-500/20 hover:text-red-400"
          >
            <LogOut className="h-[19px] w-[19px] shrink-0 stroke-[1.75]" />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
