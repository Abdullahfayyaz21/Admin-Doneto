import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  iconColor,
  iconBg,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden p-6 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            iconBg
          )}
        >
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-xs font-semibold',
            trend === 'up'
              ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
          )}
        >
          {trend === 'up' ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {change}
        </span>
        <span className="text-xs text-muted-foreground">vs last month</span>
      </div>
    </Card>
  );
}
