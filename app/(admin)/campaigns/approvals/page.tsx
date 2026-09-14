'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  HeartHandshake,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { ApiConstants } from '@/lib/api-constants';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/brand/states';
import { broadcastModerationUpdate, subscribeToModerationUpdates } from '@/lib/realtime';

interface PendingCampaign {
  id: string;
  title: string;
  description: string;
  story?: string;
  targetAmount: string | number;
  collectedAmount?: string | number;
  category?: { id: number; name: string };
  createdBy?: { id: string; name: string; email: string; ngoName?: string };
  coverImageUrl?: string;
  beneficiaryName?: string;
  beneficiaryStory?: string;
  createdAt: string;
  status: string;
  documentUrls?: string[];
}

const PRESET_REJECTION_REASONS = [
  'Incomplete supporting documentation for beneficiary audit.',
  'Target goal exceeds verified organizational capacity without justification.',
  'Unverifiable beneficiary contact details or identity documents.',
  'Campaign narrative lacks verifiable details or transparency.',
  'Submitted media assets do not comply with platform guidelines.',
];

export default function ApprovalsQueuePage() {
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<PendingCampaign | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'Approve' | 'Reject'>('Approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchPendingCampaigns = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsSyncing(true);

      let res;
      try {
        res = await api.get(ApiConstants.fundraisingCampaigns, {
          params: { approvalStatus: 'Pending' },
        });
      } catch (fetchErr) {
        res = await api.get('/fundraising-campaigns/admin/pending');
      }
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
      setLastUpdated(new Date());
    } catch (error) {
      if (!isBackground) {
        toast.error('Failed to load pending campaign approvals');
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCampaigns();

    // Auto-polling every 15s in background
    const interval = setInterval(() => {
      fetchPendingCampaigns(true);
    }, 15000);

    // Cross-tab and window event listener
    const unsubscribe = subscribeToModerationUpdates((type) => {
      if (!type || type === 'approvals' || type === 'campaigns' || type === 'all') {
        fetchPendingCampaigns(true);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchPendingCampaigns]);

  const handleReview = async () => {
    if (!selectedCampaign) return;
    if (reviewAction === 'Reject' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }

    try {
      setIsSubmitting(true);
      const isApproved = reviewAction === 'Approve';
      await api.patch(ApiConstants.fundraisingCampaignById(selectedCampaign.id), {
        approvalStatus: isApproved ? 'Approved' : 'Rejected',
        campaignStatus: isApproved ? 'Active' : 'Paused',
        rejectionReason: !isApproved ? rejectionReason.trim() : undefined,
      });

      toast.success(
        isApproved
          ? `Campaign "${selectedCampaign.title}" has been approved!`
          : `Campaign "${selectedCampaign.title}" has been rejected.`
      );

      setIsReviewOpen(false);
      setIsDetailOpen(false);
      setSelectedCampaign(null);
      setRejectionReason('');

      // Broadcast update to sync sidebar badge, dashboard, and other tabs in real-time
      broadcastModerationUpdate('approvals');
      fetchPendingCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(term) ||
      c.category?.name?.toLowerCase().includes(term) ||
      c.createdBy?.ngoName?.toLowerCase().includes(term) ||
      c.createdBy?.name?.toLowerCase().includes(term) ||
      c.beneficiaryName?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage) || 1;
  const paginatedList = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPendingAmount = campaigns.reduce(
    (acc, curr) => acc + (Number(curr.targetAmount) || 0),
    0
  );

  const distinctNGOs = new Set(
    campaigns.map((c) => c.createdBy?.ngoName || c.createdBy?.id).filter(Boolean)
  ).size;

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Approvals Queue
            </h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, inspect, and approve pending fundraising campaign submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPendingCampaigns(false)}
            disabled={loading || isSyncing}
            className="rounded-xl border-border h-9 px-3 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing || loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Pending Approvals</p>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{campaigns.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Requires compliance decision</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Requested Capital</p>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            PKR {totalPendingAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total across pending queue</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Submitting NGOs</p>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{distinctNGOs}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Unique verified entities</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Audit Status</p>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {campaigns.length === 0 ? 'Clear' : 'Pending'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, NGO, or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-xl border border-input bg-muted/30 pl-9 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
          <div className="text-xs text-muted-foreground self-center">
            Showing <span className="font-semibold text-foreground">{filteredCampaigns.length}</span> pending campaign{filteredCampaigns.length === 1 ? '' : 's'}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Approvals Queue is Clear</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              All campaign submissions have been audited and processed. New submissions will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="text-xs font-semibold">Campaign</TableHead>
                  <TableHead className="text-xs font-semibold">Submitted By</TableHead>
                  <TableHead className="text-xs font-semibold">Category</TableHead>
                  <TableHead className="text-xs font-semibold">Target Goal</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((campaign) => (
                  <TableRow key={campaign.id} className="group transition-colors hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center">
                          {campaign.coverImageUrl ? (
                            <img
                              src={campaign.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate max-w-[220px]">
                            {campaign.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                            {campaign.beneficiaryName ? `Beneficiary: ${campaign.beneficiaryName}` : 'General Fundraiser'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                              {campaign.createdBy?.ngoName || campaign.createdBy?.name || 'NGO Owner'}
                            </p>
                            <span title="Verified Organizer" className="inline-flex items-center">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {campaign.createdBy?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg text-[11px] font-medium bg-muted/30">
                        {campaign.category?.name || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs text-foreground">
                        PKR {Number(campaign.targetAmount || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 rounded-xl px-2.5 text-xs font-medium hover:bg-muted"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          Inspect
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setReviewAction('Approve');
                            setIsReviewOpen(true);
                          }}
                          className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 text-xs font-semibold shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setReviewAction('Reject');
                            setRejectionReason('');
                            setIsReviewOpen(true);
                          }}
                          className="h-8 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40 px-3 text-xs font-medium"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredCampaigns.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-xl text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-xl text-xs"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Campaign Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-lg text-amber-600 bg-amber-500/10 border-amber-500/20 text-xs">
                    Pending Approval
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Submitted on {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold mt-2 text-foreground">
                  {selectedCampaign.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Category: {selectedCampaign.category?.name || 'General'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {selectedCampaign.coverImageUrl && (
                  <div className="h-48 w-full rounded-xl overflow-hidden border border-border bg-muted">
                    <img
                      src={selectedCampaign.coverImageUrl}
                      alt={selectedCampaign.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium">Requested Target Goal</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      PKR {Number(selectedCampaign.targetAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground font-medium">Beneficiary</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {selectedCampaign.beneficiaryName || 'Direct Beneficiary'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      NGO / Organization Details
                    </p>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Verified Organizer
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedCampaign.createdBy?.ngoName || selectedCampaign.createdBy?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedCampaign.createdBy?.email}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Campaign Description & Story
                  </h4>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs leading-relaxed whitespace-pre-line text-foreground/90">
                    {selectedCampaign.story || selectedCampaign.description || 'No story details provided.'}
                  </div>
                </div>

                {selectedCampaign.beneficiaryStory && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Beneficiary Background
                    </h4>
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs leading-relaxed whitespace-pre-line text-foreground/90">
                      {selectedCampaign.beneficiaryStory}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setReviewAction('Approve');
                      setIsReviewOpen(true);
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve Campaign
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReviewAction('Reject');
                      setRejectionReason('');
                      setIsReviewOpen(true);
                    }}
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Action Confirm Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              {reviewAction === 'Approve' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Approve Campaign Submission
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Campaign Submission
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {reviewAction === 'Approve'
                ? `Approving "${selectedCampaign?.title}" makes it active and publicly listed for donations.`
                : `Specify the reason for rejecting "${selectedCampaign?.title}". The submitting organization will be notified.`}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === 'Reject' && (
            <div className="py-2 space-y-3">
              <label className="text-xs font-semibold text-foreground">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify requirements or why this campaign cannot be approved..."
                className="w-full rounded-xl border border-input bg-muted/30 p-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />

              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Quick Presets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-left transition-colors"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={isSubmitting}
              className={
                reviewAction === 'Approve'
                  ? 'rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold'
                  : 'rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold'
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Confirm {reviewAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
