'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Clock,
  XCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerificationStatusType } from '@/hooks/useVerification';

interface VerificationBannerProps {
  status: VerificationStatusType;
  rejectionReason?: string | null;
  onOpenGateModal?: () => void;
  className?: string;
}

export function VerificationBanner({
  status,
  rejectionReason,
  onOpenGateModal,
  className = '',
}: VerificationBannerProps) {
  // If verified, do not render banner
  if (status === 'VERIFIED') return null;

  if (status === 'PENDING') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 text-card-foreground shadow-sm ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-foreground">
                  Verification Application Under Review
                </h3>
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                  KYC Pending
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                Your submitted documents are currently being reviewed by Doneto moderators. Campaign creation will unlock automatically upon approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenGateModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenGateModal}
                className="rounded-xl border-amber-500/30 hover:bg-amber-500/10 text-xs font-semibold h-9"
              >
                Learn More
              </Button>
            )}
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold gap-1.5 h-9"
            >
              <Link href="/settings">
                View Status in Settings <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-4 sm:p-5 text-card-foreground shadow-sm ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-foreground">
                  Verification Application Action Needed
                </h3>
                <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-semibold">
                  Action Required
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                {rejectionReason
                  ? `Feedback: ${rejectionReason}`
                  : 'Your submitted verification documents could not be approved. Please re-submit your verification to unlock campaign creation.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenGateModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenGateModal}
                className="rounded-xl border-rose-500/30 hover:bg-rose-500/10 text-xs font-semibold h-9"
              >
                Review Details
              </Button>
            )}
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5 h-9"
            >
              <Link href="/settings">
                Re-submit Documents <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: UNVERIFIED
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#185500]/5 to-transparent p-4 sm:p-5 text-card-foreground shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-foreground">
                Identity & Organization Verification Required
              </h3>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                Unverified Organization
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              Only verified accounts can create and publish fundraising campaigns. Complete our quick KYC verification to unlock campaign creation and build donor trust.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenGateModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenGateModal}
              className="rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 text-xs font-semibold h-9"
            >
              Why Verify?
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-xs font-semibold gap-1.5 h-9 shadow-sm"
          >
            <Link href="/settings">
              Complete KYC <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
