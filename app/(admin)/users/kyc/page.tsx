'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  User as UserIcon,
  Building2,
  Calendar,
  ExternalLink,
  MessageSquare,
  ClipboardList,
  Eye,
  Check,
  X,
  Copy,
  AlertCircle,
  Maximize2,
  Download,
  Phone,
  Mail
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getAdminKycRequestsApi,
  getAdminKycRequestByIdApi,
  reviewKycRequestApi,
  KycStatus,
  KycRequest
} from '@/lib/kyc';

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  APPROVED: 'outline',
  PENDING: 'outline',
  REJECTED: 'outline',
};

const statusLabels: Record<string, string> = {
  APPROVED: 'Approved',
  PENDING: 'Pending Review',
  REJECTED: 'Rejected',
};

export default function KYCRequestsPage() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | KycStatus>('ALL');

  // Inspector State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detailedRequest, setDetailedRequest] = useState<KycRequest | null>(null);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Review (Approve/Reject) State
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Lightbox Preview State for Scans
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaTitle, setPreviewMediaTitle] = useState<string>('');

  // Quick count stats
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await getAdminKycRequestsApi(params);
      
      setRequests(response.data || []);
      setTotal(response.total || 0);
      setLastPage(response.lastPage || 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to retrieve KYC requests queue.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  const fetchCounts = async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getAdminKycRequestsApi({ limit: 1, status: KycStatus.PENDING }),
        getAdminKycRequestsApi({ limit: 1, status: KycStatus.APPROVED }),
        getAdminKycRequestsApi({ limit: 1, status: KycStatus.REJECTED }),
      ]);
      setPendingCount(pendingRes.total || 0);
      setApprovedCount(approvedRes.total || 0);
      setRejectedCount(rejectedRes.total || 0);
    } catch (e) {
      console.error('Failed to load status counts', e);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRequests();
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [fetchRequests]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleInspect = async (id: string) => {
    try {
      setSelectedRequestId(id);
      setInspectOpen(true);
      setDetailLoading(true);
      setDetailedRequest(null);
      setShowRejectInput(false);
      setRejectionReason('');

      const detail = await getAdminKycRequestByIdApi(id);
      setDetailedRequest(detail);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load KYC request details.');
      setInspectOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequestId) return;
    try {
      setActionLoading(true);
      await reviewKycRequestApi(selectedRequestId, {
        status: KycStatus.APPROVED,
      });
      toast.success('KYC verification approved successfully.');
      setInspectOpen(false);
      fetchRequests();
      fetchCounts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to approve KYC application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    try {
      setActionLoading(true);
      await reviewKycRequestApi(selectedRequestId, {
        status: KycStatus.REJECTED,
        rejectionReason: rejectionReason.trim(),
      });
      toast.success('KYC application has been rejected.');
      setInspectOpen(false);
      fetchRequests();
      fetchCounts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reject KYC application.');
    } finally {
      setActionLoading(false);
    }
  };

  const getFileUrl = (path: string | null | undefined) => {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3837/api';
    const serverBase = baseUrl.replace('/api', '');
    return `${serverBase}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const isImageFile = (url: string | null | undefined) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.includes('image/upload') || url.includes('res.cloudinary.com');
  };

  const copyToClipboard = (text: string, label = 'Copied') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in fade-in-50 slide-in-from-left-4 duration-300">
        <h1 className="text-2xl font-bold tracking-tight">
          KYC Requests Queue
        </h1>
        <p className="text-muted-foreground">
          Audit and verify legal registrations, CNIC identifiers, and documents submitted by registered NGOs.
        </p>
      </div>



      {/* Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card border border-border/60 p-4 rounded-2xl shadow-sm animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-100 dark:bg-transparent dark:border-0 dark:p-0 dark:shadow-none">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by NGO name, CNIC number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 py-5 rounded-xl bg-muted/50 border border-input text-sm shadow-sm placeholder:text-muted-foreground text-foreground focus-visible:ring-0 dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus-visible:ring-1 dark:focus-visible:ring-white/20"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-muted p-1.5 rounded-xl dark:bg-white/[0.05]">
          <Button
            variant={statusFilter === 'ALL' ? 'default' : 'ghost'}
            onClick={() => { setStatusFilter('ALL'); setPage(1); }}
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === 'ALL' ? 'bg-[#185500] text-white dark:bg-white dark:text-black shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
          >
            All
          </Button>
          <Button
            variant={statusFilter === KycStatus.PENDING ? 'default' : 'ghost'}
            onClick={() => { setStatusFilter(KycStatus.PENDING); setPage(1); }}
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === KycStatus.PENDING ? 'bg-amber-600 text-white shadow-sm' : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'}`}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === KycStatus.APPROVED ? 'default' : 'ghost'}
            onClick={() => { setStatusFilter(KycStatus.APPROVED); setPage(1); }}
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === KycStatus.APPROVED ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'}`}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === KycStatus.REJECTED ? 'default' : 'ghost'}
            onClick={() => { setStatusFilter(KycStatus.REJECTED); setPage(1); }}
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === KycStatus.REJECTED ? 'bg-red-600 text-white shadow-sm' : 'text-muted-foreground hover:text-red-600 hover:bg-red-500/10'}`}
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="bg-card rounded-2xl overflow-hidden shadow-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-150 border border-border/60">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-32 ml-auto" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="p-4 bg-muted/20 text-muted-foreground rounded-full mb-4">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No KYC Requests Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {search 
                ? `No submissions match filter query "${search}".`
                : 'There are no verification requests in this queue state.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground py-4">NGO Name</TableHead>
                  <TableHead className="text-muted-foreground py-4">Representative / User</TableHead>
                  <TableHead className="text-muted-foreground py-4">CNIC Identifier</TableHead>
                  <TableHead className="text-muted-foreground py-4">Status</TableHead>
                  <TableHead className="text-muted-foreground py-4">Submitted Date</TableHead>
                  <TableHead className="w-28 text-right text-muted-foreground py-4 pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="border-b border-border hover:bg-muted/30 transition-all duration-200">
                    <TableCell className="py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#185500] dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                          {req.ngoName ? req.ngoName.charAt(0).toUpperCase() : 'N'}
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block max-w-[200px]">{req.ngoName}</span>
                          {req.ngoRegistrationNumber && (
                            <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">Reg: {req.ngoRegistrationNumber}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div>
                        <span className="text-sm font-medium block">{req.representativeFullName || req.user?.name || 'NGO Owner'}</span>
                        <span className="block text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {req.user?.email || req.representativeDesignation || req.positionInNgo || 'NGO Profile'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{req.cnicNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariants[req.status]}
                        className={`text-[10px] px-2.5 py-1 border font-semibold uppercase tracking-wider rounded-full transition-all ${
                          req.status === KycStatus.APPROVED && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        } ${
                          req.status === KycStatus.PENDING && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        } ${
                          req.status === KycStatus.REJECTED && 'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}
                      >
                        {statusLabels[req.status] || req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(req.createdAt)}</TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <Button
                        onClick={() => handleInspect(req.id)}
                        className="text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm bg-[#185500] text-white hover:bg-[#1e6b00] dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing page <span className="font-medium text-foreground">{page}</span> of{' '}
              <span className="font-medium text-foreground">{lastPage}</span> ({total} requests)
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 w-8 rounded-lg border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 rounded-lg border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* INSPECT DETAIL DIALOG */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto no-scrollbar bg-background border-border text-foreground rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#185500] dark:text-white">
                <Shield className="h-5.5 w-5.5 text-[#185500] dark:text-white" />
                Review KYC Verification Request
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1 text-xs">
              Audit the registry details and legal documentation files below to approve or deny verification.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 space-y-6">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <Skeleton className="h-10 w-64" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </div>
          ) : !detailedRequest ? (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p>Failed to retrieve verification details.</p>
            </div>
          ) : (
            <div className="py-4 space-y-6 text-sm animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header Profile */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between bg-muted/50 border border-border p-4 rounded-xl">
                <div className="flex gap-3 items-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                    {detailedRequest.ngoName ? detailedRequest.ngoName.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{detailedRequest.ngoName}</h2>
                    {detailedRequest.publicName && (
                      <p className="text-xs text-muted-foreground">Public Title: {detailedRequest.publicName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">ID: {detailedRequest.id}</span>
                      <button 
                        onClick={() => copyToClipboard(detailedRequest.id, 'Request ID')}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs text-muted-foreground block">Verification Status</span>
                  <Badge
                    variant={statusVariants[detailedRequest.status]}
                    className={`mt-1 text-[10px] font-bold tracking-wider uppercase ${
                      detailedRequest.status === KycStatus.APPROVED && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    } ${
                      detailedRequest.status === KycStatus.PENDING && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    } ${
                      detailedRequest.status === KycStatus.REJECTED && 'bg-red-500/10 text-red-600 border-red-500/20'
                    }`}
                  >
                    {statusLabels[detailedRequest.status] || detailedRequest.status}
                  </Badge>
                </div>
              </div>

              {/* Grid sections */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Organization Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-[#185500] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    Organization Profile
                  </h3>
                  <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">NGO Registration Number</span>
                      <span className="font-medium text-foreground">{detailedRequest.ngoRegistrationNumber || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground block">Established Year</span>
                        <span className="font-medium text-foreground">{detailedRequest.yearEstablished || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Registration Type</span>
                        <span className="font-medium text-foreground">{detailedRequest.registrationType || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Registration Authority</span>
                      <span className="font-medium text-foreground">{detailedRequest.registrationAuthority || 'N/A'}</span>
                    </div>
                    {detailedRequest.categories && detailedRequest.categories.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Target Sectors / Categories</span>
                        <div className="flex flex-wrap gap-1">
                          {detailedRequest.categories.map((c: string) => (
                            <Badge key={c} variant="outline" className="text-[10px] bg-muted border-border text-foreground">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Representative & User Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-[#185500] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4" />
                    Representative Information
                  </h3>
                  <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Full Representative Name</span>
                      <span className="font-medium text-foreground">{detailedRequest.representativeFullName || detailedRequest.user?.name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground block">Designation</span>
                        <span className="font-medium text-foreground">{detailedRequest.representativeDesignation || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">NGO Position</span>
                        <span className="font-medium text-foreground">{detailedRequest.positionInNgo || 'N/A'}</span>
                      </div>
                    </div>
                    {detailedRequest.user?.email && (
                      <div>
                        <span className="text-xs text-muted-foreground block">Account Email</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {detailedRequest.user.email}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground block">CNIC Identifier</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono text-foreground text-xs">{detailedRequest.cnicNumber || 'N/A'}</span>
                        {detailedRequest.cnicNumber && (
                          <button 
                            onClick={() => copyToClipboard(detailedRequest.cnicNumber, 'CNIC')}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy CNIC"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Scans and Uploaded Files */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#185500] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Official Documents & Verification Scans
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  
                  {/* Registration Certificate */}
                  {detailedRequest.registrationCertificate && (
                    <Card className="bg-muted/40 border-border hover:border-primary/50 transition-all rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Official Document</span>
                        <span className="font-semibold text-xs block truncate">Registration Certificate</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPreviewMediaUrl(getFileUrl(detailedRequest.registrationCertificate));
                            setPreviewMediaTitle('Registration Certificate');
                          }}
                          className="text-xs flex-1 h-8 rounded-lg"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" /> Preview
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                          <a href={getFileUrl(detailedRequest.registrationCertificate)} target="_blank" rel="noreferrer" title="Open Link">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* NTN Certificate */}
                  {detailedRequest.ntnCertificate && (
                    <Card className="bg-muted/40 border-border hover:border-primary/50 transition-all rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Official Document</span>
                        <span className="font-semibold text-xs block truncate">NTN Certificate</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPreviewMediaUrl(getFileUrl(detailedRequest.ntnCertificate));
                            setPreviewMediaTitle('NTN Certificate');
                          }}
                          className="text-xs flex-1 h-8 rounded-lg"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" /> Preview
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                          <a href={getFileUrl(detailedRequest.ntnCertificate)} target="_blank" rel="noreferrer" title="Open Link">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Proof of Affiliation */}
                  {detailedRequest.proofOfAffiliation && (
                    <Card className="bg-muted/40 border-border hover:border-primary/50 transition-all rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Affiliation</span>
                        <span className="font-semibold text-xs block truncate">Proof of Affiliation</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPreviewMediaUrl(getFileUrl(detailedRequest.proofOfAffiliation));
                            setPreviewMediaTitle('Proof of Affiliation');
                          }}
                          className="text-xs flex-1 h-8 rounded-lg"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" /> Preview
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                          <a href={getFileUrl(detailedRequest.proofOfAffiliation)} target="_blank" rel="noreferrer" title="Open Link">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* CNIC Front Image */}
                  {detailedRequest.cnicFrontImage && (
                    <Card className="bg-muted/40 border-border hover:border-primary/50 transition-all rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Identity Scan</span>
                        <span className="font-semibold text-xs block truncate">CNIC Front Side</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPreviewMediaUrl(getFileUrl(detailedRequest.cnicFrontImage));
                            setPreviewMediaTitle('CNIC Front Side Scan');
                          }}
                          className="text-xs flex-1 h-8 rounded-lg"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                          <a href={getFileUrl(detailedRequest.cnicFrontImage)} target="_blank" rel="noreferrer" title="Open Image">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* CNIC Back Image */}
                  {detailedRequest.cnicBackImage && (
                    <Card className="bg-muted/40 border-border hover:border-primary/50 transition-all rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Identity Scan</span>
                        <span className="font-semibold text-xs block truncate">CNIC Back Side</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPreviewMediaUrl(getFileUrl(detailedRequest.cnicBackImage));
                            setPreviewMediaTitle('CNIC Back Side Scan');
                          }}
                          className="text-xs flex-1 h-8 rounded-lg"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                          <a href={getFileUrl(detailedRequest.cnicBackImage)} target="_blank" rel="noreferrer" title="Open Image">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Selfie Image */}
                  {detailedRequest.selfieImage && (
                    <Card className="bg-muted/40 border-border hover:border-primary/50 transition-all rounded-xl p-3 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Biometric Verification</span>
                        <span className="font-semibold text-xs block truncate">Selfie Photo</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setPreviewMediaUrl(getFileUrl(detailedRequest.selfieImage));
                            setPreviewMediaTitle('Selfie Identity Scan');
                          }}
                          className="text-xs flex-1 h-8 rounded-lg"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                          <a href={getFileUrl(detailedRequest.selfieImage)} target="_blank" rel="noreferrer" title="Open Image">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )}

                </div>
              </div>

              {/* Display rejection info if rejected */}
              {detailedRequest.status === KycStatus.REJECTED && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Declined Application Details
                  </span>
                  <p className="text-sm mt-1">
                    <strong>Rejection Reason:</strong> {detailedRequest.rejectionReason || 'No reason specified.'}
                  </p>
                  {detailedRequest.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Audited on: {formatDate(detailedRequest.reviewedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Display approval info if approved */}
              {detailedRequest.status === KycStatus.APPROVED && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Accredited Legal Status
                  </span>
                  <p className="text-sm">
                    This organization profile is fully verified and holds the legal rights to run fundraising campaigns.
                  </p>
                  {detailedRequest.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Approved on: {formatDate(detailedRequest.reviewedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Form Input */}
              {showRejectInput && (
                <form onSubmit={handleReject} className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reject-reason" className="text-sm font-semibold text-red-500 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Specify Rejection Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="reject-reason"
                      placeholder="Explain to the NGO why their verification application is being declined (e.g. Expired registration certificate, blurry CNIC photo, mismatched registration number)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="bg-muted/50 border-border focus:border-red-500 text-sm text-foreground rounded-xl"
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowRejectInput(false)}
                      className="rounded-xl border border-border hover:bg-muted hover:text-foreground text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold"
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirm Rejection
                    </Button>
                  </div>
                </form>
              )}

              {/* Admin Actions Panel */}
              {detailedRequest.status === KycStatus.PENDING && !showRejectInput && (
                <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="bg-transparent hover:bg-red-500/10 text-red-500 hover:text-red-600 border border-red-500/20 rounded-xl h-11 px-5 text-xs font-semibold"
                  >
                    Decline Verification
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-[#185500] hover:bg-[#1e6b00] text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-md rounded-xl h-11 px-5 flex items-center gap-2 text-xs font-semibold"
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Check className="h-4 w-4" /> Approve Verification
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MEDIA PREVIEW LIGHTBOX DIALOG */}
      <Dialog open={!!previewMediaUrl} onOpenChange={(open) => !open && setPreviewMediaUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] p-4 bg-background border-border text-foreground rounded-2xl shadow-2xl flex flex-col items-center">
          <DialogHeader className="w-full flex flex-row items-center justify-between pb-2 border-b border-border/60">
            <DialogTitle className="text-base font-bold">{previewMediaTitle || 'Document Scan Preview'}</DialogTitle>
            {previewMediaUrl && (
              <Button asChild size="sm" variant="outline" className="text-xs h-8 rounded-lg mr-6">
                <a href={previewMediaUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open Original
                </a>
              </Button>
            )}
          </DialogHeader>
          <div className="w-full h-[70vh] flex items-center justify-center overflow-auto rounded-xl bg-black/5 dark:bg-black/40 p-2 my-2">
            {previewMediaUrl && isImageFile(previewMediaUrl) ? (
              <img 
                src={previewMediaUrl} 
                alt={previewMediaTitle} 
                className="max-h-full max-w-full object-contain rounded-lg shadow-md" 
              />
            ) : previewMediaUrl ? (
              <iframe
                src={previewMediaUrl}
                title={previewMediaTitle}
                className="w-full h-full rounded-lg border-0 bg-white"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
