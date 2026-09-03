'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Landmark
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
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/brand/states';

interface WithdrawalItem {
  id: number;
  campaignId: string;
  campaignTitle?: string;
  requestedById: string;
  requestedByName?: string;
  requestedByEmail?: string;
  requestedByNgoName?: string;
  amount: string | number;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewDate?: string;
}

export default function WithdrawalRequestsPage() {
  const [requests, setRequests] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [selectedReq, setSelectedReq] = useState<WithdrawalItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected'>('Approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/fundraising-campaigns/admin/withdraw-requests');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleReview = async () => {
    if (!selectedReq) return;
    if (reviewStatus === 'Rejected' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejecting this payout request');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.patch(`/fundraising-campaigns/withdraw-requests/${selectedReq.id}/review`, {
        status: reviewStatus,
        rejectionReason: reviewStatus === 'Rejected' ? rejectionReason.trim() : undefined,
      });

      toast.success(
        reviewStatus === 'Approved'
          ? `Withdrawal of PKR ${Number(selectedReq.amount).toLocaleString()} approved!`
          : `Withdrawal request #${selectedReq.id} rejected.`
      );

      setIsReviewOpen(false);
      setIsDetailOpen(false);
      setSelectedReq(null);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Review withdrawal error:', error);
      toast.error(error.response?.data?.message || 'Failed to review withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    const term = search.toLowerCase();
    const matchSearch =
      r.campaignTitle?.toLowerCase().includes(term) ||
      r.bankName?.toLowerCase().includes(term) ||
      r.accountTitle?.toLowerCase().includes(term) ||
      r.accountNumber?.includes(term) ||
      r.requestedByName?.toLowerCase().includes(term) ||
      r.requestedByNgoName?.toLowerCase().includes(term);

    if (!matchSearch) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPendingAmount = requests
    .filter((r) => r.status === 'Pending')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalDisbursed = requests
    .filter((r) => r.status === 'Approved')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Withdrawal & Payout Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review banking credentials, approve disbursements, and manage NGO payouts.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchWithdrawals}
          className="rounded-xl border-border self-start md:self-auto"
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          Refresh Payouts
        </Button>
      </div>



      {/* Main Table */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none overflow-hidden">
        <div className="pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by campaign, bank, or NGO..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {status === 'ALL' ? 'All Statuses' : status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-3">
              <Wallet className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No Withdrawal Requests</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              There are no disbursement requests matching your selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campaign & NGO</TableHead>
                  <TableHead>Amount (PKR)</TableHead>
                  <TableHead>Bank Credentials</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((req) => (
                  <TableRow key={req.id} className="group transition-colors">
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                          {req.campaignTitle || `Campaign #${req.campaignId.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[150px]">
                            {req.requestedByNgoName || req.requestedByName || 'NGO Owner'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-sm text-foreground">
                        PKR {Number(req.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                          <Landmark className="h-3.5 w-3.5 text-primary" />
                          <span>{req.bankName}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Title: {req.accountTitle}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Acc: {req.accountNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-lg text-xs font-medium',
                          req.status === 'Approved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                          req.status === 'Pending' && 'border-amber-500/30 bg-amber-500/10 text-amber-600',
                          req.status === 'Rejected' && 'border-red-500/30 bg-red-500/10 text-red-600'
                        )}
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReq(req);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 rounded-lg px-2 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          Details
                        </Button>
                        {req.status === 'Pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReq(req);
                                setReviewStatus('Approved');
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
                                setSelectedReq(req);
                                setReviewStatus('Rejected');
                                setRejectionReason('');
                                setIsReviewOpen(true);
                              }}
                              className="h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40 px-2.5 text-xs"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > itemsPerPage && (
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

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          {selectedReq && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-lg text-xs font-medium',
                      selectedReq.status === 'Approved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                      selectedReq.status === 'Pending' && 'border-amber-500/30 bg-amber-500/10 text-amber-600',
                      selectedReq.status === 'Rejected' && 'border-red-500/30 bg-red-500/10 text-red-600'
                    )}
                  >
                    {selectedReq.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Requested on {new Date(selectedReq.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  PKR {Number(selectedReq.amount).toLocaleString()}
                </DialogTitle>
                <DialogDescription>
                  Campaign: {selectedReq.campaignTitle || selectedReq.campaignId}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1.5">
                  <p className="font-semibold uppercase text-muted-foreground text-[10px] tracking-wider">
                    Bank Payout Details
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <span className="font-bold text-foreground">{selectedReq.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Title:</span>
                    <span className="font-bold text-foreground">{selectedReq.accountTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account / IBAN:</span>
                    <span className="font-mono font-bold text-foreground">{selectedReq.accountNumber}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                  <p className="font-semibold uppercase text-muted-foreground text-[10px] tracking-wider">
                    Requester Organization
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedReq.requestedByNgoName || selectedReq.requestedByName}
                  </p>
                  <p className="text-muted-foreground">{selectedReq.requestedByEmail}</p>
                </div>

                {selectedReq.rejectionReason && (
                  <div className="p-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/20 text-red-700 dark:text-red-400 space-y-1">
                    <p className="font-semibold text-[10px] uppercase">Rejection Reason</p>
                    <p>{selectedReq.rejectionReason}</p>
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
                {selectedReq.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setReviewStatus('Approved');
                        setIsReviewOpen(true);
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve Payout
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReviewStatus('Rejected');
                        setRejectionReason('');
                        setIsReviewOpen(true);
                      }}
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Reject
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Confirm Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {reviewStatus === 'Approved' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Authorize Payout Disbursement
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Reject Withdrawal Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {reviewStatus === 'Approved'
                ? `Confirm disbursement of PKR ${Number(selectedReq?.amount || 0).toLocaleString()} to ${selectedReq?.accountTitle} (${selectedReq?.bankName})?`
                : `Specify why this withdrawal request cannot be processed:`}
            </DialogDescription>
          </DialogHeader>

          {reviewStatus === 'Rejected' && (
            <div className="py-2 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Account number mismatch, KYC pending renewal..."
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
                reviewStatus === 'Approved'
                  ? 'rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'rounded-xl bg-red-600 hover:bg-red-700 text-white'
              }
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm {reviewStatus}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
