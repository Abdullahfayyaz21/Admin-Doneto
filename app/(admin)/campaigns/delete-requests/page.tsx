'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Trash2,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText
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

interface DeleteRequestCampaign {
  id: string;
  title: string;
  description?: string;
  deleteReason?: string;
  collectedAmount?: string | number;
  targetAmount?: string | number;
  donorCount?: number;
  createdBy?: { id: string; name: string; email: string; ngoName?: string };
  coverImageUrl?: string;
  createdAt: string;
  deleteRequestedAt?: string;
  status: string;
}

export default function DeleteRequestsPage() {
  const [requests, setRequests] = useState<DeleteRequestCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<DeleteRequestCampaign | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<'Approve' | 'Reject'>('Approve');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchDeleteRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/fundraising-campaigns/admin/delete-requests');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch delete requests:', error);
      toast.error('Failed to load campaign deletion requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeleteRequests();
  }, [fetchDeleteRequests]);

  const handleReviewAction = async () => {
    if (!selectedCampaign) return;

    try {
      setIsSubmitting(true);
      const isApprove = actionType === 'Approve';
      await api.patch(
        `/fundraising-campaigns/admin/delete-requests/${selectedCampaign.id}/review`,
        { approve: isApprove }
      );

      toast.success(
        isApprove
          ? `Campaign deletion approved and processed.`
          : `Campaign deletion request rejected.`
      );

      setIsConfirmOpen(false);
      setSelectedCampaign(null);
      fetchDeleteRequests();
    } catch (error: any) {
      console.error('Delete request review error:', error);
      toast.error(error.response?.data?.message || 'Failed to review request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(term) ||
      r.deleteReason?.toLowerCase().includes(term) ||
      r.createdBy?.ngoName?.toLowerCase().includes(term) ||
      r.createdBy?.name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Campaign Deletion Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review requests submitted by NGOs/recipients asking to cancel or delete their campaigns.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchDeleteRequests}
          className="rounded-xl border-border self-start md:self-auto"
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Deletions
            </CardTitle>
            <div className="rounded-xl bg-red-500/10 p-2.5 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{requests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Campaigns requested for removal</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected Funds Impact
            </CardTitle>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              PKR{' '}
              {requests
                .reduce((acc, c) => acc + (Number(c.collectedAmount) || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total donations in requested campaigns</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Safety Guard
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Admin Protected</div>
            <p className="text-xs text-muted-foreground mt-1">Deletion requires admin authorization</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none overflow-hidden">
        <div className="pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, NGO, or reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
            />
          </div>
          <div className="text-xs text-muted-foreground self-center">
            {filtered.length} requests in queue
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500 mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No Deletion Requests</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              There are currently no campaigns requesting deletion or cancellation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campaign</TableHead>
                  <TableHead>Requester NGO</TableHead>
                  <TableHead>Deletion Reason</TableHead>
                  <TableHead>Funds Raised</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((c) => (
                  <TableRow key={c.id} className="group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center">
                          {c.coverImageUrl ? (
                            <img
                              src={c.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                            {c.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            Status: {c.status}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground truncate max-w-[150px]">
                            {c.createdBy?.ngoName || c.createdBy?.name || 'NGO Owner'}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {c.createdBy?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-xs text-foreground font-medium line-clamp-2 bg-muted/40 p-2 rounded-lg border border-border">
                          {c.deleteReason || 'No specific reason provided.'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-sm text-foreground">
                          PKR {Number(c.collectedAmount || 0).toLocaleString()}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Goal: PKR {Number(c.targetAmount || 0).toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(c);
                            setActionType('Approve');
                            setIsConfirmOpen(true);
                          }}
                          className="h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white px-2.5 text-xs shadow-sm"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Approve Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCampaign(c);
                            setActionType('Reject');
                            setIsConfirmOpen(true);
                          }}
                          className="h-8 rounded-lg border-border hover:bg-accent px-2.5 text-xs"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          Dismiss
                        </Button>
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

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {actionType === 'Approve' ? (
                <>
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Confirm Campaign Deletion
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Dismiss Deletion Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'Approve'
                ? `Are you sure you want to approve deletion of "${selectedCampaign?.title}"? This campaign will be soft-deleted and removed from public listings.`
                : `Are you sure you want to dismiss this deletion request for "${selectedCampaign?.title}"? The campaign will remain active.`}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="p-3 rounded-xl border border-border bg-muted/30 text-xs space-y-1">
              <p className="font-semibold text-foreground">NGO Reason:</p>
              <p className="text-muted-foreground">{selectedCampaign.deleteReason || 'None specified'}</p>
              <div className="pt-2 flex justify-between border-t border-border/50 text-[11px]">
                <span>Total Collected:</span>
                <span className="font-bold text-foreground">PKR {Number(selectedCampaign.collectedAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewAction}
              disabled={isSubmitting}
              className={
                actionType === 'Approve'
                  ? 'rounded-xl bg-red-600 hover:bg-red-700 text-white'
                  : 'rounded-xl bg-primary hover:bg-primary/90 text-white'
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              {actionType === 'Approve' ? 'Approve & Delete' : 'Dismiss Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
