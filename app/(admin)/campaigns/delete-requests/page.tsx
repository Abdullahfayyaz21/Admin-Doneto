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
  FileText,
  RefreshCw,
  ShieldAlert,
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
import { broadcastModerationUpdate, subscribeToModerationUpdates } from '@/lib/realtime';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<DeleteRequestCampaign | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<'Approve' | 'Reject'>('Approve');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchDeleteRequests = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsSyncing(true);

      const res = await api.get('/campaigns');
      const list = res.data?.data || res.data || [];

      if (Array.isArray(list)) {
        const deleteReqs = list
          .filter((c: any) => c.deleteRequested === true)
          .map((c: any) => ({
            id: String(c.id),
            title: c.title,
            description: c.description,
            deleteReason: c.deleteRequestReason || 'Deletion requested by creator',
            collectedAmount: c.collectedAmount || 0,
            targetAmount: c.goalAmount || 0,
            donorCount: c.donorCount || 0,
            createdBy: {
              id: c.createdById || '',
              name: c.creator?.name || c.contactPerson || 'Creator',
              email: c.creator?.email || c.contactEmail || '',
              ngoName: c.ngoName || c.creator?.ngoName || '',
            },
            coverImageUrl: c.imageUrl,
            createdAt: c.createdAt,
            deleteRequestedAt: c.deleteRequestedAt || c.updatedAt || c.createdAt,
            status: c.campaignStatus || 'Active',
          }));
        setRequests(deleteReqs);
      } else {
        setRequests([]);
      }
      setLastUpdated(new Date());
    } catch (error) {
      if (!isBackground) {
        toast.error('Failed to load campaign deletion requests');
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeleteRequests();

    const interval = setInterval(() => {
      fetchDeleteRequests(true);
    }, 15000);

    const unsubscribe = subscribeToModerationUpdates((type) => {
      if (!type || type === 'delete_requests' || type === 'campaigns' || type === 'all') {
        fetchDeleteRequests(true);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchDeleteRequests]);

  const handleReviewAction = async () => {
    if (!selectedCampaign) return;

    try {
      setIsSubmitting(true);
      const isApprove = actionType === 'Approve';

      if (isApprove) {
        // Mark campaign as Cancelled and remove deletion pending flag
        await api.patch(`/fundraising-campaigns/${selectedCampaign.id}`, {
          campaignStatus: 'Cancelled',
          deleteRequested: false,
        });
      } else {
        // Reject deletion request: restore normal status and clear reason
        await api.patch(`/fundraising-campaigns/${selectedCampaign.id}`, {
          deleteRequested: false,
          deleteRequestReason: null,
        });
      }

      toast.success(
        isApprove
          ? `Campaign deletion approved. Campaign has been cancelled.`
          : `Campaign deletion request rejected. Campaign remains active.`
      );

      setIsConfirmOpen(false);
      setSelectedCampaign(null);

      // Broadcast update to sync sidebar badge, dashboard, and other tabs in real-time
      broadcastModerationUpdate('delete_requests');
      fetchDeleteRequests();
    } catch (error: any) {
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

  const totalRaisedByRequests = requests.reduce(
    (acc, curr) => acc + (Number(curr.collectedAmount) || 0),
    0
  );

  const totalDonorsAffected = requests.reduce(
    (acc, curr) => acc + (Number(curr.donorCount) || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Deletion Requests
            </h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review requests submitted by NGOs asking to cancel or permanently remove their campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDeleteRequests(false)}
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
            <p className="text-xs font-medium text-muted-foreground">Pending Requests</p>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{requests.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting cancellation decision</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Collected Funds</p>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            PKR {totalRaisedByRequests.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Already collected on these campaigns</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Donors Affected</p>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{totalDonorsAffected}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Donors who contributed</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Queue Status</p>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {requests.length === 0 ? 'Clear' : 'Action Required'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/50">
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
              className="h-9 w-full rounded-xl border border-input bg-muted/30 pl-9 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
          <div className="text-xs text-muted-foreground self-center">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> deletion request{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Deletion Requests Pending</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              There are currently no campaigns requesting deletion or cancellation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="text-xs font-semibold">Campaign</TableHead>
                  <TableHead className="text-xs font-semibold">Requested By</TableHead>
                  <TableHead className="text-xs font-semibold">Raised / Goal</TableHead>
                  <TableHead className="text-xs font-semibold">Deletion Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((campaign) => {
                  const raised = Number(campaign.collectedAmount || 0);
                  const goal = Number(campaign.targetAmount || 0);
                  const hasDonations = raised > 0;

                  return (
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
                            <p className="font-semibold text-xs text-foreground truncate max-w-[200px]">
                              {campaign.title}
                            </p>
                            <Badge variant="outline" className="mt-0.5 text-[10px] px-1.5 py-0 h-4">
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                              {campaign.createdBy?.ngoName || campaign.createdBy?.name || 'NGO Owner'}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                              {campaign.createdBy?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-foreground">
                            PKR {raised.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Goal: PKR {goal.toLocaleString()}
                          </p>
                          {hasDonations && (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] px-1 py-0 h-3.5 mt-0.5">
                              {campaign.donorCount || 1} Donor(s)
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[220px]">
                          <p className="text-xs text-foreground/90 font-medium line-clamp-2">
                            {campaign.deleteReason || 'No specific reason provided.'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {campaign.deleteRequestedAt
                            ? new Date(campaign.deleteRequestedAt).toLocaleDateString()
                            : new Date(campaign.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setActionType('Approve');
                              setIsConfirmOpen(true);
                            }}
                            className="h-8 rounded-xl px-3 text-xs font-semibold shadow-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Approve Deletion
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setActionType('Reject');
                              setIsConfirmOpen(true);
                            }}
                            className="h-8 rounded-xl px-3 text-xs font-medium"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > itemsPerPage && (
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

      {/* Review Action Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              {actionType === 'Approve' ? (
                <>
                  <AlertOctagon className="h-5 w-5 text-red-600" />
                  Approve Campaign Deletion
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Reject Deletion Request
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {actionType === 'Approve'
                ? `You are about to permanently delete "${selectedCampaign?.title}".`
                : `Rejecting this request will keep "${selectedCampaign?.title}" active on the platform.`}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-3 py-2">
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organizer:</span>
                  <span className="font-semibold text-foreground">
                    {selectedCampaign.createdBy?.ngoName || selectedCampaign.createdBy?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funds Collected:</span>
                  <span className="font-bold text-foreground">
                    PKR {Number(selectedCampaign.collectedAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Goal:</span>
                  <span>PKR {Number(selectedCampaign.targetAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {Number(selectedCampaign.collectedAmount || 0) > 0 && actionType === 'Approve' && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Financial Impact Warning:</span> This campaign has already collected PKR {Number(selectedCampaign.collectedAmount).toLocaleString()}. Deletion requires proper refund or allocation tracking.
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl border border-border bg-muted/20">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Reason submitted by organizer:
                </p>
                <p className="text-xs text-foreground italic">
                  &ldquo;{selectedCampaign.deleteReason || 'No details provided'}&rdquo;
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'Approve' ? 'destructive' : 'default'}
              onClick={handleReviewAction}
              disabled={isSubmitting}
              className={actionType === 'Reject' ? 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold' : 'rounded-xl text-xs font-semibold'}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Confirm {actionType === 'Approve' ? 'Deletion' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
