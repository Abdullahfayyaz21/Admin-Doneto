'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '@/lib/api';

interface BoostRequest {
  id: number | string;
  campaignId: number | string;
  campaignTitle: string;
  ngoName?: string;
  boostType?: 'Premium' | 'Standard' | 'Flash' | string;
  durationDays?: number;
  price?: number;
  status: 'Pending' | 'Active' | 'Rejected' | 'Expired' | string;
  requestedAt?: string;
  startsAt?: string;
  endsAt?: string;
}

export default function BoostRequestsPage() {
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<BoostRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedReq, setSelectedReq] = useState<BoostRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBoosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fundraising-campaigns/admin/boosts').catch(() => null);
      if (res?.data) {
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list)) {
          setRequests(list.filter((b: any) => b.status === 'Pending' || b.status === 'PENDING'));
          setActiveBoosts(list.filter((b: any) => b.status === 'Active' || b.status === 'ACTIVE'));
        }
      } else {
        setRequests([]);
        setActiveBoosts([]);
      }
    } catch {
      setRequests([]);
      setActiveBoosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoosts();
  }, []);

  // Handle Approve Request
  const handleApprove = async () => {
    if (!selectedReq) return;
    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/admin/boosts/${selectedReq.id}/approve`, {}).catch(() => null);
      
      const now = new Date();
      const ends = new Date();
      ends.setDate(now.getDate() + (selectedReq.durationDays || 7));

      const newActiveBoost: BoostRequest = {
        ...selectedReq,
        status: 'Active',
        startsAt: now.toISOString(),
        endsAt: ends.toISOString()
      };

      setActiveBoosts((prev) => [newActiveBoost, ...prev]);
      setRequests((prev) => prev.filter((r) => r.id !== selectedReq.id));
      
      toast.success(`Boost request for "${selectedReq.campaignTitle}" approved.`);
      setIsApproveOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve boost request');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Reject Request
  const handleReject = async () => {
    if (!selectedReq) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/admin/boosts/${selectedReq.id}/reject`, { reason: rejectionReason.trim() }).catch(() => null);
      setRequests((prev) => prev.filter((r) => r.id !== selectedReq.id));
      toast.success(`Boost request for "${selectedReq.campaignTitle}" was rejected.`);
      setIsRejectOpen(false);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject boost request');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Terminate Active Boost
  const handleTerminate = async () => {
    if (!selectedReq) return;

    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/admin/boosts/${selectedReq.id}/terminate`, {}).catch(() => null);
      setActiveBoosts((prev) => prev.filter((b) => b.id !== selectedReq.id));
      toast.success(`Boost campaign for "${selectedReq.campaignTitle}" terminated.`);
      setIsTerminateOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to terminate boost campaign');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Pricing helper
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'PKR 0';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Boost Requests
          </h1>
          <p className="text-muted-foreground text-sm">
            Review promotion applications and supervise active campaign boosts.
          </p>
        </div>
      </div>

      {/* Grid: Left - Requests Queue, Right - Active Boosts */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* REQUESTS QUEUE */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-yellow-500" /> Pending Applications Queue
            </h2>
            <Badge className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/25 font-semibold text-xs py-0.5 px-2.5">
              Review Awaited
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="p-4 bg-card rounded-2xl space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </Card>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <Card className="bg-card p-8 text-center text-muted-foreground rounded-2xl border border-border/60">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">All applications reviewed</p>
              <p className="text-xs mt-1">No pending campaign boosts in queue.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="bg-card rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300 border border-border/60">
                  <CardHeader className="p-4 bg-muted/40 flex flex-row items-center justify-between pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground block">Ref: #{req.id}</span>
                      <h3 className="font-bold text-foreground text-sm line-clamp-1">{req.campaignTitle}</h3>
                    </div>
                    <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] bg-primary/10 text-primary border-primary/20">
                      {req.boostType || 'Boost'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/80" /> Organization:
                      </span>
                      <span className="font-semibold text-foreground">{req.ngoName || 'Partner NGO'}</span>
                    </div>
                    {req.durationDays && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/80" /> Duration:
                        </span>
                        <span className="font-medium text-foreground">{req.durationDays} Days</span>
                      </div>
                    )}
                    {req.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-muted-foreground/80" /> Rate / Fee:
                        </span>
                        <span className="font-bold text-emerald-600">{formatCurrency(req.price)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                        <Calendar className="h-3 w-3 text-muted-foreground/60" /> Requested:
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(req.requestedAt)}</span>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => { setSelectedReq(req); setIsApproveOpen(true); }}
                        className="flex-1 bg-[#185500] hover:bg-[#1e6b00] text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedReq(req); setIsRejectOpen(true); }}
                        className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 rounded-xl text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE BOOSTS SUPERVISION */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-emerald-500" /> Active Platform Boosts
            </h2>
            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 font-semibold text-xs py-0.5 px-2.5">
              Live Promoted
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="p-4 bg-card rounded-2xl space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </Card>
              ))}
            </div>
          ) : activeBoosts.length === 0 ? (
            <Card className="bg-card p-8 text-center text-muted-foreground rounded-2xl border border-border/60">
              <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No active boosted campaigns</p>
              <p className="text-xs mt-1">Approved promotions will be listed here.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeBoosts.map((boost) => (
                <Card key={boost.id} className="bg-card rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300 border border-border/60">
                  <CardHeader className="p-4 bg-emerald-500/5 flex flex-row items-center justify-between pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-emerald-600 block">ID: #{boost.id}</span>
                      <h3 className="font-bold text-foreground text-sm line-clamp-1">{boost.campaignTitle}</h3>
                    </div>
                    <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      {boost.boostType || 'Active'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/80" /> Beneficiary NGO:
                      </span>
                      <span className="font-semibold text-foreground">{boost.ngoName || 'Verified NGO'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/80" /> Starts:
                      </span>
                      <span className="font-medium text-foreground">{formatDate(boost.startsAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/80" /> Expires:
                      </span>
                      <span className="font-bold text-indigo-500">{formatDate(boost.endsAt)}</span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelectedReq(boost); setIsTerminateOpen(true); }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl text-xs h-8"
                      >
                        Terminate Early
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* APPROVE MODAL */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background border-border text-foreground rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#185500] dark:text-white">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Approve Campaign Boost?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              This will activate priority promotion for <span className="font-semibold text-foreground">&ldquo;{selectedReq?.campaignTitle}&rdquo;</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsApproveOpen(false)}
              className="rounded-xl border border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={submitLoading}
              className="bg-[#185500] hover:bg-[#1e6b00] text-white dark:bg-white dark:text-black rounded-xl shadow-lg flex items-center gap-2"
            >
              {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Activation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background border-border text-foreground rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject Promotion Application
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Decline promotion request for &ldquo;{selectedReq?.campaignTitle}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <Label htmlFor="reject-boost-reason" className="text-xs font-semibold text-muted-foreground">
              Decline Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reject-boost-reason"
              placeholder="Explain why this boost request cannot be accommodated..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="bg-muted/50 border-border text-xs rounded-xl"
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRejectOpen(false)}
              className="rounded-xl border border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              disabled={submitLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg flex items-center gap-2"
            >
              {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Decline Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TERMINATE MODAL */}
      <Dialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background border-border text-foreground rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Terminate Active Boost
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Are you sure you want to stop active promotion for <span className="font-semibold text-foreground">&ldquo;{selectedReq?.campaignTitle}&rdquo;</span> immediately?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsTerminateOpen(false)}
              className="rounded-xl border border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTerminate}
              disabled={submitLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg flex items-center gap-2"
            >
              {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Termination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
