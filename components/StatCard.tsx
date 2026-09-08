'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  secondary?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  href?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'up',
  description,
  secondary,
  icon: Icon,
  iconColor,
  iconBg,
  href,
}: StatCardProps) {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href) {
      return (
        <Link href={href} className="block group select-none">
          {children}
        </Link>
      );
    }
    return <div className="group select-none">{children}</div>;
  };

  return (
    <CardWrapper>
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all duration-200',
          'hover:shadow-md hover:border-border hover:-translate-y-0.5',
          href && 'cursor-pointer'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
              iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex items-center gap-2 flex-wrap">
            {change && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold',
                  trend === 'up' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                  trend === 'down' && 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
                  trend === 'neutral' && 'bg-muted text-muted-foreground border border-border'
                )}
              >
                {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                {trend === 'neutral' && <Minus className="h-3 w-3" />}
                {change}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-muted-foreground truncate">{description}</span>
            )}
            {secondary && (
              <span className="text-[11px] font-medium text-muted-foreground truncate">{secondary}</span>
            )}
          </div>

          {href && (
            <span className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </Card>
    </CardWrapper>
  );
}
