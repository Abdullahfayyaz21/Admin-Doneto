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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Submenu toggle states
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'User Management': true, // Open by default
    'Campaigns': false,
    'Financials': false,
  });

  const toggleMenu = (label: string) => {
    if (collapsed) {
      setCollapsed(false); // Auto expand sidebar if collapsed
    }
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-[hsl(var(--sidebar))] text-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center overflow-hidden h-full py-4">
          <img src="/logo.svg" alt="DONETO" className="h-7 w-auto shrink-0" />
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-thin">
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
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
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
                  'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
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
                <div className="pl-4 pr-1 py-1 space-y-1 border-l border-white/10 ml-5 transition-all">
                  {item.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all',
                          subActive
                            ? 'bg-primary text-white shadow-md'
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

      {/* Bottom */}
      <div className="space-y-1 px-3 py-4 border-t border-white/10">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
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
    </aside>
  );
}
