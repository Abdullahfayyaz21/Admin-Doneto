'use client';

import { useState, useEffect } from 'react';
import {
  Flag,
  Search,
  CheckCircle,
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
  FolderLock
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';

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

export default function ReportedCampaignsPage() {
  const [reports, setReports] = useState<CampaignReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected report for view modal
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };

      if (reasonFilter !== 'ALL') {
        params.reason = reasonFilter;
      }

      const res = await api.get('/fundraising-campaigns/admin/reports', { params });
      const resData = res.data.data || res.data;
      setReports(resData.data || []);
      setTotal(resData.total || 0);
      setTotalPages(resData.totalPages || 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to retrieve campaign reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, reasonFilter]);

  // Client-side search filtering by campaign title or reporter email
  const filteredReports = reports.filter((rep) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      rep.campaignTitle.toLowerCase().includes(term) ||
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
      setIsDetailsOpen(false);
      fetchReports();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to resolve report.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Action: Pause/Block Campaign
  const handleBlockCampaign = async () => {
    if (!selectedReport) return;
    try {
      setSubmitLoading(true);
      // Calls the pause endpoint to stop the campaign active status
      await api.patch(`/fundraising-campaigns/${selectedReport.campaignId}/pause`);
      // Also resolve/dismiss this report since we acted on it
      await api.delete(`/fundraising-campaigns/admin/reports/${selectedReport.id}`);
      
      toast.success('Campaign has been paused/blocked, and the report resolved.');
      setIsBlockOpen(false);
      setIsDetailsOpen(false);
      fetchReports();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to pause campaign.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDetails = (report: CampaignReport) => {
    setSelectedReport(report);
    setIsDetailsOpen(true);
  };

  const handleOpenResolve = (report: CampaignReport) => {
    setSelectedReport(report);
    setIsResolveOpen(true);
  };

  const handleOpenBlock = (report: CampaignReport) => {
    setSelectedReport(report);
    setIsBlockOpen(true);
  };

  // Formatting helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats calculation
  const totalCount = total;
  const fraudCount = reports.filter(r => r.reason === 'Fraud').length;
  const spamCount = reports.filter(r => r.reason === 'Spam').length;
  const otherCount = reports.filter(r => r.reason === 'Other').length;

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            Reported Campaigns
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor and audit user reports submitted for guideline violations.
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Active Reports</CardTitle>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Flag className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Requires audit resolution</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl hover:border-rose-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fraud Allegations</CardTitle>
            <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{reports.filter(r => r.reason === 'Fraud').length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">High priority audits</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl hover:border-yellow-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spam / Abuse</CardTitle>
            <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {reports.filter(r => r.reason === 'Spam' || r.reason === 'Abusive').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Guideline compliance issues</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl hover:border-slate-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved this session</CardTitle>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">0</div>
            <p className="text-[10px] text-muted-foreground mt-1">Reports resolved in current view</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by campaign title or reporter email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Reason</Label>
            <Select value={reasonFilter} onValueChange={(val) => { setReasonFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[160px] rounded-xl border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Reason Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-slate-900 text-white">
                <SelectItem value="ALL">All Reasons</SelectItem>
                <SelectItem value="Fraud">Fraud</SelectItem>
                <SelectItem value="Spam">Spam</SelectItem>
                <SelectItem value="Abusive">Abusive</SelectItem>
                <SelectItem value="Inappropriate">Inappropriate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Reports Table list */}
      {loading ? (
        <Card className="border-white/10 bg-white/5 p-6 space-y-4 rounded-2xl">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </Card>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-muted-foreground max-w-xl mx-auto shadow-xl">
          <CheckCircle className="h-10 w-10 mx-auto text-emerald-500 mb-4" />
          <h3 className="font-semibold text-lg text-white mb-2">No reports to review</h3>
          <p className="text-sm">Excellent! The system has no pending reports under these criteria.</p>
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white font-semibold">Campaign ID</TableHead>
                <TableHead className="text-white font-semibold">Campaign Title</TableHead>
                <TableHead className="text-white font-semibold">Reason</TableHead>
                <TableHead className="text-white font-semibold">Details</TableHead>
                <TableHead className="text-white font-semibold">Reporter Name</TableHead>
                <TableHead className="text-white font-semibold">Reporter Email</TableHead>
                <TableHead className="text-white font-semibold">Date Reported</TableHead>
                <TableHead className="text-right text-white font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="border-white/5 hover:bg-white/5 text-slate-300">
                  <TableCell className="font-medium text-white">#{report.campaignId}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-semibold text-white">{report.campaignTitle}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`border-none rounded-lg py-0.5 px-2 font-semibold text-xs ${
                        report.reason === 'Fraud' ? 'bg-rose-500/20 text-rose-400' :
                        report.reason === 'Spam' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {report.reason}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{report.details}</TableCell>
                  <TableCell>{report.reporterName || report.reportedByEmail || 'Anonymous'}</TableCell>
                  <TableCell>{report.reporterEmail || 'N/A'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenDetails(report)} 
                        className="h-8 w-8 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenResolve(report)} 
                        className="h-8 w-8 rounded-lg hover:bg-white/5 text-emerald-400 hover:text-emerald-300"
                        title="Resolve/Dismiss"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenBlock(report)} 
                        className="h-8 w-8 rounded-lg hover:bg-white/5 text-rose-500 hover:text-rose-400"
                        title="Pause/Block campaign"
                      >
                        <FolderLock className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 p-4 bg-white/5 text-xs text-muted-foreground">
              <Button 
                variant="ghost" 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span>Page {page} of {totalPages} &bull; Total reports: {total}</span>
              <Button 
                variant="ghost" 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                disabled={page === totalPages}
                className="hover:text-white"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* --------------------- DIALOGS --------------------- */}

      {/* 1. REPORT DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md border-white/10 bg-slate-950 text-white rounded-2xl p-6 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-500">
              <Flag className="h-5 w-5" /> Detailed Violation Report
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Audit the specific report logged against campaign ID #{selectedReport?.campaignId}.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 my-2 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Target Campaign</span>
                <p className="font-bold text-white text-sm line-clamp-1">{selectedReport.campaignTitle}</p>
                <p className="text-muted-foreground">Campaign ID: #{selectedReport.campaignId}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Report Details</span>
                  <Badge className="border-none rounded-lg bg-rose-500/10 text-rose-400 font-semibold">{selectedReport.reason}</Badge>
                </div>
                <p className="text-slate-200 leading-relaxed font-medium bg-slate-950 p-2.5 rounded-lg border border-white/5 min-h-[60px] overflow-y-auto">
                  {selectedReport.details}
                </p>
                <p className="text-[10px] text-muted-foreground">Logged on: {formatDate(selectedReport.createdAt)}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Reporter Profile</span>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-slate-200">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{selectedReport.reporterName || 'Anonymous User'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-200">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{selectedReport.reporterEmail || 'No email attached'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-white/10">
            <Button 
              variant="outline"
              onClick={() => handleOpenBlock(selectedReport!)} 
              className="bg-rose-950/20 hover:bg-rose-900 border-rose-500/20 text-rose-400 rounded-xl text-xs h-10 px-4"
            >
              Block/Pause Campaign
            </Button>
            <Button 
              onClick={() => handleOpenResolve(selectedReport!)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-10 px-4"
            >
              Resolve / Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. RESOLVE CONFIRMATION */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="max-w-sm border-white/10 bg-slate-950 text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Dismiss Violation Report?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              This action will dismiss this report from the queue. No changes will be made to the campaign.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsResolveOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button 
              onClick={handleResolveReport} 
              disabled={submitLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4"
            >
              {submitLoading ? 'Resolving...' : 'Confirm Dismissal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. BLOCK CAMPAIGN CONFIRMATION */}
      <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
        <DialogContent className="max-w-sm border-white/10 bg-slate-950 text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500">Pause Campaign & Resolve Report?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              This will immediately transition the campaign status to <strong>Paused</strong> (stopping public donations) and resolve the report.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsBlockOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button 
              onClick={handleBlockCampaign} 
              disabled={submitLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold px-4"
            >
              {submitLoading ? 'Auditing...' : 'Confirm Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
