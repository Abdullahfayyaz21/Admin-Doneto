'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  XCircle,
  FileCheck,
  Building2,
  Lock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerificationStatusType } from '@/hooks/useVerification';

interface VerificationGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: VerificationStatusType;
  rejectionReason?: string | null;
  ngoName?: string | null;
}

export function VerificationGateModal({
  open,
  onOpenChange,
  status,
  rejectionReason,
  ngoName,
}: VerificationGateModalProps) {
  const router = useRouter();

  const handleGoToVerification = () => {
    onOpenChange(false);
    router.push('/settings');
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          title: 'Verification In Progress',
          subtitle: 'Your organization credentials are currently under administrative review',
          badgeText: 'Review Pending',
          badgeVariant: 'secondary' as const,
          badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
          icon: Clock,
          iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
          description:
            'Thank you for submitting your KYC verification. Our compliance and moderation team is auditing your registration documents. Once approved, you will immediately be able to launch and manage fundraising campaigns.',
          ctaText: 'View Verification in Settings',
        };
      case 'REJECTED':
        return {
          title: 'Verification Requires Attention',
          subtitle: 'Your recent KYC submission could not be verified by our compliance team',
          badgeText: 'Action Required',
          badgeVariant: 'destructive' as const,
          badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
          icon: XCircle,
          iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
          description:
            rejectionReason ||
            'Some required verification credentials were incomplete or invalid. Please re-examine your organization details and submit updated documents.',
          ctaText: 'Re-submit Verification Documents',
        };
      case 'UNVERIFIED':
      default:
        return {
          title: 'Account Verification Required',
          subtitle: 'Only verified organizations and partners can launch public fundraising campaigns',
          badgeText: 'Verification Required',
          badgeVariant: 'outline' as const,
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: ShieldAlert,
          iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          description:
            'To protect donors, prevent fraudulent activities, and maintain the highest standard of platform security, Doneto requires all campaign organizers to complete a quick identity and organization verification (KYC).',
          ctaText: 'Start KYC Verification Now',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl">
        {/* Top Glow & Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0a2300] via-[#0e3b01] to-[#185500] p-6 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="absolute right-12 bottom-0 opacity-10 pointer-events-none">
            <Building2 className="h-32 w-32" />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight text-white">
                    {config.title}
                  </DialogTitle>
                </div>
                <p className="text-xs text-emerald-100/80 mt-0.5 max-w-sm leading-relaxed">
                  {config.subtitle}
                </p>
              </div>
            </div>
            <Badge className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide border ${config.badgeClass}`}>
              {config.badgeText}
            </Badge>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status Details / Rejection Box */}
          {status === 'REJECTED' ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" />
                Moderator Feedback
              </div>
              <p className="text-sm text-foreground/90 font-medium leading-relaxed bg-background/60 p-3 rounded-xl border border-rose-500/10">
                {rejectionReason || 'Uploaded documentation could not be verified against the official NGO registry. Please provide updated registration certificates and valid CNIC scans.'}
              </p>
            </div>
          ) : status === 'PENDING' ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                Average Review Time: Under 24 Hours
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our verification team is reviewing the documents submitted for{' '}
                <strong className="text-foreground">{ngoName || 'your organization'}</strong>. You will receive an in-app notification as soon as verification is confirmed.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <Info className="h-4 w-4" />
                Why is verification required?
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {config.description}
              </p>
            </div>
          )}

          {/* Verification Benefits / Trust Pillars */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              What Verification Unlocks
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl border border-border/60 bg-card/60 flex flex-col gap-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Campaign Creation
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Launch unlimited fundraising drives & emergencies.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/60 bg-card/60 flex flex-col gap-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Verified Badge
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Boost donor confidence with platform trust badge.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/60 bg-card/60 flex flex-col gap-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  Direct Payouts
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Request fund withdrawals securely to your bank.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Checklist */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Required Verification Documents (KYC)</span>
              <span className="text-[11px] text-muted-foreground">~3 mins to complete</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Organization Registration Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>National Tax Number (NTN)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>CNIC Front & Back Scans</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Representative Proof of Affiliation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-6 pt-0 flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end border-t border-border/60 bg-muted/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-medium"
          >
            Dismiss
          </Button>
          <Button
            type="button"
            onClick={handleGoToVerification}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-xs font-semibold shadow-md shadow-emerald-900/20 gap-2 h-10 px-5"
          >
            {config.ctaText}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
