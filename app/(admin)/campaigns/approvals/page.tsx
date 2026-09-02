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
  HeartHandshake
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
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/brand/states';

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

export default function ApprovalsQueuePage() {
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<PendingCampaign | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'Approve' | 'Reject'>('Approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchPendingCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/fundraising-campaigns/admin/pending');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Failed to fetch pending campaigns:', error);
      toast.error('Failed to load pending campaign approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCampaigns();
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
      await api.patch(`/fundraising-campaigns/${selectedCampaign.id}/review`, {
        approved: isApproved,
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
      fetchPendingCampaigns();
    } catch (error: any) {
      console.error('Review error:', error);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Approvals Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, inspect, and approve pending fundraising campaign submissions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPendingCampaigns}
          className="rounded-xl border-border self-start md:self-auto"
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          Refresh Queue
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Campaigns awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requested Goal
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              PKR {totalPendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sum of all pending target funds</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Review Status
            </CardTitle>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {campaigns.length === 0 ? 'All Clear' : 'Action Required'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaigns.length === 0 ? 'Zero backlogs in queue' : 'Campaigns need moderation'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none overflow-hidden">
        <div className="pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
            />
          </div>
          <div className="text-xs text-muted-foreground self-center">
            Showing {filteredCampaigns.length} pending campaigns
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No Pending Approvals</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              All campaign submissions have been reviewed and processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campaign</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target Goal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((campaign) => (
                  <TableRow key={campaign.id} className="group transition-colors">
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
                          <p className="font-semibold text-sm text-foreground truncate max-w-[220px]">
                            {campaign.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {campaign.beneficiaryName ? `For: ${campaign.beneficiaryName}` : 'Fundraiser'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground truncate max-w-[150px]">
                            {campaign.createdBy?.ngoName || campaign.createdBy?.name || 'NGO Owner'}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {campaign.createdBy?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg text-xs font-normal">
                        {campaign.category?.name || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm text-foreground">
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
                          className="h-8 rounded-lg px-2 text-xs"
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
                          className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 text-xs shadow-sm"
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
                          className="h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40 px-2.5 text-xs"
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
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-lg"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Campaign Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-lg text-amber-500 bg-amber-500/10 border-amber-500/20">
                    Pending Approval
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Submitted on {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  {selectedCampaign.title}
                </DialogTitle>
                <DialogDescription>
                  Category: {selectedCampaign.category?.name || 'General'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {selectedCampaign.coverImageUrl && (
                  <div className="h-52 w-full rounded-xl overflow-hidden border border-border bg-muted">
                    <img
                      src={selectedCampaign.coverImageUrl}
                      alt={selectedCampaign.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground">Requested Target Goal</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      PKR {Number(selectedCampaign.targetAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground">Beneficiary Name</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {selectedCampaign.beneficiaryName || 'Direct Beneficiary'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">
                    NGO / Organization Details
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedCampaign.createdBy?.ngoName || selectedCampaign.createdBy?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedCampaign.createdBy?.email}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Campaign Description & Story
                  </h4>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                    {selectedCampaign.story || selectedCampaign.description || 'No story details provided.'}
                  </div>
                </div>

                {selectedCampaign.beneficiaryStory && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Beneficiary Background
                    </h4>
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                      {selectedCampaign.beneficiaryStory}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setReviewAction('Approve');
                      setIsReviewOpen(true);
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReviewAction('Reject');
                      setRejectionReason('');
                      setIsReviewOpen(true);
                    }}
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {reviewAction === 'Approve' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Approve Campaign
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Reject Campaign
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'Approve'
                ? `Are you sure you want to approve "${selectedCampaign?.title}"? It will become active and accept public donations immediately.`
                : `Specify the reason for rejecting "${selectedCampaign?.title}". The NGO creator will be notified.`}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === 'Reject' && (
            <div className="py-2 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Rejection Reason / Required Changes *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Incomplete documentation, unclear beneficiary details..."
                className="w-full rounded-xl border border-input bg-muted/40 p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={isSubmitting}
              className={
                reviewAction === 'Approve'
                  ? 'rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'rounded-xl bg-red-600 hover:bg-red-700 text-white'
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
