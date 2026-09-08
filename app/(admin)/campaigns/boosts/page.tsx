'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { broadcastModerationUpdate, subscribeToModerationUpdates } from '@/lib/realtime';

interface BoostRequest {
  id: number | string;
  campaignId: number | string;
  campaignTitle: string;
  ngoName?: string;
  boostType?: 'Premium' | 'Standard' | 'Flash' | string;
  durationDays?: number;
  price?: number;
  status: 'Pending' | 'Active' | 'Rejected' | 'Expired' | 'Cancelled' | string;
  requestedAt?: string;
  startsAt?: string;
  endsAt?: string;
}

export default function BoostRequestsPage() {
  const [allBoosts, setAllBoosts] = useState<BoostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'all'>('pending');

  // Modals state
  const [selectedReq, setSelectedReq] = useState<BoostRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBoosts = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/fundraising-campaigns/admin/boosts');
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setAllBoosts(list);
      } else {
        setAllBoosts([]);
      }
    } catch (error) {
      console.error('Failed to fetch boosts:', error);
      if (!isBackground) {
        setAllBoosts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBoosts();

    const interval = setInterval(() => {
      fetchBoosts(true);
    }, 15000);

    const unsubscribe = subscribeToModerationUpdates(() => {
      fetchBoosts(true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchBoosts]);

  // Derived subsets
  const pendingRequests = useMemo(
    () => allBoosts.filter((b) => b.status?.toUpperCase() === 'PENDING'),
    [allBoosts]
  );

  const activeBoosts = useMemo(
    () => allBoosts.filter((b) => b.status?.toUpperCase() === 'ACTIVE'),
    [allBoosts]
  );

  // Filtered by active tab and search query
  const displayedBoosts = useMemo(() => {
    let source = allBoosts;
    if (activeTab === 'pending') source = pendingRequests;
    else if (activeTab === 'active') source = activeBoosts;

    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase().trim();
    return source.filter(
      (b) =>
        b.campaignTitle?.toLowerCase().includes(q) ||
        b.ngoName?.toLowerCase().includes(q) ||
        String(b.id).includes(q)
    );
  }, [allBoosts, pendingRequests, activeBoosts, activeTab, searchQuery]);

  // Handle Approve Request
  const handleApprove = async () => {
    if (!selectedReq) return;
    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/admin/boosts/${selectedReq.id}/approve`, {});
      toast.success(`Boost for "${selectedReq.campaignTitle}" approved & activated!`);
      setIsApproveOpen(false);
      broadcastModerationUpdate('campaigns');
      fetchBoosts(true);
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
      toast.error('Please specify a rejection reason.');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/admin/boosts/${selectedReq.id}/reject`, {
        reason: rejectionReason.trim(),
      });
      toast.success(`Boost application for "${selectedReq.campaignTitle}" rejected.`);
      setIsRejectOpen(false);
      setRejectionReason('');
      broadcastModerationUpdate('campaigns');
      fetchBoosts(true);
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
      await api.patch(`/fundraising-campaigns/admin/boosts/${selectedReq.id}/terminate`, {});
      toast.success(`Boost promotion for "${selectedReq.campaignTitle}" terminated.`);
      setIsTerminateOpen(false);
      broadcastModerationUpdate('campaigns');
      fetchBoosts(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to terminate boost');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <Zap className="mr-1 h-3 w-3 inline" /> Active Boost
        </Badge>
      );
    }
    if (s === 'PENDING') {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
          <Clock className="mr-1 h-3 w-3 inline" /> Review Pending
        </Badge>
      );
    }
    if (s === 'EXPIRED') {
      return (
        <Badge variant="outline" className="text-muted-foreground text-xs">
          Completed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/10 text-xs">
        Declined
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boost Requests</h1>
          <p className="text-muted-foreground text-sm">
            Review promotion applications and manage elevated visibility campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBoosts(true)}
            disabled={refreshing}
            className="rounded-xl border-border/60 h-9 gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="border-b border-border/60 p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-muted/10">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full sm:w-auto"
          >
            <TabsList className="rounded-xl bg-muted/50 p-1 border border-border/40">
              <TabsTrigger
                value="pending"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
              >
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
              >
                Active ({activeBoosts.length})
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
              >
                All Records ({allBoosts.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaign or NGO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs rounded-xl border-border/60 bg-background"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : displayedBoosts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground mb-3">
                {activeTab === 'pending' ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <Zap className="h-6 w-6 text-muted-foreground/50" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {activeTab === 'pending'
                  ? 'Queue is empty'
                  : activeTab === 'active'
                  ? 'No active boosts'
                  : 'No boost records found'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'All promotional campaign applications have been reviewed.'
                  : 'Approved boost requests will appear here when active.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs py-3.5 pl-6">Campaign Details</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Organization</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Schedule & Duration</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Status</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedBoosts.map((boost) => {
                  const isPending = boost.status?.toUpperCase() === 'PENDING';
                  const isActive = boost.status?.toUpperCase() === 'ACTIVE';

                  return (
                    <TableRow key={boost.id} className="border-border/60 hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground line-clamp-1 max-w-[280px]">
                            {boost.campaignTitle}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              Ref #{boost.id}
                            </span>
                            <span className="text-muted-foreground/40">•</span>
                            <Badge variant="outline" className="text-[10px] font-medium py-0 px-1.5 h-4">
                              {boost.boostType || 'Priority'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">{boost.ngoName || 'Partner NGO'}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="space-y-0.5 text-xs">
                          {boost.startsAt ? (
                            <p className="text-foreground font-medium">
                              {formatDate(boost.startsAt)} — {formatDate(boost.endsAt)}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              Requested {formatDate(boost.requestedAt)}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {boost.durationDays ? `${boost.durationDays} Days duration` : 'Standard Run'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        {getStatusBadge(boost.status)}
                      </TableCell>

                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedReq(boost);
                                  setIsApproveOpen(true);
                                }}
                                className="h-8 rounded-xl bg-[#185500] hover:bg-[#1e6b00] text-white text-xs font-semibold px-3 shadow-xs"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReq(boost);
                                  setIsRejectOpen(true);
                                }}
                                className="h-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 text-xs px-3"
                              >
                                Decline
                              </Button>
                            </>
                          )}

                          {isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReq(boost);
                                setIsTerminateOpen(true);
                              }}
                              className="h-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 text-xs px-3"
                            >
                              Terminate
                            </Button>
                          )}

                          {!isPending && !isActive && (
                            <span className="text-xs text-muted-foreground italic">
                              Resolved
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* APPROVE MODAL */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-[#185500] dark:text-emerald-400">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Approve Campaign Boost
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1">
              Activate priority promotion for <span className="font-semibold text-foreground">&ldquo;{selectedReq?.campaignTitle}&rdquo;</span>. This campaign will receive elevated placement across Doneto search and feeds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-border/60 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={submitLoading}
              className="bg-[#185500] hover:bg-[#1e6b00] text-white rounded-xl text-xs font-semibold h-9 flex items-center gap-1.5"
            >
              {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Activation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              Decline Promotion Request
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1">
              Decline the boost application for &ldquo;{selectedReq?.campaignTitle}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="reject-boost-reason" className="text-xs font-medium text-foreground">
              Decline Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reject-boost-reason"
              placeholder="Provide a clear explanation for the applicant..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="text-xs rounded-xl border-border/60"
              required
            />
          </div>
          <DialogFooter className="gap-2 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReject}
              disabled={submitLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold h-9 flex items-center gap-1.5"
            >
              {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Decline Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TERMINATE MODAL */}
      <Dialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Terminate Active Boost
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1">
              Are you sure you want to stop priority promotion for <span className="font-semibold text-foreground">&ldquo;{selectedReq?.campaignTitle}&rdquo;</span> immediately?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-border/60 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTerminateOpen(false)}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTerminate}
              disabled={submitLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold h-9 flex items-center gap-1.5"
            >
              {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Termination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
