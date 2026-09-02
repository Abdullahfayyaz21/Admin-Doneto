'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  User as UserIcon,
  MapPin,
  Globe,
  Briefcase,
  AlertCircle,
  Building2,
  Calendar,
  ExternalLink,
  MessageSquare,
  ClipboardList
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
  APPROVED: 'default',
  PENDING: 'outline',
  REJECTED: 'destructive',
};

const statusLabels: Record<string, string> = {
  APPROVED: 'Approved',
  PENDING: 'Pending Review',
  REJECTED: 'Rejected',
};

export default function KYCRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
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
  const [detailedRequest, setDetailedRequest] = useState<any | null>(null);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Review (Approve/Reject) State
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Quick count stats (from current page or static representation)
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const fetchRequests = async () => {
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
  };

  // Helper counts fetcher
  const fetchCounts = async () => {
    try {
      const pendingRes = await getAdminKycRequestsApi({ limit: 1, status: KycStatus.PENDING });
      setPendingCount(pendingRes.total || 0);
      const approvedRes = await getAdminKycRequestsApi({ limit: 1, status: KycStatus.APPROVED });
      setApprovedCount(approvedRes.total || 0);
      const rejectedRes = await getAdminKycRequestsApi({ limit: 1, status: KycStatus.REJECTED });
      setRejectedCount(rejectedRes.total || 0);
    } catch (e) {
      console.error('Failed to load status counts', e);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRequests();
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, page]);

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
      toast.error('Failed to load KYC request details.');
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
      toast.success('KYC application approved successfully.');
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

  const getFileUrl = (path: string | null) => {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3837/api';
    const serverBase = baseUrl.replace('/api', '');
    return `${serverBase}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const formatDate = (dateString: string) => {
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

      {/* Stats Widgets */}
      <div className="grid gap-4 md:grid-cols-3 animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-75">
        <Card className="bg-card shadow-sm rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <div className="p-2 bg-amber-500/10 text-amber-650 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Applications awaiting administrator audit</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Verification</CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully verified legal organizations</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Application</CardTitle>
            <div className="p-2 bg-red-500/10 text-red-650 rounded-xl">
              <XCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Declined requests due to validation failures</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card border border-border/60 p-4 rounded-2xl shadow-sm animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-100 dark:bg-transparent dark:border-0 dark:p-0 dark:shadow-none">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by NGO name..."
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
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
          >
            All
          </Button>
          <Button
            variant={statusFilter === KycStatus.PENDING ? 'default' : 'ghost'}
            onClick={() => { setStatusFilter(KycStatus.PENDING); setPage(1); }}
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === KycStatus.PENDING ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'}`}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === KycStatus.APPROVED ? 'default' : 'ghost'}
            onClick={() => { setStatusFilter(KycStatus.APPROVED); setPage(1); }}
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === KycStatus.APPROVED ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'}`}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === KycStatus.REJECTED ? 'default' : 'ghost'}
            onClick={() => { setStatusFilter(KycStatus.REJECTED); setPage(1); }}
            className={`rounded-lg py-1 px-3.5 h-8 text-xs font-semibold ${statusFilter === KycStatus.REJECTED ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-red-650 hover:bg-red-500/10'}`}
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="bg-card rounded-2xl overflow-hidden shadow-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-150">
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
                  <TableHead className="text-muted-foreground py-4">Representative Name</TableHead>
                  <TableHead className="text-muted-foreground py-4">CNIC Identifier</TableHead>
                  <TableHead className="text-muted-foreground py-4">Status</TableHead>
                  <TableHead className="text-muted-foreground py-4">Submitted Date</TableHead>
                  <TableHead className="w-24 text-right text-muted-foreground py-4 pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="border-b border-border hover:bg-muted/30 transition-all duration-200 hover:-translate-y-[1px]">
                    <TableCell className="py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold">
                          {req.ngoName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{req.ngoName}</span>
                          {req.ngoRegistrationNumber && (
                            <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">Reg: {req.ngoRegistrationNumber}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div>
                        <span className="text-sm font-medium">{req.representativeFullName || 'N/A'}</span>
                        {req.representativeDesignation && (
                          <span className="block text-[11px] text-muted-foreground">{req.representativeDesignation}</span>
                        )}
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
                          req.status === KycStatus.REJECTED && 'bg-red-500/10 text-red-650 border-red-500/20'
                        }`}
                      >
                        {statusLabels[req.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(req.createdAt)}</TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <Button
                        onClick={() => handleInspect(req.id)}
                        className="text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm"
                      >
                        Review
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto no-scrollbar bg-background border-border text-foreground rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#185500] dark:text-white">
              <Shield className="h-5.5 w-5.5 text-[#185500] dark:text-white" />
              Review KYC Verification Request
            </DialogTitle>
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
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {detailedRequest.ngoName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{detailedRequest.ngoName}</h2>
                    {detailedRequest.publicName && (
                      <p className="text-xs text-muted-foreground">Public Name: {detailedRequest.publicName}</p>
                    )}
                    <span className="text-[10px] text-indigo-500 font-mono mt-1 block">Request ID: {detailedRequest.id}</span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs text-muted-foreground block">Verification Status</span>
                  <Badge
                    variant={statusVariants[detailedRequest.status]}
                    className={`mt-1 text-[10px] font-bold tracking-wider uppercase ${
                      detailedRequest.status === KycStatus.APPROVED && 'bg-emerald-500/10 text-emerald-650 border-emerald-500/20'
                    } ${
                      detailedRequest.status === KycStatus.PENDING && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    } ${
                      detailedRequest.status === KycStatus.REJECTED && 'bg-red-500/10 text-red-650 border-red-500/20'
                    }`}
                  >
                    {statusLabels[detailedRequest.status]}
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

                {/* Representative details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-[#185500] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4" />
                    Representative Information
                  </h3>
                  <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Full Name</span>
                      <span className="font-medium text-foreground">{detailedRequest.representativeFullName || 'N/A'}</span>
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
                    <div>
                      <span className="text-xs text-muted-foreground block">Direct Contact (Accreditation)</span>
                      <span className="font-medium text-foreground">{detailedRequest.contactForAccreditation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">CNIC Identifier</span>
                      <span className="font-medium font-mono text-foreground text-xs">{detailedRequest.cnicNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Description & Mission */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#185500] dark:text-white uppercase tracking-wider">Mission Statement & Biography</h3>
                <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-3 leading-relaxed text-sm">
                  {detailedRequest.missionStatement && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Mission Statement</span>
                      <p className="text-foreground">{detailedRequest.missionStatement}</p>
                    </div>
                  )}
                  {detailedRequest.organizationDescription && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-0.5">Organization Description</span>
                      <p className="text-foreground">{detailedRequest.organizationDescription}</p>
                    </div>
                  )}
                  {!detailedRequest.missionStatement && !detailedRequest.organizationDescription && (
                    <span className="text-xs text-muted-foreground">No description or mission statement provided.</span>
                  )}
                </div>
              </div>

              {/* Scans and Uploaded Files */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#185500] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Official Documents & Verification Scans
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  
                  {detailedRequest.registrationCertificate && (
                    <Card className="bg-muted/50 border-border hover:border-primary/50 hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Document</span>
                        <span className="font-semibold block truncate">Registration Cert</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="mt-3 text-xs w-full text-primary hover:text-primary-foreground hover:bg-primary flex items-center gap-1">
                        <a href={getFileUrl(detailedRequest.registrationCertificate)} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View File
                        </a>
                      </Button>
                    </Card>
                  )}

                  {detailedRequest.ntnCertificate && (
                    <Card className="bg-muted/50 border-border hover:border-primary/50 hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Document</span>
                        <span className="font-semibold block truncate">NTN Certificate</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="mt-3 text-xs w-full text-primary hover:text-primary-foreground hover:bg-primary flex items-center gap-1">
                        <a href={getFileUrl(detailedRequest.ntnCertificate)} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View File
                        </a>
                      </Button>
                    </Card>
                  )}

                  {detailedRequest.proofOfAffiliation && (
                    <Card className="bg-muted/50 border-border hover:border-primary/50 hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Document</span>
                        <span className="font-semibold block truncate">Proof of Affiliation</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="mt-3 text-xs w-full text-primary hover:text-primary-foreground hover:bg-primary flex items-center gap-1">
                        <a href={getFileUrl(detailedRequest.proofOfAffiliation)} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View File
                        </a>
                      </Button>
                    </Card>
                  )}

                  {detailedRequest.cnicFrontImage && (
                    <Card className="bg-muted/50 border-border hover:border-primary/50 hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Scan</span>
                        <span className="font-semibold block truncate">CNIC Front Side</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="mt-3 text-xs w-full text-primary hover:text-primary-foreground hover:bg-primary flex items-center gap-1">
                        <a href={getFileUrl(detailedRequest.cnicFrontImage)} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Scan
                        </a>
                      </Button>
                    </Card>
                  )}

                  {detailedRequest.cnicBackImage && (
                    <Card className="bg-muted/50 border-border hover:border-primary/50 hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Scan</span>
                        <span className="font-semibold block truncate">CNIC Back Side</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="mt-3 text-xs w-full text-primary hover:text-primary-foreground hover:bg-primary flex items-center gap-1">
                        <a href={getFileUrl(detailedRequest.cnicBackImage)} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Scan
                        </a>
                      </Button>
                    </Card>
                  )}

                  {detailedRequest.selfieImage && (
                    <Card className="bg-muted/50 border-border hover:border-primary/50 hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Scan</span>
                        <span className="font-semibold block truncate">Selfie Identity Scan</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="mt-3 text-xs w-full text-primary hover:text-primary-foreground hover:bg-primary flex items-center gap-1">
                        <a href={getFileUrl(detailedRequest.selfieImage)} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Photo
                        </a>
                      </Button>
                    </Card>
                  )}

                </div>
              </div>

              {/* Display rejection info if rejected */}
              {detailedRequest.status === KycStatus.REJECTED && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Declined Application Details
                  </span>
                  <p className="text-sm mt-1">
                    <strong>Rejection Reason:</strong> {detailedRequest.rejectionReason || 'No reason provided.'}
                  </p>
                  {detailedRequest.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Audited: {formatDate(detailedRequest.reviewedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Display approval info if approved */}
              {detailedRequest.status === KycStatus.APPROVED && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-655 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Accredited Legal Status
                  </span>
                  <p className="text-sm">
                    This organization profile is fully verified and holds the legal rights to run fundraising campaigns.
                  </p>
                  {detailedRequest.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Approved: {formatDate(detailedRequest.reviewedAt)}
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
                      placeholder="Explain to the NGO why their verification application is being declined (e.g. Blurry CNIC scan, missing registration authority seal)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="bg-muted/50 border-border focus:border-red-500 text-sm text-foreground"
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowRejectInput(false)}
                      className="rounded-xl border border-border hover:bg-muted hover:text-foreground"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-red-650 hover:bg-red-700 text-white rounded-xl shadow-lg flex items-center gap-2"
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirm Decline
                    </Button>
                  </div>
                </form>
              )}

              {/* Admin Actions Panel */}
              {detailedRequest.status === KycStatus.PENDING && !showRejectInput && (
                <div className="border-t border-border pt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="bg-transparent hover:bg-red-500/10 text-red-500 hover:text-red-600 border border-red-500/20 rounded-xl py-6 px-5"
                  >
                    Decline Verification
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-emerald-650 hover:bg-emerald-700 text-white shadow-lg rounded-xl py-6 px-5 flex items-center gap-2"
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Approve Verification
                  </Button>
                </div>
              )}

            </div>
          )}

          <DialogFooter className="border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInspectOpen(false)}
              className="rounded-xl border border-border hover:bg-muted hover:text-foreground"
            >
              Close Inspector
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
