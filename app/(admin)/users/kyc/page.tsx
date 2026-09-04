'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
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
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Volume2,
  VolumeX,
  Radio,
  FileSpreadsheet,
  Layers,
  Sparkles,
  HelpCircle,
  ListChecks,
  ChevronDown,
  Info
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  getAdminKycRequestByIdApi,
  reviewKycRequestApi,
  holdKycRequestApi,
  reopenKycRequestApi,
  KycStatus,
  KycRequest,
} from '@/lib/kyc';
import {
  useRealtimeKyc,
  broadcastKycUpdate,
  SyncIntervalOption,
} from '@/hooks/useRealtimeKyc';

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  APPROVED: 'outline',
  PENDING: 'outline',
  HOLD: 'outline',
  UNDER_REVIEW: 'outline',
  REJECTED: 'outline',
};

const statusLabels: Record<string, string> = {
  APPROVED: 'Approved & Verified',
  PENDING: 'Pending Review',
  HOLD: 'Under Review / On Hold',
  UNDER_REVIEW: 'Under Review',
  REJECTED: 'Rejected / Declined',
};

// Preset rejection reasons for rapid standard review
const QUICK_REJECTION_REASONS = [
  'Blurry or unreadable CNIC / Identity card scan.',
  'Invalid or expired NGO Registration Certificate.',
  'Mismatched representative credentials or unauthorized position.',
  'Missing or invalid NTN tax certificate documentation.',
  'Incomplete organization mission statement or address verification failed.',
  'Biometric selfie photo does not clearly match the CNIC document photo.',
];

// Preset hold reasons
const QUICK_HOLD_REASONS = [
  'Awaiting higher resolution scan of Registration Certificate.',
  'Pending secondary tax & regulatory background audit.',
  'Representative contacted for additional affiliation proof.',
  'Legal authority verification pending with local registrar.',
];

export default function KYCRequestsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | KycStatus | 'HOLD'>('ALL');

  // Real-time hook for requests, counts, live syncing, and audio chime
  const {
    requests,
    loading,
    isSyncing,
    total,
    lastPage,
    lastUpdated,
    counts,
    syncInterval,
    setSyncInterval,
    soundEnabled,
    toggleSound,
    triggerRefresh,
    fetchRequests,
    fetchCounts,
  } = useRealtimeKyc({
    search,
    statusFilter,
    page,
    limit,
    initialInterval: 10,
    enableAudioAlert: true,
  });

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inspector Modal State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detailedRequest, setDetailedRequest] = useState<KycRequest | null>(null);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('org');

  // Compliance checklist interactive states
  const [checklist, setChecklist] = useState({
    identityMatch: false,
    biometricMatch: false,
    regDocValid: false,
    taxValid: false,
    repAuthorized: false,
  });

  // Review (Approve/Reject/Hold) Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'HOLD' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Document Lightbox & Zoom Viewer State
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaTitle, setPreviewMediaTitle] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset page when search or status filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, statusFilter]);

  const handleInspect = async (id: string) => {
    try {
      setSelectedRequestId(id);
      setInspectOpen(true);
      setDetailLoading(true);
      setDetailedRequest(null);
      setInspectorTab('org');
      setChecklist({
        identityMatch: false,
        biometricMatch: false,
        regDocValid: false,
        taxValid: false,
        repAuthorized: false,
      });

      const detail = await getAdminKycRequestByIdApi(id);
      setDetailedRequest(detail);
      
      // Auto pre-check compliance if already approved
      if (detail.status === KycStatus.APPROVED) {
        setChecklist({
          identityMatch: true,
          biometricMatch: true,
          regDocValid: true,
          taxValid: true,
          repAuthorized: true,
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load verification dossier.');
      setInspectOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openActionModal = (type: 'APPROVE' | 'REJECT' | 'HOLD', req?: KycRequest) => {
    if (req) {
      setSelectedRequestId(req.id);
      setDetailedRequest(req);
    }
    setActionType(type);
    setActionReason('');
    setIsActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequestId || !actionType) return;

    try {
      setActionLoading(true);
      const userId = detailedRequest?.userId || detailedRequest?.user?.id;

      if (actionType === 'APPROVE') {
        await reviewKycRequestApi(
          selectedRequestId,
          {
            status: KycStatus.APPROVED,
            adminNotes: actionReason.trim() || 'Approved by administrator verification review.',
          },
          userId
        );
        toast.success('KYC Verification Approved!', {
          description: `Organization "${detailedRequest?.ngoName || 'User'}" has been accredited.`,
        });
      } else if (actionType === 'HOLD') {
        if (!actionReason.trim()) {
          toast.error('Please specify a reason for placing this request on hold.');
          return;
        }
        await holdKycRequestApi(selectedRequestId, actionReason.trim(), userId);
        toast.info('Verification Placed On Hold', {
          description: `Application moved to audit review with notes attached.`,
        });
      } else if (actionType === 'REJECT') {
        if (!actionReason.trim()) {
          toast.error('Please provide a rejection reason so the NGO can correct errors.');
          return;
        }
        await reviewKycRequestApi(
          selectedRequestId,
          {
            status: KycStatus.REJECTED,
            rejectionReason: actionReason.trim(),
          },
          userId
        );
        toast.warning('Verification Request Rejected', {
          description: `NGO has been notified to re-submit compliant documentation.`,
        });
      }

      broadcastKycUpdate();
      setIsActionModalOpen(false);
      setInspectOpen(false);
      await Promise.all([fetchRequests(false), fetchCounts()]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update KYC request status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async (req: KycRequest) => {
    try {
      setActionLoading(true);
      const userId = req.userId || req.user?.id;
      await reopenKycRequestApi(req.id, userId);
      toast.success('Request Moved to Pending Review', {
        description: 'You can now audit and re-evaluate this application.',
      });
      broadcastKycUpdate();
      if (inspectOpen) setInspectOpen(false);
      await Promise.all([fetchRequests(false), fetchCounts()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to re-evaluate request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch action handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(requests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      let successCount = 0;
      for (const id of selectedIds) {
        const req = requests.find((r) => r.id === id);
        await reviewKycRequestApi(
          id,
          { status: KycStatus.APPROVED, adminNotes: 'Batch approved by Admin' },
          req?.userId || req?.user?.id
        ).catch(() => {});
        successCount++;
      }
      toast.success(`Batch Approved ${successCount} verification requests.`);
      setSelectedIds([]);
      broadcastKycUpdate();
      await Promise.all([fetchRequests(false), fetchCounts()]);
    } catch {
      toast.error('Encountered an issue during batch approval.');
    } finally {
      setActionLoading(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (requests.length === 0) {
      toast.info('No requests to export in current view.');
      return;
    }

    const headers = [
      'Request ID',
      'NGO Legal Name',
      'Representative',
      'Email',
      'CNIC',
      'Reg Number',
      'Status',
      'Submitted At',
      'Notes/Rejection Reason',
    ];

    const rows = requests.map((r) => [
      r.id,
      `"${(r.ngoName || '').replace(/"/g, '""')}"`,
      `"${(r.representativeFullName || r.user?.name || '').replace(/"/g, '""')}"`,
      r.user?.email || '',
      r.cnicNumber || '',
      r.ngoRegistrationNumber || '',
      r.status,
      r.createdAt,
      `"${(r.rejectionReason || r.adminNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `doneto_kyc_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('KYC audit report exported as CSV.');
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
    return (
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) ||
      url.includes('image/upload') ||
      url.includes('res.cloudinary.com')
    );
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allSelected = requests.length > 0 && selectedIds.length === requests.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Real-time Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="h-7 w-7 text-[#185500] dark:text-white" />
              KYC & Verification Queue
            </h1>
            
            {/* Live Sync Status Pill */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                syncInterval > 0
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {syncInterval > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncInterval > 0 ? 'bg-emerald-500' : 'bg-muted-foreground'
                  }`}
                ></span>
              </span>
              <span>{syncInterval > 0 ? `Live Sync (${syncInterval}s)` : 'Live Sync Paused'}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time audit center for unverified users, legal registrations, CNIC documents, and biometric verification.
          </p>
        </div>

        {/* Live Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Alert Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSound}
            className={`h-9 px-3 text-xs font-medium border-border ${
              soundEnabled
                ? 'bg-[#185500]/10 text-[#185500] border-[#185500]/20 dark:bg-white/10 dark:text-white'
                : 'text-muted-foreground'
            }`}
            title={soundEnabled ? 'Audio alerts active' : 'Audio alerts muted'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                Audio Alerts
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-1.5 text-muted-foreground" />
                Muted
              </>
            )}
          </Button>

          {/* Sync Interval Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs border-border gap-1.5 font-medium">
                <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{syncInterval === 0 ? 'Manual Refresh' : `Auto (${syncInterval}s)`}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground">Polling Speed</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSyncInterval(5)} className={syncInterval === 5 ? 'font-bold text-emerald-600' : ''}>
                ⚡ High-Speed (5s)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSyncInterval(10)} className={syncInterval === 10 ? 'font-bold text-emerald-600' : ''}>
                🔄 Recommended (10s)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSyncInterval(30)} className={syncInterval === 30 ? 'font-bold text-emerald-600' : ''}>
                ⏱️ Moderate (30s)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSyncInterval(0)} className={syncInterval === 0 ? 'font-bold text-emerald-600' : ''}>
                ⏸️ Manual Refresh Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={triggerRefresh}
            disabled={loading || isSyncing}
            className="h-9 px-3 text-xs border-border gap-1.5 hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing || loading ? 'animate-spin text-emerald-600' : 'text-muted-foreground'}`} />
            <span>Refresh</span>
          </Button>

          {/* Export Report */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-9 px-3 text-xs border-border gap-1.5 hover:bg-muted"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Real-time Status Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Card */}
        <Card
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className={`cursor-pointer transition-all border rounded-xl hover:shadow-md ${
            statusFilter === 'ALL'
              ? 'border-foreground/30 bg-muted/40 shadow-xs'
              : 'border-border/60 bg-card hover:bg-muted/20'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Total Filed</span>
              <span className="text-2xl font-black text-foreground">{counts.total}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 text-muted-foreground">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Card (Pulsing) */}
        <Card
          onClick={() => { setStatusFilter(KycStatus.PENDING); setPage(1); }}
          className={`cursor-pointer transition-all border rounded-xl hover:shadow-md relative overflow-hidden ${
            statusFilter === KycStatus.PENDING
              ? 'border-amber-500/50 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30'
              : 'border-border/60 bg-card hover:bg-amber-500/5'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Pending Audit</span>
                {counts.pending > 0 && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{counts.pending}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* On Hold Card */}
        <Card
          onClick={() => { setStatusFilter('HOLD'); setPage(1); }}
          className={`cursor-pointer transition-all border rounded-xl hover:shadow-md ${
            statusFilter === 'HOLD'
              ? 'border-orange-500/50 bg-orange-500/10 shadow-xs ring-1 ring-orange-500/30'
              : 'border-border/60 bg-card hover:bg-orange-500/5'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">On Hold / In Review</span>
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{counts.hold}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Approved Card */}
        <Card
          onClick={() => { setStatusFilter(KycStatus.APPROVED); setPage(1); }}
          className={`cursor-pointer transition-all border rounded-xl hover:shadow-md ${
            statusFilter === KycStatus.APPROVED
              ? 'border-emerald-500/50 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30'
              : 'border-border/60 bg-card hover:bg-emerald-500/5'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Approved & Verified</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{counts.approved}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Rejected Card */}
        <Card
          onClick={() => { setStatusFilter(KycStatus.REJECTED); setPage(1); }}
          className={`cursor-pointer transition-all border rounded-xl hover:shadow-md ${
            statusFilter === KycStatus.REJECTED
              ? 'border-red-500/50 bg-red-500/10 shadow-xs ring-1 ring-red-500/30'
              : 'border-border/60 bg-card hover:bg-red-500/5'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">Rejected / Incomplete</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400">{counts.rejected}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filter Row & Status Tabs */}
      <div className="flex flex-col sm:flex-row gap-3.5 sm:items-center sm:justify-between bg-card border border-border/60 p-3.5 rounded-2xl shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by NGO Name, Representative, CNIC, Reg #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-10 rounded-xl bg-muted/40 border-border text-sm placeholder:text-muted-foreground/70"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Tab Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl border border-border/50">
          <Button
            variant={statusFilter === 'ALL' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-lg py-1 px-3 h-7.5 text-xs font-semibold ${
              statusFilter === 'ALL'
                ? 'bg-[#185500] text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({counts.total})
          </Button>
          <Button
            variant={statusFilter === KycStatus.PENDING ? 'default' : 'ghost'}
            onClick={() => setStatusFilter(KycStatus.PENDING)}
            className={`rounded-lg py-1 px-3 h-7.5 text-xs font-semibold ${
              statusFilter === KycStatus.PENDING
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
            }`}
          >
            Pending ({counts.pending})
          </Button>
          <Button
            variant={statusFilter === 'HOLD' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('HOLD')}
            className={`rounded-lg py-1 px-3 h-7.5 text-xs font-semibold ${
              statusFilter === 'HOLD'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10'
            }`}
          >
            On Hold ({counts.hold})
          </Button>
          <Button
            variant={statusFilter === KycStatus.APPROVED ? 'default' : 'ghost'}
            onClick={() => setStatusFilter(KycStatus.APPROVED)}
            className={`rounded-lg py-1 px-3 h-7.5 text-xs font-semibold ${
              statusFilter === KycStatus.APPROVED
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
            }`}
          >
            Approved ({counts.approved})
          </Button>
          <Button
            variant={statusFilter === KycStatus.REJECTED ? 'default' : 'ghost'}
            onClick={() => setStatusFilter(KycStatus.REJECTED)}
            className={`rounded-lg py-1 px-3 h-7.5 text-xs font-semibold ${
              statusFilter === KycStatus.REJECTED
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-red-600 hover:bg-red-500/10'
            }`}
          >
            Rejected ({counts.rejected})
          </Button>
        </div>
      </div>

      {/* Multi-Select Batch Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#185500] text-white dark:bg-card dark:text-foreground border border-emerald-600/30 p-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <span className="bg-white/20 dark:bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono">
              {selectedIds.length} Selected
            </span>
            <span>Batch operations available for selected requests</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBatchApprove}
              disabled={actionLoading}
              className="bg-white text-[#185500] hover:bg-neutral-100 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700 h-8 rounded-xl text-xs font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Batch Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds([])}
              className="bg-transparent border-white/30 text-white hover:bg-white/10 dark:text-foreground h-8 rounded-xl text-xs"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Main Verification Table */}
      <Card className="bg-card rounded-2xl overflow-hidden shadow-xs border border-border/60">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-32 ml-auto" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="p-4 bg-muted/30 text-muted-foreground rounded-full mb-3">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No Verification Requests Found</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {search
                ? `No verification submissions matched "${search}". Try resetting the search or filter.`
                : 'There are currently no verification requests in this queue state.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-10 px-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground py-4 font-semibold text-xs uppercase tracking-wider">NGO / Organization</TableHead>
                  <TableHead className="text-muted-foreground py-4 font-semibold text-xs uppercase tracking-wider">Representative</TableHead>
                  <TableHead className="text-muted-foreground py-4 font-semibold text-xs uppercase tracking-wider">CNIC Identifier</TableHead>
                  <TableHead className="text-muted-foreground py-4 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-muted-foreground py-4 font-semibold text-xs uppercase tracking-wider">Submitted</TableHead>
                  <TableHead className="w-36 text-right text-muted-foreground py-4 pr-6 font-semibold text-xs uppercase tracking-wider">Audit Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const isHold = req.status === KycStatus.HOLD || req.rejectionReason?.startsWith('[ON HOLD]');
                  const displayStatus = isHold ? KycStatus.HOLD : req.status;

                  return (
                    <TableRow
                      key={req.id}
                      className="border-b border-border hover:bg-muted/30 transition-all duration-150"
                    >
                      {/* Checkbox */}
                      <TableCell className="px-4">
                        <Checkbox
                          checked={selectedIds.includes(req.id)}
                          onCheckedChange={() => handleToggleSelect(req.id)}
                          aria-label={`Select ${req.ngoName}`}
                        />
                      </TableCell>

                      {/* Organization Name & Registration */}
                      <TableCell className="py-4 font-semibold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#185500] to-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {req.ngoName ? req.ngoName.charAt(0).toUpperCase() : 'N'}
                          </div>
                          <div className="min-w-0">
                            <span className="truncate block font-bold text-sm max-w-[220px]">{req.ngoName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {req.ngoRegistrationNumber ? (
                                <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  Reg: {req.ngoRegistrationNumber}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Unregistered</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Representative */}
                      <TableCell className="text-foreground">
                        <div>
                          <span className="text-sm font-semibold block">{req.representativeFullName || req.user?.name || 'NGO Owner'}</span>
                          <span className="block text-[11px] text-muted-foreground truncate max-w-[190px]">
                            {req.user?.email || req.representativeDesignation || req.positionInNgo || 'Account Profile'}
                          </span>
                        </div>
                      </TableCell>

                      {/* CNIC */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-foreground bg-muted/60 px-2 py-1 rounded-md">
                            {req.cnicNumber || 'N/A'}
                          </span>
                          {req.cnicNumber && (
                            <button
                              onClick={() => copyToClipboard(req.cnicNumber, 'CNIC')}
                              className="text-muted-foreground hover:text-foreground p-1"
                              title="Copy CNIC"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge
                          variant={statusVariants[displayStatus] || 'outline'}
                          className={`text-[10px] px-2.5 py-1 border font-bold uppercase tracking-wider rounded-full flex items-center gap-1 w-fit ${
                            displayStatus === KycStatus.APPROVED && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          } ${
                            displayStatus === KycStatus.PENDING && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          } ${
                            displayStatus === KycStatus.HOLD && 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                          } ${
                            displayStatus === KycStatus.REJECTED && 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}
                        >
                          {displayStatus === KycStatus.APPROVED && <Check className="h-3 w-3" />}
                          {displayStatus === KycStatus.PENDING && <Clock className="h-3 w-3" />}
                          {displayStatus === KycStatus.HOLD && <HelpCircle className="h-3 w-3" />}
                          {displayStatus === KycStatus.REJECTED && <X className="h-3 w-3" />}
                          <span>{statusLabels[displayStatus] || displayStatus}</span>
                        </Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-muted-foreground text-xs font-medium">
                        {formatDate(req.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-4 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Primary Review Button */}
                          <Button
                            onClick={() => handleInspect(req.id)}
                            className="text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs bg-[#185500] text-white hover:bg-[#1e6b00] dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-8"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Audit
                          </Button>

                          {/* Quick Action Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border">
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">Quick Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => handleInspect(req.id)}
                                className="text-xs font-medium cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 mr-2 text-primary" /> Full Inspection Dossier
                              </DropdownMenuItem>

                              {displayStatus !== KycStatus.APPROVED && (
                                <DropdownMenuItem
                                  onClick={() => openActionModal('APPROVE', req)}
                                  className="text-xs font-medium text-emerald-600 focus:text-emerald-600 cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-2" /> Approve Verification
                                </DropdownMenuItem>
                              )}

                              {displayStatus !== KycStatus.HOLD && (
                                <DropdownMenuItem
                                  onClick={() => openActionModal('HOLD', req)}
                                  className="text-xs font-medium text-orange-600 focus:text-orange-600 cursor-pointer"
                                >
                                  <HelpCircle className="h-3.5 w-3.5 mr-2" /> Put on Hold
                                </DropdownMenuItem>
                              )}

                              {displayStatus !== KycStatus.REJECTED && (
                                <DropdownMenuItem
                                  onClick={() => openActionModal('REJECT', req)}
                                  className="text-xs font-medium text-red-600 focus:text-red-600 cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5 mr-2" /> Reject Application
                                </DropdownMenuItem>
                              )}

                              {(displayStatus === KycStatus.REJECTED || displayStatus === KycStatus.HOLD) && (
                                <DropdownMenuItem
                                  onClick={() => handleReopen(req)}
                                  className="text-xs font-medium text-blue-600 focus:text-blue-600 cursor-pointer"
                                >
                                  <RotateCw className="h-3.5 w-3.5 mr-2" /> Re-evaluate / Move to Review
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium">
              Showing page <span className="font-bold text-foreground">{page}</span> of{' '}
              <span className="font-bold text-foreground">{lastPage}</span> ({total} total requests)
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-lg border-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 rounded-lg border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>


      {/* ========================================================================= */}
      {/* EXECUTIVE VERIFICATION INSPECTOR DIALOG (THE AUDIT SUITE)                 */}
      {/* ========================================================================= */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar bg-background border-border text-foreground rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-6 w-6 text-[#185500] dark:text-emerald-400" />
                Executive Verification Dossier
              </DialogTitle>
              {detailedRequest && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs px-3 py-1 font-bold uppercase tracking-wider rounded-full ${
                      detailedRequest.status === KycStatus.APPROVED && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    } ${
                      detailedRequest.status === KycStatus.PENDING && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    } ${
                      detailedRequest.status === KycStatus.HOLD && 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                    } ${
                      detailedRequest.status === KycStatus.REJECTED && 'bg-red-500/10 text-red-600 border-red-500/20'
                    }`}
                  >
                    {statusLabels[detailedRequest.status] || detailedRequest.status}
                  </Badge>
                </div>
              )}
            </div>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Audit the registry details, official certificates, CNIC scans, and biometric proof below.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 space-y-6">
              <div className="flex gap-4 items-center">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Skeleton className="h-32 rounded-xl" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            </div>
          ) : !detailedRequest ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="font-semibold">Unable to load verification record.</p>
            </div>
          ) : (
            <div className="py-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between bg-muted/40 border border-border p-4 rounded-2xl">
                <div className="flex gap-3.5 items-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#185500] to-emerald-700 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-sm">
                    {detailedRequest.ngoName ? detailedRequest.ngoName.charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{detailedRequest.ngoName}</h2>
                    {detailedRequest.publicName && (
                      <p className="text-xs text-muted-foreground font-medium">Public Title: {detailedRequest.publicName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground font-mono">Dossier ID: {detailedRequest.id}</span>
                      <button
                        onClick={() => copyToClipboard(detailedRequest.id, 'Dossier ID')}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right flex flex-col justify-center">
                  <span className="text-xs text-muted-foreground font-medium">Submitted Timestamp</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5">{formatDate(detailedRequest.createdAt)}</span>
                </div>
              </div>

              {/* Status Alert Banners */}
              {detailedRequest.status === KycStatus.REJECTED && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Application Declined / Rejected
                  </span>
                  <p className="text-sm mt-1">
                    <strong>Rejection Reason:</strong> {detailedRequest.rejectionReason || 'No specific reason specified.'}
                  </p>
                </div>
              )}

              {(detailedRequest.status === KycStatus.HOLD || detailedRequest.rejectionReason?.startsWith('[ON HOLD]')) && (
                <div className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4" /> Application Placed Under Review / On Hold
                  </span>
                  <p className="text-sm mt-1">
                    <strong>Administrative Note:</strong> {detailedRequest.rejectionReason?.replace('[ON HOLD]', '').trim() || detailedRequest.adminNotes || 'Audit in progress.'}
                  </p>
                </div>
              )}

              {detailedRequest.status === KycStatus.APPROVED && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Verified Platform Accreditation Active
                  </span>
                  <p className="text-sm">
                    This organization profile is fully authenticated and holds legal clearance for Doneto campaigns.
                  </p>
                </div>
              )}

              {/* Segmented Audit Tabs */}
              <Tabs value={inspectorTab} onValueChange={setInspectorTab} className="w-full">
                <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-xl h-10">
                  <TabsTrigger value="org" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <Building2 className="h-3.5 w-3.5 mr-1.5" /> Org Profile
                  </TabsTrigger>
                  <TabsTrigger value="rep" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <UserIcon className="h-3.5 w-3.5 mr-1.5" /> Representative
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Scans & Proofs
                  </TabsTrigger>
                  <TabsTrigger value="compliance" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <ListChecks className="h-3.5 w-3.5 mr-1.5" /> Checklist & Audit
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: Organization Profile */}
                <TabsContent value="org" className="space-y-4 pt-3">
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-3.5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">NGO Registration Number</span>
                        <span className="font-mono font-bold text-sm text-foreground">{detailedRequest.ngoRegistrationNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Registration Authority</span>
                        <span className="font-semibold text-sm text-foreground">{detailedRequest.registrationAuthority || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Registration Type</span>
                        <span className="font-semibold text-sm text-foreground">{detailedRequest.registrationType || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Established Year</span>
                        <span className="font-semibold text-sm text-foreground">{detailedRequest.yearEstablished || 'N/A'}</span>
                      </div>
                    </div>

                    {detailedRequest.categories && detailedRequest.categories.length > 0 && (
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-xs text-muted-foreground block font-medium mb-1.5">Registered Sectors & Categories</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailedRequest.categories.map((c: string) => (
                            <Badge key={c} variant="outline" className="text-[11px] bg-muted/60 border-border text-foreground font-semibold px-2.5 py-0.5">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailedRequest.missionStatement && (
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-xs text-muted-foreground block font-medium mb-1">Mission Statement</span>
                        <p className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border/50 italic leading-relaxed">
                          &ldquo;{detailedRequest.missionStatement}&rdquo;
                        </p>
                      </div>
                    )}

                    {detailedRequest.organizationDescription && (
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-xs text-muted-foreground block font-medium mb-1">Organization Overview</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {detailedRequest.organizationDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 2: Representative Information */}
                <TabsContent value="rep" className="space-y-4 pt-3">
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-3.5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Representative Full Name</span>
                        <span className="font-bold text-sm text-foreground">{detailedRequest.representativeFullName || detailedRequest.user?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">CNIC Number</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-sm text-foreground bg-muted px-2 py-0.5 rounded">
                            {detailedRequest.cnicNumber || 'N/A'}
                          </span>
                          {detailedRequest.cnicNumber && (
                            <button
                              onClick={() => copyToClipboard(detailedRequest.cnicNumber, 'CNIC')}
                              className="text-muted-foreground hover:text-foreground"
                              title="Copy CNIC"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Designation / Title</span>
                        <span className="font-semibold text-sm text-foreground">{detailedRequest.representativeDesignation || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Position in NGO</span>
                        <span className="font-semibold text-sm text-foreground">{detailedRequest.positionInNgo || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Account Email</span>
                        <span className="font-semibold text-sm text-foreground">{detailedRequest.user?.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Contact for Accreditation</span>
                        <span className="font-semibold text-sm text-foreground">{detailedRequest.contactForAccreditation || detailedRequest.user?.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>

                    {detailedRequest.user?.address && (
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-xs text-muted-foreground block font-medium">Registered Address</span>
                        <span className="text-xs text-foreground">{detailedRequest.user.address}</span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 3: Official Scans & Documents */}
                <TabsContent value="docs" className="space-y-4 pt-3">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    
                    {/* 1. Registration Certificate */}
                    <Card className="bg-muted/30 border-border rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legal Document</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">PDF/Scan</Badge>
                        </div>
                        <span className="font-bold text-xs text-foreground block">Registration Certificate</span>
                      </div>

                      {detailedRequest.registrationCertificate ? (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewMediaUrl(getFileUrl(detailedRequest.registrationCertificate));
                              setPreviewMediaTitle('NGO Registration Certificate');
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="text-xs flex-1 h-8 rounded-lg"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground">
                            <a href={getFileUrl(detailedRequest.registrationCertificate)} target="_blank" rel="noreferrer" title="Open in new tab">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-3 italic block">Not Uploaded</span>
                      )}
                    </Card>

                    {/* 2. NTN Certificate */}
                    <Card className="bg-muted/30 border-border rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tax Document</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">FBR/Tax</Badge>
                        </div>
                        <span className="font-bold text-xs text-foreground block">NTN Certificate</span>
                      </div>

                      {detailedRequest.ntnCertificate ? (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewMediaUrl(getFileUrl(detailedRequest.ntnCertificate));
                              setPreviewMediaTitle('NTN Tax Certificate');
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="text-xs flex-1 h-8 rounded-lg"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground">
                            <a href={getFileUrl(detailedRequest.ntnCertificate)} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-3 italic block">Not Uploaded</span>
                      )}
                    </Card>

                    {/* 3. Proof of Affiliation */}
                    <Card className="bg-muted/30 border-border rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Authorization</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">Proof</Badge>
                        </div>
                        <span className="font-bold text-xs text-foreground block">Proof of Affiliation</span>
                      </div>

                      {detailedRequest.proofOfAffiliation ? (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewMediaUrl(getFileUrl(detailedRequest.proofOfAffiliation));
                              setPreviewMediaTitle('Proof of Affiliation');
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="text-xs flex-1 h-8 rounded-lg"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground">
                            <a href={getFileUrl(detailedRequest.proofOfAffiliation)} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-3 italic block">Not Uploaded</span>
                      )}
                    </Card>

                    {/* 4. CNIC Front Scan */}
                    <Card className="bg-muted/30 border-border rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Identity Scan</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">Front Side</Badge>
                        </div>
                        <span className="font-bold text-xs text-foreground block">CNIC Front Side</span>
                      </div>

                      {detailedRequest.cnicFrontImage ? (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewMediaUrl(getFileUrl(detailedRequest.cnicFrontImage));
                              setPreviewMediaTitle('CNIC Front Side Scan');
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="text-xs flex-1 h-8 rounded-lg"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground">
                            <a href={getFileUrl(detailedRequest.cnicFrontImage)} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-3 italic block">Not Uploaded</span>
                      )}
                    </Card>

                    {/* 5. CNIC Back Scan */}
                    <Card className="bg-muted/30 border-border rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Identity Scan</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">Back Side</Badge>
                        </div>
                        <span className="font-bold text-xs text-foreground block">CNIC Back Side</span>
                      </div>

                      {detailedRequest.cnicBackImage ? (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewMediaUrl(getFileUrl(detailedRequest.cnicBackImage));
                              setPreviewMediaTitle('CNIC Back Side Scan');
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="text-xs flex-1 h-8 rounded-lg"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground">
                            <a href={getFileUrl(detailedRequest.cnicBackImage)} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-3 italic block">Not Uploaded</span>
                      )}
                    </Card>

                    {/* 6. Selfie Biometric Scan */}
                    <Card className="bg-muted/30 border-border rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Biometric</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">Facial Scan</Badge>
                        </div>
                        <span className="font-bold text-xs text-foreground block">Biometric Selfie</span>
                      </div>

                      {detailedRequest.selfieImage ? (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewMediaUrl(getFileUrl(detailedRequest.selfieImage));
                              setPreviewMediaTitle('Biometric Selfie Scan');
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="text-xs flex-1 h-8 rounded-lg"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" /> Inspect
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground">
                            <a href={getFileUrl(detailedRequest.selfieImage)} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-3 italic block">Not Uploaded</span>
                      )}
                    </Card>

                  </div>
                </TabsContent>

                {/* TAB 4: Compliance Checklist & Audit History */}
                <TabsContent value="compliance" className="space-y-4 pt-3">
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-4">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      Admin Compliance Verification Checklist
                    </span>

                    <div className="space-y-2.5">
                      <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={checklist.identityMatch}
                          onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, identityMatch: !!c }))}
                        />
                        <div className="text-xs">
                          <span className="font-bold block text-foreground">1. CNIC Identity Authenticity</span>
                          <span className="text-muted-foreground text-[11px]">Representative name and CNIC number match government registry.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={checklist.biometricMatch}
                          onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, biometricMatch: !!c }))}
                        />
                        <div className="text-xs">
                          <span className="font-bold block text-foreground">2. Biometric Facial Verification</span>
                          <span className="text-muted-foreground text-[11px]">Selfie photo clearly matches the CNIC document photo.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={checklist.regDocValid}
                          onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, regDocValid: !!c }))}
                        />
                        <div className="text-xs">
                          <span className="font-bold block text-foreground">3. Official NGO Registration Validity</span>
                          <span className="text-muted-foreground text-[11px]">Certificate is unexpired and matches authority registration database.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={checklist.taxValid}
                          onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, taxValid: !!c }))}
                        />
                        <div className="text-xs">
                          <span className="font-bold block text-foreground">4. NTN / Tax Documentation Check</span>
                          <span className="text-muted-foreground text-[11px]">Tax identification matches the organization name.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer">
                        <Checkbox
                          checked={checklist.repAuthorized}
                          onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, repAuthorized: !!c }))}
                        />
                        <div className="text-xs">
                          <span className="font-bold block text-foreground">5. Representative Authorization</span>
                          <span className="text-muted-foreground text-[11px]">Position in NGO gives authority to collect charitable donations.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Bar inside Inspector */}
              <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
                {detailedRequest.status !== KycStatus.APPROVED && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openActionModal('HOLD', detailedRequest)}
                      className="text-orange-600 border-orange-500/30 hover:bg-orange-500/10 rounded-xl h-10 px-4 text-xs font-bold"
                    >
                      <HelpCircle className="h-4 w-4 mr-1.5" /> Put on Hold
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openActionModal('REJECT', detailedRequest)}
                      className="text-red-600 border-red-500/30 hover:bg-red-500/10 rounded-xl h-10 px-4 text-xs font-bold"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Reject Request
                    </Button>

                    <Button
                      type="button"
                      onClick={() => openActionModal('APPROVE', detailedRequest)}
                      className="bg-[#185500] hover:bg-[#1e6b00] text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl h-10 px-5 text-xs font-bold shadow-md"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve Verification
                    </Button>
                  </>
                )}

                {(detailedRequest.status === KycStatus.APPROVED || detailedRequest.status === KycStatus.REJECTED) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleReopen(detailedRequest)}
                    className="border-border text-foreground hover:bg-muted rounded-xl h-10 px-4 text-xs font-bold"
                  >
                    <RotateCw className="h-4 w-4 mr-1.5" /> Re-evaluate / Move to Review
                  </Button>
                )}
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* ========================================================================= */}
      {/* ACTION CONFIRMATION MODAL (APPROVE / REJECT / HOLD)                        */}
      {/* ========================================================================= */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="max-w-md bg-background border-border text-foreground rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {actionType === 'APPROVE' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {actionType === 'HOLD' && <HelpCircle className="h-5 w-5 text-orange-600" />}
              {actionType === 'REJECT' && <XCircle className="h-5 w-5 text-red-600" />}
              <span>
                {actionType === 'APPROVE' && 'Approve KYC Verification'}
                {actionType === 'HOLD' && 'Put Verification on Hold'}
                {actionType === 'REJECT' && 'Decline Verification Request'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {actionType === 'APPROVE' &&
                'Grant accredited verified status to this NGO on the platform and web application.'}
              {actionType === 'HOLD' &&
                'Place this application on hold while awaiting additional documentation or secondary background check.'}
              {actionType === 'REJECT' &&
                'Specify why the application is being rejected so the user can re-upload proper documents.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4 text-xs">
            {/* Quick Presets for Rejection */}
            {actionType === 'REJECT' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Quick Reason Presets</Label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {QUICK_REJECTION_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setActionReason(preset)}
                      className="text-[11px] text-left p-1.5 px-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Presets for Hold */}
            {actionType === 'HOLD' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Quick Hold Presets</Label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {QUICK_HOLD_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setActionReason(preset)}
                      className="text-[11px] text-left p-1.5 px-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason or Note Input */}
            <div className="space-y-1.5">
              <Label htmlFor="action-reason" className="text-xs font-bold">
                {actionType === 'APPROVE'
                  ? 'Audit Note (Optional)'
                  : actionType === 'HOLD'
                  ? 'Reason for Holding Application *'
                  : 'Rejection Reason *'}
              </Label>
              <Textarea
                id="action-reason"
                placeholder={
                  actionType === 'APPROVE'
                    ? 'Optional administrative clearance notes...'
                    : actionType === 'HOLD'
                    ? 'Explain what document or verification is pending...'
                    : 'Explain why the verification is being declined...'
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="bg-muted/40 border-border text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsActionModalOpen(false)}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={`rounded-xl text-xs font-bold h-9 text-white shadow-md ${
                actionType === 'APPROVE'
                  ? 'bg-[#185500] hover:bg-[#1e6b00] dark:bg-white dark:text-black dark:hover:bg-neutral-200'
                  : actionType === 'HOLD'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {actionLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {actionType === 'APPROVE' && 'Confirm Approval'}
              {actionType === 'HOLD' && 'Confirm Put on Hold'}
              {actionType === 'REJECT' && 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ========================================================================= */}
      {/* HIGH-RES DOCUMENT LIGHTBOX VIEWER WITH ZOOM & ROTATE                       */}
      {/* ========================================================================= */}
      <Dialog open={!!previewMediaUrl} onOpenChange={(open) => !open && setPreviewMediaUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] p-4 bg-background border-border text-foreground rounded-2xl shadow-2xl flex flex-col items-center">
          <DialogHeader className="w-full flex flex-row items-center justify-between pb-2 border-b border-border/60">
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {previewMediaTitle || 'Document Scan Preview'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                High-resolution document inspector
              </DialogDescription>
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1.5 mr-6">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="h-7 w-7 p-0 rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] font-mono text-muted-foreground px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="h-7 w-7 p-0 rounded-lg"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="h-7 w-7 p-0 rounded-lg"
                title="Rotate 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setZoomLevel(1);
                  setRotation(0);
                }}
                className="h-7 px-2 text-[10px] rounded-lg"
              >
                Reset
              </Button>

              {previewMediaUrl && (
                <Button asChild size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-lg ml-1">
                  <a href={previewMediaUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" /> Open Original
                  </a>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Media View Canvas */}
          <div className="w-full h-[68vh] flex items-center justify-center overflow-auto rounded-xl bg-black/5 dark:bg-black/50 p-4 my-2">
            {previewMediaUrl && isImageFile(previewMediaUrl) ? (
              <div
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-full max-w-full flex items-center justify-center"
              >
                <img
                  src={previewMediaUrl}
                  alt={previewMediaTitle}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg border border-border/40"
                />
              </div>
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
