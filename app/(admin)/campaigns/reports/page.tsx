'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Mail,
  User,
  Clock,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/brand/states';
import { toast } from 'sonner';
import api from '@/lib/api';
import { broadcastModerationUpdate, subscribeToModerationUpdates } from '@/lib/realtime';

interface CampaignReport {
  id: number;
  campaignId: number;
  campaignTitle: string;
  reportedById: string | null;
  reportedByEmail: string | null;
  reason: 'Fraud' | 'Spam' | 'Abusive' | 'Inappropriate' | 'Other';
  details: string;
  reporterEmail: string | null;
  reporterName: string | null;
  createdAt: string;
}

const reasonBadges: Record<string, { label: string; className: string }> = {
  Fraud: { label: 'Fraud / Scam', className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  Spam: { label: 'Spam', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  Abusive: { label: 'Abusive Content', className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  Inappropriate: { label: 'Inappropriate', className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  Other: { label: 'Other', className: 'bg-muted text-muted-foreground border-border' },
};

export default function ReportedCampaignsPage() {
  const [reports, setReports] = useState<CampaignReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filters
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected report for modals
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);

  const fetchReports = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsSyncing(true);

      const params: Record<string, any> = {
        page,
        limit,
      };

      if (reasonFilter !== 'ALL') {
        params.reason = reasonFilter;
      }

      const res = await api.get('/fundraising-campaigns/admin/reports', { params });
      const resData = res.data?.data || res.data;
      setReports(resData?.data || (Array.isArray(resData) ? resData : []));
      setTotal(resData?.total || 0);
      setTotalPages(resData?.totalPages || 1);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!isBackground) {
        toast.error(err.response?.data?.message || 'Failed to retrieve campaign reports.');
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [page, limit, reasonFilter]);

  useEffect(() => {
    fetchReports();

    const interval = setInterval(() => {
      fetchReports(true);
    }, 15000);

    const unsubscribe = subscribeToModerationUpdates((type) => {
      if (!type || type === 'reports' || type === 'campaigns' || type === 'all') {
        fetchReports(true);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchReports]);

  // Client-side search filtering by campaign title or reporter email
  const filteredReports = reports.filter((rep) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      rep.campaignTitle?.toLowerCase().includes(term) ||
      (rep.reporterEmail && rep.reporterEmail.toLowerCase().includes(term)) ||
      (rep.reporterName && rep.reporterName.toLowerCase().includes(term)) ||
      String(rep.campaignId).includes(term)
    );
  });

  // Action: Dismiss/Resolve Report
  const handleResolveReport = async () => {
    if (!selectedReport) return;
    try {
      setSubmitLoading(true);
      await api.delete(`/fundraising-campaigns/admin/reports/${selectedReport.id}`);
      toast.success('Report resolved and dismissed successfully.');
      setIsResolveOpen(false);
      setSelectedReport(null);

      // Broadcast update to sync sidebar badge, dashboard, and other tabs in real-time
      broadcastModerationUpdate('reports');
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dismiss report.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Action: Pause Campaign under Investigation
  const handlePauseCampaign = async () => {
    if (!selectedReport) return;
    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/${selectedReport.campaignId}/pause`);
      toast.success(`Campaign "${selectedReport.campaignTitle}" has been paused for safety.`);
      setIsPauseOpen(false);
      setSelectedReport(null);

      broadcastModerationUpdate('reports');
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to freeze campaign.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const fraudCount = reports.filter((r) => r.reason === 'Fraud').length;
  const uniqueCampaigns = new Set(reports.map((r) => r.campaignId)).size;

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Reported Campaigns
            </h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review user reports, audit suspicious activity, and enforce trust & safety rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReports(false)}
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
            <p className="text-xs font-medium text-muted-foreground">Active Reports</p>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Flag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{reports.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Submitted by platform users</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">High-Risk / Fraud</p>
            <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{fraudCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Requires urgent investigation</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Campaigns Flagged</p>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{uniqueCampaigns}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Distinct campaigns affected</p>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Platform Safety</p>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {reports.length === 0 ? 'Secure' : 'Reviewing'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/50">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, reporter email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-muted/30 pl-9 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <Select value={reasonFilter} onValueChange={(val) => { setReasonFilter(val); setPage(1); }}>
              <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs bg-muted/30">
                <SelectValue placeholder="All Reasons" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="ALL">All Reasons</SelectItem>
                <SelectItem value="Fraud">Fraud / Scam</SelectItem>
                <SelectItem value="Spam">Spam</SelectItem>
                <SelectItem value="Abusive">Abusive Content</SelectItem>
                <SelectItem value="Inappropriate">Inappropriate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground self-center">
            Showing <span className="font-semibold text-foreground">{filteredReports.length}</span> report{filteredReports.length === 1 ? '' : 's'}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Zero Platform Reports</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              No campaigns have been flagged by the community. Any incoming reports will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="text-xs font-semibold">Flagged Campaign</TableHead>
                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Reporter</TableHead>
                  <TableHead className="text-xs font-semibold">Details</TableHead>
                  <TableHead className="text-xs font-semibold">Reported Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const badgeInfo = reasonBadges[report.reason] || reasonBadges.Other;

                  return (
                    <TableRow key={report.id} className="group transition-colors hover:bg-muted/40">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-foreground truncate max-w-[200px]">
                            {report.campaignTitle || `Campaign #${report.campaignId}`}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            ID: {report.campaignId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-lg text-[10px] font-semibold border ${badgeInfo.className}`}>
                          {badgeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium text-foreground truncate max-w-[150px]">
                            {report.reporterName || 'Community Member'}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {report.reporterEmail || report.reportedByEmail || 'Anonymous'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-foreground/80 line-clamp-1 max-w-[220px]">
                          {report.details || 'No additional details.'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsDetailsOpen(true);
                            }}
                            className="h-8 rounded-xl px-2.5 text-xs font-medium hover:bg-muted"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            Inspect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsPauseOpen(true);
                            }}
                            className="h-8 rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2.5 text-xs font-medium"
                          >
                            <PauseCircle className="h-3.5 w-3.5 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsResolveOpen(true);
                            }}
                            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 text-xs font-semibold shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Resolve
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
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 rounded-xl text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 rounded-xl text-xs"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Inspect Report Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`rounded-lg text-[10px] font-semibold border ${reasonBadges[selectedReport.reason]?.className}`}>
                    {reasonBadges[selectedReport.reason]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Report #{selectedReport.id}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold mt-1.5 text-foreground">
                  {selectedReport.campaignTitle || `Campaign #${selectedReport.campaignId}`}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Submitted {new Date(selectedReport.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reporter Info</p>
                  <p className="text-xs font-semibold text-foreground">
                    {selectedReport.reporterName || 'Anonymous Submitter'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedReport.reporterEmail || selectedReport.reportedByEmail || 'No email provided'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Report Details</p>
                  <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                    {selectedReport.details || 'No additional explanation given by reporter.'}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setIsPauseOpen(true);
                    }}
                    className="rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-medium"
                  >
                    <PauseCircle className="h-4 w-4 mr-1.5" /> Pause Campaign
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setIsResolveOpen(true);
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Dismiss / Resolve
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve / Dismiss Confirmation Modal */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Resolve & Dismiss Report
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will mark the report against &ldquo;{selectedReport?.campaignTitle}&rdquo; as reviewed and dismiss it from the queue.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsResolveOpen(false)}
              disabled={submitLoading}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveReport}
              disabled={submitLoading}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Campaign Confirmation Modal */}
      <Dialog open={isPauseOpen} onOpenChange={setIsPauseOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Pause Flagged Campaign
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pausing &ldquo;{selectedReport?.campaignTitle}&rdquo; temporarily disables donation collection while compliance investigates the report.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsPauseOpen(false)}
              disabled={submitLoading}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePauseCampaign}
              disabled={submitLoading}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              Confirm Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
