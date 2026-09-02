'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { LogoLoader } from './logo-loader';

/**
 * Standardized Brand Loading State
 * Used for section data loading, table fetches, and interactive panels.
 */
export function LoadingState({
  text = 'Loading…',
  className,
  size = 'md',
  heartOnly = false,
}: {
  text?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  heartOnly?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl bg-card px-6 py-14 text-center shadow-xs',
        className
      )}
    >
      <LogoLoader size={size} heartOnly={heartOnly} />
      {text && (
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );
}

/**
 * Multi-element Card Skeleton for grid feeds
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden p-0 rounded-2xl shadow-xs', className)}>
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-4 w-14 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-4 w-20 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Table Loading Skeleton for Admin Data Tables
 */
export function TableSkeleton({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full space-y-3 p-4', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`th-${i}`} className="h-4 flex-1 rounded-lg" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={`tr-${rIdx}`} className="flex items-center justify-between gap-4 py-2.5">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton
              key={`td-${rIdx}-${cIdx}`}
              className={cn('h-4 flex-1 rounded-lg', cIdx === 0 ? 'h-6' : '')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Full Page Route Transition Loader
 */
export function PageLoader({
  text = 'Loading Doneto…',
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-[70vh] w-full flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <LogoLoader size="lg" />
      {text && (
        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );
}
