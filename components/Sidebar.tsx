'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  Heart,
  DollarSign,
  Flag,
  Sparkles,
  UserCheck,
  Building2,
  FileCheck,
  Filter,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import Cookies from 'js-cookie';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

interface SubNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'User Management',
    icon: Users,
    subItems: [
      { label: 'All Users', href: '/users', icon: Users },
      { label: 'NGOs', href: '/users/ngos', icon: Building2 },
      { label: 'Donors', href: '/users/donors', icon: UserCheck },
      { label: 'KYC Requests', href: '/users/kyc', icon: FileCheck },
      { label: 'KYC Categories', href: '/users/kyc-categories', icon: Layers },
    ],
  },
  {
    label: 'Campaigns',
    icon: Heart,
    subItems: [
      { label: 'All Campaigns', href: '/campaigns', icon: Heart },
      { label: 'Categories', href: '/campaigns/categories', icon: Filter },
      { label: 'Reported Campaigns', href: '/campaigns/reports', icon: Flag },
      { label: 'Boost Requests', href: '/campaigns/boosts', icon: Sparkles },
    ],
  },
  {
    label: 'Financials',
    icon: DollarSign,
    subItems: [
      { label: 'Donations', href: '/financials/donations', icon: DollarSign },
      { label: 'Withdrawal Requests', href: '/financials/withdrawals', icon: ShieldCheck },
    ],
  },
];

const bottomItems = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  initialCollapsed?: boolean;
}

export function Sidebar({ initialCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Submenu toggle states
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'User Management': true, // Open by default
    'Campaigns': false,
    'Financials': false,
  });

  const toggleMenu = (label: string) => {
    if (collapsed) {
      setCollapsed(false); // Auto expand sidebar if collapsed
      Cookies.set('sidebar_collapsed', 'false', { expires: 365 });
    }
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col text-white transition-all duration-300',
        collapsed ? 'w-44 bg-transparent shadow-none' : 'w-64 bg-[hsl(var(--sidebar))]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'relative flex h-16 items-center px-4 transition-all duration-300',
        collapsed ? 'border-none justify-center' : 'border-b border-white/10 justify-between'
      )}>
        <div className="relative w-[115px] h-10 flex items-center justify-center group/logo">
          <Link
            href="/dashboard"
            className="transition-opacity duration-200 group-hover/logo:opacity-0 flex items-center justify-center h-full"
          >
            <img
              src={collapsed && mounted && resolvedTheme === 'light' ? '/logo-green.svg' : '/logo.svg'}
              alt="DONETO"
              className="h-7 w-auto shrink-0"
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
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Nav */}
      {!collapsed && (
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 no-scrollbar">
          {!collapsed && (
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Menu
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            
            // If no subItems, render simple Link
            if (!item.subItems) {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1',
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            }

            // Expandable Submenu Group
            const hasActiveSub = item.subItems.some((sub) => pathname === sub.href);
            const isOpen = openMenus[item.label];

            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-0.5',
                    hasActiveSub
                      ? 'bg-white/5 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5 shrink-0 transition-colors', hasActiveSub && 'text-primary')} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    isOpen ? (
                      <ChevronDown className="h-4 w-4 text-white/40" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-white/40" />
                    )
                  )}
                </button>
                
                {/* Sub-items */}
                {!collapsed && isOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-white/10 ml-5 transition-all animate-in fade-in-50 slide-in-from-top-1 duration-150 ease-out">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200 hover:translate-x-1',
                            subActive
                              ? 'bg-primary text-white shadow-md scale-[1.02]'
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <SubIcon className="h-4 w-4 shrink-0" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Bottom */}
      {!collapsed && (
        <div className="space-y-1 px-3 py-4 border-t border-white/10">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1',
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-red-500/20 hover:text-red-400"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
