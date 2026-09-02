'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Grid,
  List,
  MoreHorizontal,
  Pencil,
  Pause,
  Play,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Users,
  Eye,
  AlertCircle,
  Calendar,
  User,
  Mail,
  Phone,
  Video,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FolderHeart,
  Ban,
  Clock,
  Sparkles,
  ArrowUpRight
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Campaign {
  id: number;
  createdById: string;
  categoryId: number;
  categoryName: string;
  title: string;
  shortSummary: string | null;
  description: string;
  goalAmount: string;
  collectedAmount: string;
  startDate: string;
  endType: string;
  endDate: string | null;
  beneficiaryType: string | null;
  beneficiaryName: string | null;
  beneficiaryCity: string | null;
  beneficiaryProvince: string | null;
  beneficiaryCount: number | null;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  campaignStatus: 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  campaignImageId: string;
  imageUrl: string;
  additionalImages: Array<{ mediaId: string; url: string; fileName: string }>;
  video: { mediaId: string; url: string; fileName: string } | null;
  supportingDocuments: Array<{ mediaId: string; url: string; fileName: string; type: string }>;
  fundUsage: string | null;
  fundUsageTimeline: string | null;
  allowAnonymousDonations: boolean;
  acceptZakatDonations: boolean;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  rejectionReason: string | null;
}

interface Donor {
  id: number;
  donorName: string;
  amount: string;
  createdAt: string;
}

interface WithdrawalRequest {
  id: number;
  campaignId: number;
  amount: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason: string | null;
  createdAt: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  notes: string;
}

interface Category {
  id: number;
  name: string;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isNGO = user?.role === 'NGO';

  // Core campaigns lists and stats
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Layout and searching
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');

  // Detail Modal
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Donors sub-list
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [donorPage, setDonorPage] = useState(1);
  const [donorTotal, setDonorTotal] = useState(0);

  // Withdrawals sub-list
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');

  // Review Modal (Admin)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected'>('Approved');
  const [rejectionReason, setRejectionReason] = useState('');

  // Edit Modal (Admin/NGO)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBeneficiaryType, setEditBeneficiaryType] = useState('');
  const [editBeneficiaryName, setEditBeneficiaryName] = useState('');
  const [editBeneficiaryCity, setEditBeneficiaryCity] = useState('');
  const [editBeneficiaryProvince, setEditBeneficiaryProvince] = useState('');
  const [editBeneficiaryCount, setEditBeneficiaryCount] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editZakat, setEditZakat] = useState(false);
  const [editAnonymous, setEditAnonymous] = useState(false);

  // Withdraw request review Modal (Admin)
  const [isWithdrawReviewOpen, setIsWithdrawReviewOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [withdrawReviewStatus, setWithdrawReviewStatus] = useState<'Approved' | 'Rejected'>('Approved');
  const [withdrawRejectionReason, setWithdrawRejectionReason] = useState('');

  const fetchCampaignsAndStats = async () => {
    try {
      setLoading(true);
      // Fetch Campaigns
      const campResponse = await api.get('/fundraising-campaigns');
      const campData = campResponse.data.data || campResponse.data;
      setCampaigns(campData || []);

      // Fetch Stats
      const statsResponse = await api.get('/fundraising-campaigns/stats');
      const statsData = statsResponse.data.data || statsResponse.data;
      setStats(statsData);

      // Fetch Categories for Edit Selection
      const catResponse = await api.get('/campaign-categories');
      const catData = catResponse.data.data || catResponse.data;
      setCategories(catData || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to retrieve fundraising campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndStats();
  }, []);

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch = 
      camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camp.shortSummary && camp.shortSummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      camp.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || camp.campaignStatus === statusFilter;
    const matchesApproval = approvalFilter === 'ALL' || camp.approvalStatus === approvalFilter;

    return matchesSearch && matchesStatus && matchesApproval;
  });

  // Fetch campaign donors
  const fetchDonors = async (campaignId: number, pageNum: number) => {
    try {
      setDonorsLoading(true);
      const res = await api.get(`/fundraising-campaigns/${campaignId}/donors`, {
        params: { page: pageNum, limit: 5 }
      });
      const data = res.data.data || res.data;
      setDonors(data.data || []);
      setDonorTotal(data.total || 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load donors.');
    } finally {
      setDonorsLoading(false);
    }
  };

  // Fetch campaign withdrawal requests
  const fetchWithdrawals = async (campaignId: number) => {
    try {
      setWithdrawalsLoading(true);
      const res = await api.get(`/fundraising-campaigns/${campaignId}/withdraw-requests`);
      const data = res.data.data || res.data;
      setWithdrawals(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load withdrawal requests.');
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const handleOpenDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsOpen(true);
    setActiveTab('general');
    fetchDonors(campaign.id, 1);
    fetchWithdrawals(campaign.id);
  };

  const handleOpenReview = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setReviewStatus('Approved');
    setRejectionReason('');
    setIsReviewOpen(true);
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditTitle(campaign.title);
    setEditSummary(campaign.shortSummary || '');
    setEditDescription(campaign.description);
    setEditGoal(campaign.goalAmount);
    setEditCategory(String(campaign.categoryId));
    setEditBeneficiaryType(campaign.beneficiaryType || '');
    setEditBeneficiaryName(campaign.beneficiaryName || '');
    setEditBeneficiaryCity(campaign.beneficiaryCity || '');
    setEditBeneficiaryProvince(campaign.beneficiaryProvince || '');
    setEditBeneficiaryCount(String(campaign.beneficiaryCount || ''));
    setEditContactPerson(campaign.contactPerson || '');
    setEditContactEmail(campaign.contactEmail || '');
    setEditContactPhone(campaign.contactPhone || '');
    setEditZakat(campaign.acceptZakatDonations);
    setEditAnonymous(campaign.allowAnonymousDonations);
    setIsEditOpen(true);
  };

  // Moderator review submission (Admin only)
  const submitReview = async () => {
    if (!selectedCampaign) return;
    if (reviewStatus === 'Rejected' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/${selectedCampaign.id}/review`, {
        status: reviewStatus,
        rejectionReason: reviewStatus === 'Rejected' ? rejectionReason.trim() : undefined,
      });
      toast.success(`Campaign has been ${reviewStatus.toLowerCase()} successfully.`);
      setIsReviewOpen(false);
      fetchCampaignsAndStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit campaign review.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Toggle pause campaign status
  const handleTogglePause = async (campaign: Campaign) => {
    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/${campaign.id}/pause`);
      toast.success(`Campaign status updated successfully.`);
      fetchCampaignsAndStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update campaign state.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Complete campaign status
  const handleCompleteCampaign = async (campaign: Campaign) => {
    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/${campaign.id}/complete`);
      toast.success('Campaign marked as completed successfully.');
      fetchCampaignsAndStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to complete campaign.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Save edits (NGO/Admin)
  const saveCampaignEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/${selectedCampaign.id}`, {
        title: editTitle.trim(),
        shortSummary: editSummary.trim(),
        description: editDescription.trim(),
        goalAmount: parseFloat(editGoal),
        categoryId: parseInt(editCategory),
        beneficiaryType: editBeneficiaryType || undefined,
        beneficiaryName: editBeneficiaryName.trim() || undefined,
        beneficiaryCity: editBeneficiaryCity.trim() || undefined,
        beneficiaryProvince: editBeneficiaryProvince.trim() || undefined,
        beneficiaryCount: editBeneficiaryCount ? parseInt(editBeneficiaryCount) : undefined,
        contactPerson: editContactPerson.trim() || undefined,
        contactEmail: editContactEmail.trim() || undefined,
        contactPhone: editContactPhone.trim() || undefined,
        acceptZakatDonations: editZakat,
        allowAnonymousDonations: editAnonymous,
      });
      toast.success('Campaign details updated successfully.');
      setIsEditOpen(false);
      fetchCampaignsAndStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save campaign details.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Request withdrawal (NGO)
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please specify a valid withdrawal amount.');
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !accountTitle.trim()) {
      toast.error('All bank account details are required.');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.post(`/fundraising-campaigns/${selectedCampaign.id}/withdraw-requests`, {
        amount: parseFloat(withdrawAmount),
        notes: withdrawNotes.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountTitle: accountTitle.trim()
      });
      toast.success('Withdrawal request submitted successfully.');
      setIsWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setWithdrawNotes('');
      setBankName('');
      setAccountNumber('');
      setAccountTitle('');
      fetchWithdrawals(selectedCampaign.id);
      fetchCampaignsAndStats(); // refresh campaign stats/balance info
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Review withdrawal request (Admin only)
  const handleOpenWithdrawReview = (req: WithdrawalRequest) => {
    setSelectedWithdrawal(req);
    setWithdrawReviewStatus('Approved');
    setWithdrawRejectionReason('');
    setIsWithdrawReviewOpen(true);
  };

  const submitWithdrawReview = async () => {
    if (!selectedWithdrawal || !selectedCampaign) return;
    if (withdrawReviewStatus === 'Rejected' && !withdrawRejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.patch(`/fundraising-campaigns/withdraw-requests/${selectedWithdrawal.id}/review`, {
        status: withdrawReviewStatus,
        rejectionReason: withdrawReviewStatus === 'Rejected' ? withdrawRejectionReason.trim() : undefined,
      });
      toast.success(`Withdrawal request has been ${withdrawReviewStatus.toLowerCase()} successfully.`);
      setIsWithdrawReviewOpen(false);
      fetchWithdrawals(selectedCampaign.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Formatting helpers
  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'PKR 0.00';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Dynamic calculations for progress
  const getProgressPercentage = (collected: string, goal: string) => {
    const c = parseFloat(collected);
    const g = parseFloat(goal);
    if (!g || isNaN(c) || isNaN(g)) return 0;
    return Math.min(Math.round((c / g) * 100), 100);
  };

  // Derived stats
  const pendingCount = stats?.statusCounts?.filter((s: any) => s.approvalStatus === 'Pending')
    .reduce((sum: number, s: any) => sum + s.count, 0) || 0;

  const activeCount = stats?.statusCounts?.filter((s: any) => s.campaignStatus === 'Active' && s.approvalStatus === 'Approved')
    .reduce((sum: number, s: any) => sum + s.count, 0) || 0;

  const completedCount = stats?.statusCounts?.filter((s: any) => s.campaignStatus === 'Completed')
    .reduce((sum: number, s: any) => sum + s.count, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            All Campaigns
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? 'Audit, approve, and manage fundraising campaigns system-wide.' : 'Create, monitor, and manage your fundraising campaigns.'}
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card shadow-sm rounded-2xl p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-36" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Card 1 */}
          <Card className="bg-card shadow-sm rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <FolderHeart className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalCampaigns || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Submitted in total</p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="bg-card shadow-sm rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-650">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently raising funds</p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="bg-card shadow-sm rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting Review</CardTitle>
              <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires approval audit</p>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="bg-card shadow-sm rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Funds Raised</CardTitle>
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(stats?.totalCollectedAmount || '0')}</div>
              <p className="text-xs text-muted-foreground mt-1">Goal: {formatCurrency(stats?.totalGoalAmount || '0')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Searching Toolbar */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border border-input bg-muted/50 hover:bg-muted focus:bg-background text-foreground placeholder:text-muted-foreground dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08]"
            />
          </div>

          {/* Selection filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Approval</Label>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-[140px] rounded-xl border border-input bg-muted/50 text-foreground dark:border-0 dark:bg-white/[0.05]">
                  <SelectValue placeholder="Approval Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground dark:border-0">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-xl border border-input bg-muted/50 text-foreground dark:border-0 dark:bg-white/[0.05]">
                  <SelectValue placeholder="Campaign Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground dark:border-0">
                  <SelectItem value="ALL">All States</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Layout view buttons */}
            <div className="flex items-center border border-border/60 rounded-xl overflow-hidden p-1 bg-muted/50 dark:border-0 dark:bg-white/[0.05]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('table')}
                className={`h-8 w-8 rounded-lg ${viewMode === 'table' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card p-4 space-y-4">
              <Skeleton className="h-40 rounded-xl w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl bg-muted/20 p-12 text-center text-muted-foreground max-w-xl mx-auto shadow-sm">
          <AlertCircle className="h-10 w-10 mx-auto text-primary mb-4" />
          <h3 className="font-semibold text-lg text-foreground mb-2">No campaigns found</h3>
          <p className="text-sm">Try broadening your search criteria or review the filters settings.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((camp) => {
            const percentage = getProgressPercentage(camp.collectedAmount, camp.goalAmount);
            return (
              <Card 
                key={camp.id} 
                className="group relative overflow-hidden bg-card shadow-sm rounded-2xl flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {camp.imageUrl ? (
                    <img 
                      src={camp.imageUrl} 
                      alt={camp.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
                      <FolderHeart className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                  {/* Category overlay badge */}
                  <Badge className="absolute top-3 left-3 bg-indigo-600/90 hover:bg-indigo-600 border-none backdrop-blur-md rounded-lg py-1 px-2.5 text-white">
                    {camp.categoryName}
                  </Badge>

                  {/* Status Overlay Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    <Badge 
                      className={`border-none rounded-lg py-1 px-2.5 backdrop-blur-md font-semibold text-[10px] ${
                        camp.campaignStatus === 'Active' ? 'bg-emerald-500/80 text-emerald-50' :
                        camp.campaignStatus === 'Paused' ? 'bg-amber-500/80 text-amber-50' :
                        camp.campaignStatus === 'Completed' ? 'bg-blue-500/80 text-blue-50' :
                        'bg-rose-500/80 text-rose-50'
                      }`}
                    >
                      {camp.campaignStatus}
                    </Badge>
                    <Badge 
                      className={`border-none rounded-lg py-0.5 px-2.5 backdrop-blur-md font-semibold text-[9px] ${
                        camp.approvalStatus === 'Approved' ? 'bg-emerald-600/90 text-white' :
                        camp.approvalStatus === 'Pending' ? 'bg-amber-500/90 text-white animate-pulse' :
                        'bg-rose-600/90 text-white'
                      }`}
                    >
                      {camp.approvalStatus}
                    </Badge>
                  </div>
                </div>

                {/* Content info */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground leading-snug line-clamp-1">
                      {camp.title}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 min-h-[32px]">
                      {camp.shortSummary || 'No summary available.'}
                    </p>
                  </div>

                  {/* Progress info */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Raised: <strong className="text-foreground">{formatCurrency(camp.collectedAmount)}</strong></span>
                      <span className="text-primary">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-1.5 bg-muted" />
                    <div className="text-[10px] text-muted-foreground flex justify-between">
                      <span>Goal: {formatCurrency(camp.goalAmount)}</span>
                      <span>Ends: {formatDate(camp.endDate) || 'Manual completion'}</span>
                    </div>
                  </div>
                </CardContent>

                {/* Card Actions Footer */}
                <div className="p-5 pt-4 flex items-center justify-between border-t border-border bg-muted/20">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleOpenDetails(camp)} 
                    className="text-xs hover:text-primary flex items-center gap-1.5 py-0 px-2 h-9 text-muted-foreground hover:bg-muted rounded-xl"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {/* Action Quickbuttons */}
                    {isAdmin && camp.approvalStatus === 'Pending' && (
                      <Button
                        onClick={() => handleOpenReview(camp)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-[11px] h-8 rounded-xl px-3 flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Audit
                      </Button>
                    )}

                    {/* Options drop menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover text-popover-foreground min-w-[160px]">
                        <DropdownMenuLabel className="text-muted-foreground">Campaign Options</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        
                        <DropdownMenuItem onClick={() => handleOpenDetails(camp)} className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-muted">
                          <Eye className="h-4 w-4 text-muted-foreground" /> View Audit details
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleOpenEdit(camp)} className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-muted">
                          <Pencil className="h-4 w-4 text-muted-foreground" /> Edit Campaign
                        </DropdownMenuItem>

                        {/* Moderation pauses */}
                        {camp.approvalStatus === 'Approved' && (
                          <>
                            <DropdownMenuItem onClick={() => handleTogglePause(camp)} className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-muted">
                              {camp.campaignStatus === 'Paused' ? (
                                <>
                                  <Play className="h-4 w-4 text-emerald-600" /> Resume Campaign
                                  </>
                              ) : (
                                <>
                                  <Pause className="h-4 w-4 text-amber-500" /> Pause Campaign
                                </>
                              )}
                            </DropdownMenuItem>

                            {camp.campaignStatus !== 'Completed' && (
                              <DropdownMenuItem onClick={() => handleCompleteCampaign(camp)} className="flex items-center gap-2 rounded-lg cursor-pointer text-blue-600 hover:bg-muted focus:text-blue-500">
                                <CheckCircle className="h-4 w-4" /> Mark Completed
                              </DropdownMenuItem>
                            )}
                          </>
                        )}

                        {isAdmin && camp.approvalStatus === 'Pending' && (
                          <DropdownMenuItem onClick={() => handleOpenReview(camp)} className="flex items-center gap-2 rounded-lg cursor-pointer text-yellow-600 hover:bg-muted">
                            <Sparkles className="h-4 w-4" /> Review approval
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="bg-card shadow-sm rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold">Title</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Category</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Goal</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Collected</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Approval</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Created Date</TableHead>
                <TableHead className="text-right text-muted-foreground font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((camp) => (
                <TableRow key={camp.id} className="border-b border-border hover:bg-muted/50 text-muted-foreground">
                  <TableCell className="font-semibold text-foreground max-w-xs truncate">{camp.title}</TableCell>
                  <TableCell>{camp.categoryName}</TableCell>
                  <TableCell>{formatCurrency(camp.goalAmount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-600">{formatCurrency(camp.collectedAmount)}</span>
                      <span className="text-[10px] text-muted-foreground">({getProgressPercentage(camp.collectedAmount, camp.goalAmount)}%)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`border-none rounded-lg font-semibold py-0.5 px-2 ${
                        camp.approvalStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-600' :
                        camp.approvalStatus === 'Pending' ? 'bg-amber-500/20 text-amber-600 animate-pulse' :
                        'bg-rose-500/20 text-rose-600'
                      }`}
                    >
                      {camp.approvalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`border-none rounded-lg font-semibold py-0.5 px-2 ${
                        camp.campaignStatus === 'Active' ? 'bg-emerald-500/25 text-emerald-600' :
                        camp.campaignStatus === 'Paused' ? 'bg-amber-500/25 text-amber-655' :
                        camp.campaignStatus === 'Completed' ? 'bg-blue-500/25 text-blue-600' :
                        'bg-rose-500/25 text-rose-600'
                      }`}
                    >
                      {camp.campaignStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(camp.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(camp)} className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(camp)} className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover text-popover-foreground">
                          {camp.approvalStatus === 'Approved' && (
                            <>
                              <DropdownMenuItem onClick={() => handleTogglePause(camp)} className="cursor-pointer hover:bg-muted">
                                {camp.campaignStatus === 'Paused' ? 'Resume' : 'Pause'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCompleteCampaign(camp)} className="cursor-pointer text-blue-500 hover:bg-muted">
                                Mark Completed
                              </DropdownMenuItem>
                            </>
                          )}
                          {isAdmin && camp.approvalStatus === 'Pending' && (
                            <DropdownMenuItem onClick={() => handleOpenReview(camp)} className="cursor-pointer text-yellow-600 hover:bg-muted">
                              Audit Review
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* --------------------- MODALS & DIALOGS --------------------- */}

      {/* 1. CAMPAIGN DETAILS DIALOG */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl border-border bg-background text-foreground rounded-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col shadow-2xl">
          {selectedCampaign && (
            <>
              {/* Header Title with image/gradient background */}
              <div className="relative p-6 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-900 flex justify-between items-start border-b border-border">
                <div className="space-y-1 max-w-[80%]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-650 bg-indigo-500/10 dark:text-indigo-400 py-1 px-2.5 rounded-lg border border-indigo-500/25">
                    {selectedCampaign.categoryName}
                  </span>
                  <DialogTitle className="text-2xl font-bold tracking-tight line-clamp-1">{selectedCampaign.title}</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs line-clamp-1 mt-1">
                    Created by NGO ID: {selectedCampaign.createdById} &bull; Submitted: {formatDate(selectedCampaign.createdAt)}
                  </DialogDescription>
                </div>
                {/* Big status badges */}
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <Badge 
                    className={`border-none rounded-lg text-xs font-semibold py-1 px-3 ${
                      selectedCampaign.campaignStatus === 'Active' ? 'bg-emerald-500 text-white' :
                      selectedCampaign.campaignStatus === 'Paused' ? 'bg-amber-500 text-white' :
                      selectedCampaign.campaignStatus === 'Completed' ? 'bg-blue-500 text-white' :
                      'bg-rose-500 text-white'
                    }`}
                  >
                    {selectedCampaign.campaignStatus}
                  </Badge>
                  <Badge 
                    className={`border-none rounded-lg text-[10px] font-semibold py-0.5 px-2 ${
                      selectedCampaign.approvalStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/20' :
                      selectedCampaign.approvalStatus === 'Pending' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/20' :
                      'bg-rose-500/20 text-rose-600 border border-rose-500/20'
                    }`}
                  >
                    {selectedCampaign.approvalStatus}
                  </Badge>
                </div>
              </div>

              {/* Tab Selector Nav */}
              <div className="px-6 border-b border-border bg-muted/20">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start bg-transparent border-none p-0 h-12 flex gap-4">
                    <TabsTrigger value="general" className="relative h-full bg-transparent px-1 pb-3 pt-3 text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground">General Info</TabsTrigger>
                    <TabsTrigger value="media" className="relative h-full bg-transparent px-1 pb-3 pt-3 text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground">Media & Docs</TabsTrigger>
                    <TabsTrigger value="donors" className="relative h-full bg-transparent px-1 pb-3 pt-3 text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground">Donors list</TabsTrigger>
                    <TabsTrigger value="withdrawals" className="relative h-full bg-transparent px-1 pb-3 pt-3 text-sm font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground">Withdrawals</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Scrollable Contents area */}
              <div className="p-6 overflow-y-auto max-h-[50vh] flex-1 no-scrollbar">
                {activeTab === 'general' && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Short Summary</Label>
                        <p className="text-sm mt-1 text-foreground bg-muted/40 border border-border rounded-xl p-3">{selectedCampaign.shortSummary || 'No short summary provided.'}</p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Description</Label>
                        <div className="text-sm mt-1 text-foreground bg-muted/40 border border-border rounded-xl p-4 min-h-[120px] max-h-[220px] overflow-y-auto leading-relaxed">
                          {selectedCampaign.description}
                        </div>
                      </div>

                      {selectedCampaign.rejectionReason && (
                        <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 text-rose-600 space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                            <XCircle className="h-4 w-4" />
                            Rejection Audit Notes
                          </div>
                          <p className="text-xs">{selectedCampaign.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Financial info widget */}
                      <div className="bg-muted/40 border border-border rounded-xl p-4 grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Collected Amount</Label>
                          <div className="text-lg font-bold text-emerald-650 mt-0.5">{formatCurrency(selectedCampaign.collectedAmount)}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Goal Target</Label>
                          <div className="text-lg font-bold text-foreground mt-0.5">{formatCurrency(selectedCampaign.goalAmount)}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                            <span>Campaign funding progress</span>
                            <span>{getProgressPercentage(selectedCampaign.collectedAmount, selectedCampaign.goalAmount)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(selectedCampaign.collectedAmount, selectedCampaign.goalAmount)} className="h-2 bg-muted" />
                        </div>
                      </div>

                      {/* Campaign parameters */}
                      <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground block">Beneficiary type</span>
                            <span className="font-semibold text-foreground mt-0.5 block">{selectedCampaign.beneficiaryType || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Beneficiary name</span>
                            <span className="font-semibold text-foreground mt-0.5 block">{selectedCampaign.beneficiaryName || 'Not specified'}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground block">City / Province</span>
                            <span className="font-semibold text-foreground mt-0.5 block">
                              {selectedCampaign.beneficiaryCity && selectedCampaign.beneficiaryProvince 
                                ? `${selectedCampaign.beneficiaryCity}, ${selectedCampaign.beneficiaryProvince}`
                                : 'Not specified'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground block">Duration Type</span>
                            <span className="font-semibold text-foreground mt-0.5 block">{selectedCampaign.endType}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground block">Starts / Ends At</span>
                            <span className="font-semibold text-foreground mt-0.5 block">
                              {formatDate(selectedCampaign.startDate)} - {formatDate(selectedCampaign.endDate) || 'Manual completion'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground block">Accepts Zakat</span>
                            <span className="font-semibold text-foreground mt-0.5 block">{selectedCampaign.acceptZakatDonations ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">Campaign Point of Contact</span>
                        <div className="space-y-1.5 text-xs text-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{selectedCampaign.contactPerson || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{selectedCampaign.contactEmail || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{selectedCampaign.contactPhone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'media' && (
                  <div className="space-y-6 text-foreground">
                    {/* Images Section */}
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Campaign Photos</Label>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-border">
                          <img src={selectedCampaign.imageUrl} alt="Cover image" className="h-full w-full object-cover" />
                          <div className="absolute bottom-2 left-2 bg-slate-950/70 py-0.5 px-2 text-[9px] rounded text-primary">Cover Photo</div>
                        </div>
                        {selectedCampaign.additionalImages?.map((img, i) => (
                          <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-border">
                            <img src={img.url} alt={`Image ${i}`} className="h-full w-full object-cover" />
                            <a href={img.url} target="_blank" rel="noreferrer" className="absolute top-2 right-2 bg-slate-950/70 p-1 rounded-lg hover:text-primary transition-colors text-white">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Supporting Documents Section */}
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Verified Supporting Documents</Label>
                      {selectedCampaign.supportingDocuments?.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground bg-muted/40 border border-dashed border-border rounded-xl p-6">
                          No supporting documentation attached.
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedCampaign.supportingDocuments?.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-muted/40 border border-border rounded-xl p-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 text-indigo-650 rounded-lg">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5 text-xs">
                                  <p className="font-semibold text-foreground truncate max-w-[200px]">{doc.fileName}</p>
                                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 text-[9px] py-0 px-1 rounded-sm">
                                    {doc.type}
                                  </Badge>
                                </div>
                              </div>
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 bg-muted hover:bg-primary/20 hover:text-primary rounded-lg text-muted-foreground text-xs flex items-center gap-1 transition-colors"
                              >
                                View File <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Video Section */}
                    {selectedCampaign.video && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Campaign Video Presentation</Label>
                        <div className="flex items-center justify-between bg-muted/40 border border-border rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                              <Video className="h-4 w-4" />
                            </div>
                            <div className="text-xs">
                              <p className="font-semibold text-foreground">{selectedCampaign.video.fileName}</p>
                              <p className="text-[10px] text-muted-foreground">Click to watch or download.</p>
                            </div>
                          </div>
                          <a href={selectedCampaign.video.url} target="_blank" rel="noreferrer" className="bg-primary hover:bg-primary/95 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm">
                            Play Video <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'donors' && (
                  <div className="space-y-4 text-foreground">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total donations: <strong className="text-foreground">{donorTotal}</strong></span>
                    </div>

                    {donorsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : donors.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground bg-muted/40 border border-dashed border-border rounded-xl p-8 text-muted-foreground">
                        No donations received yet for this campaign.
                      </div>
                    ) : (
                      <>
                        <div className="border border-border rounded-xl overflow-hidden bg-card">
                          <Table>
                            <TableHeader className="bg-muted/50 border-b border-border">
                              <TableRow className="border-b border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground text-xs font-semibold">Donor Name</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold">Amount Contributed</TableHead>
                                <TableHead className="text-muted-foreground text-xs font-semibold">Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {donors.map((donor) => (
                                <TableRow key={donor.id} className="border-b border-border hover:bg-muted/50 text-muted-foreground">
                                  <TableCell className="font-semibold text-foreground">{donor.donorName}</TableCell>
                                  <TableCell className="text-emerald-600 font-bold">{formatCurrency(donor.amount)}</TableCell>
                                  <TableCell className="text-muted-foreground text-xs">{formatDate(donor.createdAt)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Paginated list */}
                        {donorTotal > 5 && (
                          <div className="flex items-center justify-between pt-2">
                            <Button 
                              variant="ghost" 
                              onClick={() => {
                                setDonorPage((p) => Math.max(p - 1, 1));
                                fetchDonors(selectedCampaign.id, Math.max(donorPage - 1, 1));
                              }} 
                              disabled={donorPage === 1}
                              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">Page {donorPage} of {Math.ceil(donorTotal / 5)}</span>
                            <Button 
                              variant="ghost" 
                              onClick={() => {
                                const next = donorPage + 1;
                                setDonorPage(next);
                                fetchDonors(selectedCampaign.id, next);
                              }} 
                              disabled={donorPage >= Math.ceil(donorTotal / 5)}
                              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'withdrawals' && (
                  <div className="space-y-5 text-foreground">
                    {/* Add withdraw button for NGO */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground flex gap-1 items-center">
                        Collected: <strong className="text-foreground">{formatCurrency(selectedCampaign.collectedAmount)}</strong>
                      </span>
                      {isNGO && selectedCampaign.approvalStatus === 'Approved' && (
                        <Button 
                          onClick={() => setIsWithdrawDialogOpen(true)}
                          className="bg-primary hover:bg-primary/95 text-white py-1 px-3 text-xs rounded-xl shadow-md flex items-center gap-1.5 h-9"
                        >
                          <DollarSign className="h-4 w-4" /> Request Fund Withdrawal
                        </Button>
                      )}
                    </div>

                    {withdrawalsLoading ? (
                      <div className="space-y-2">
                        {[...Array(2)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : withdrawals.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground bg-muted/40 border border-dashed border-border rounded-xl p-8">
                        No withdrawal requests recorded.
                      </div>
                    ) : (
                      <div className="border border-border rounded-xl overflow-hidden bg-card">
                        <Table>
                          <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="border-b border-border">
                              <TableHead className="text-muted-foreground text-xs font-semibold">Amount</TableHead>
                              <TableHead className="text-muted-foreground text-xs font-semibold">Status</TableHead>
                              <TableHead className="text-muted-foreground text-xs font-semibold">Bank details</TableHead>
                              <TableHead className="text-muted-foreground text-xs font-semibold">Date</TableHead>
                              {isAdmin && <TableHead className="text-muted-foreground text-xs font-semibold text-right">Action</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {withdrawals.map((req) => (
                              <TableRow key={req.id} className="border-b border-border hover:bg-muted/50 text-xs text-muted-foreground">
                                <TableCell className="font-bold text-foreground text-sm">{formatCurrency(req.amount)}</TableCell>
                                <TableCell>
                                  <Badge 
                                    className={`border-none rounded-lg font-semibold py-0.5 px-2 ${
                                      req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-600' :
                                      req.status === 'Pending' ? 'bg-amber-500/20 text-amber-600 animate-pulse' :
                                      'bg-rose-500/20 text-rose-600'
                                    }`}
                                  >
                                    {req.status}
                                  </Badge>
                                  {req.rejectionReason && (
                                    <p className="text-[10px] text-rose-600 mt-1 max-w-[150px] truncate" title={req.rejectionReason}>
                                      {req.rejectionReason}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-foreground">{req.bankName}</p>
                                    <p className="text-[10px] text-muted-foreground">{req.accountTitle} &bull; {req.accountNumber}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                                {isAdmin && (
                                  <TableCell className="text-right">
                                    {req.status === 'Pending' ? (
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleOpenWithdrawReview(req)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg h-7 py-0 px-2 text-[10px]"
                                      >
                                        Audit Review
                                      </Button>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground">Audited</span>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button Footer */}
              <div className="p-4 bg-muted/50 flex justify-end border-t border-border gap-3">
                {isAdmin && selectedCampaign.approvalStatus === 'Pending' && (
                  <Button 
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenReview(selectedCampaign);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    Approve/Reject Campaign
                  </Button>
                )}
                <Button onClick={() => setIsDetailsOpen(false)} className="bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold py-2 px-4 rounded-xl">
                  Close Details
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. ADMIN MODERATOR REVIEW DIALOG */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md border-border bg-background text-foreground rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Audit Approval Review</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Approve or Reject the submitted campaign: &ldquo;{selectedCampaign?.title}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Select Decision</Label>
              <Select value={reviewStatus} onValueChange={(val: any) => setReviewStatus(val)}>
                <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  <SelectItem value="Approved" className="text-emerald-600">Approve Campaign</SelectItem>
                  <SelectItem value="Rejected" className="text-rose-600">Reject Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reviewStatus === 'Rejected' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Rejection Reason</Label>
                <Textarea
                  placeholder="Provide explicit reasons for the rejection of this campaign so the NGO knows what to fix..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="rounded-xl border-border bg-muted/50 hover:bg-muted focus:bg-muted text-sm text-foreground min-h-[100px] placeholder:text-muted-foreground"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="rounded-xl border border-border">Cancel</Button>
            <Button 
              onClick={submitReview}
              disabled={submitLoading}
              className={`rounded-xl px-5 py-2 font-semibold shadow-sm ${
                reviewStatus === 'Approved' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              }`}
            >
              {submitLoading ? 'Submitting...' : 'Record Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. REQUEST WITHDRAWAL DIALOG (NGO) */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="max-w-md border-border bg-background text-foreground rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Request Fund Disbursement</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Request payout disbursement of funds collected for campaign: &ldquo;{selectedCampaign?.title}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestWithdrawal} className="space-y-4 my-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-semibold">Amount to Withdraw (PKR)</Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                className="rounded-xl border-border bg-muted/50 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-semibold">Bank Name</Label>
                <Input
                  placeholder="e.g. Alfalah Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/50 text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-semibold">Account Title</Label>
                <Input
                  placeholder="e.g. NGO Welfare Trust"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/50 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-semibold">IBAN / Account Number</Label>
              <Input
                placeholder="PK00ALFH000000000000"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="rounded-xl border-border bg-muted/50 text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-semibold">Withdrawal Notes (Optional)</Label>
              <Textarea
                placeholder="Specify the utilization scope for the disbursed funds..."
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
                className="rounded-xl border-border bg-muted/50 text-foreground min-h-[60px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsWithdrawDialogOpen(false)} className="rounded-xl border border-border">Cancel</Button>
              <Button type="submit" disabled={submitLoading} className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl px-5 shadow-sm">
                {submitLoading ? 'Submitting...' : 'Disburse Funds'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. ADMIN WITHDRAWAL REVIEW DIALOG */}
      <Dialog open={isWithdrawReviewOpen} onOpenChange={setIsWithdrawReviewOpen}>
        <DialogContent className="max-w-md border-border bg-background text-foreground rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Audit Withdrawal Request</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Audit the payout request of {formatCurrency(selectedWithdrawal?.amount || '0')} for campaign &ldquo;{selectedCampaign?.title}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {selectedWithdrawal && (
              <div className="text-xs bg-muted/40 border border-border rounded-xl p-3 space-y-1.5 text-muted-foreground">
                <p><strong>Bank:</strong> {selectedWithdrawal.bankName}</p>
                <p><strong>Title:</strong> {selectedWithdrawal.accountTitle}</p>
                <p><strong>Number/IBAN:</strong> {selectedWithdrawal.accountNumber}</p>
                <p><strong>NGO Notes:</strong> {selectedWithdrawal.notes || 'None'}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Audit Action</Label>
              <Select value={withdrawReviewStatus} onValueChange={(val: any) => setWithdrawReviewStatus(val)}>
                <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                  <SelectItem value="Approved" className="text-emerald-600">Approve & Disburse</SelectItem>
                  <SelectItem value="Rejected" className="text-rose-600">Reject Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {withdrawReviewStatus === 'Rejected' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Specify Rejection Details</Label>
                <Textarea
                  placeholder="State guidelines or validation issues preventing withdrawal..."
                  value={withdrawRejectionReason}
                  onChange={(e) => setWithdrawRejectionReason(e.target.value)}
                  className="rounded-xl border-border bg-muted/50 text-foreground text-sm min-h-[80px]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsWithdrawReviewOpen(false)} className="rounded-xl border border-border">Cancel</Button>
            <Button 
              onClick={submitWithdrawReview}
              disabled={submitLoading}
              className={`rounded-xl px-5 py-2 font-semibold shadow-lg ${
                withdrawReviewStatus === 'Approved' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              }`}
            >
              {submitLoading ? 'Auditing...' : 'Confirm Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. EDIT CAMPAIGN DETAILS DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl border-border bg-background text-foreground rounded-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-900 border-b border-border shrink-0">
            <DialogTitle className="text-xl font-bold">Edit Campaign Details</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Modify details for campaign &ldquo;{selectedCampaign?.title}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveCampaignEdits} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs no-scrollbar">
            {/* Title / Summary */}
            <div className="space-y-1.5">
              <Label className="font-semibold text-muted-foreground">Campaign Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="rounded-xl border-border bg-muted/50 text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-muted-foreground">Short Summary</Label>
              <Input
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="rounded-xl border-border bg-muted/50 text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-muted-foreground">Description Details</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
                className="rounded-xl border-border bg-muted/50 text-foreground min-h-[100px]"
              />
            </div>

            {/* Target and category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold text-muted-foreground">Goal Amount Target (PKR)</Label>
                <Input
                  type="number"
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  required
                  className="rounded-xl border-border bg-muted/50 text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-muted-foreground">Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 text-foreground">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Beneficiary details */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-4">
              <span className="font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider block">Beneficiary Settings</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-semibold">Beneficiary Type</Label>
                  <Select value={editBeneficiaryType} onValueChange={setEditBeneficiaryType}>
                    <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 text-foreground">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Community">Community</SelectItem>
                      <SelectItem value="Organization">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-semibold">Beneficiary Name</Label>
                  <Input
                    value={editBeneficiaryName}
                    onChange={(e) => setEditBeneficiaryName(e.target.value)}
                    className="rounded-xl border-border bg-muted/50 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-semibold">City</Label>
                  <Input
                    value={editBeneficiaryCity}
                    onChange={(e) => setEditBeneficiaryCity(e.target.value)}
                    className="rounded-xl border-border bg-muted/50 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-semibold">Province</Label>
                  <Input
                    value={editBeneficiaryProvince}
                    onChange={(e) => setEditBeneficiaryProvince(e.target.value)}
                    className="rounded-xl border-border bg-muted/50 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground font-semibold">Count (Persons)</Label>
                  <Input
                    type="number"
                    value={editBeneficiaryCount}
                    onChange={(e) => setEditBeneficiaryCount(e.target.value)}
                    className="rounded-xl border-border bg-muted/50 text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* POC information */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
              <span className="font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider block">Point of Contact Details</span>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-muted-foreground font-semibold">POC Name</Label>
                    <Input
                      value={editContactPerson}
                      onChange={(e) => setEditContactPerson(e.target.value)}
                      className="rounded-xl border-border bg-muted/50 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-muted-foreground font-semibold">POC Email</Label>
                    <Input
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                      className="rounded-xl border-border bg-muted/50 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label className="text-muted-foreground font-semibold">POC Phone</Label>
                    <Input
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="rounded-xl border-border bg-muted/50 text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings checkboxes */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="zakat"
                  checked={editZakat}
                  onChange={(e) => setEditZakat(e.target.checked)}
                  className="accent-primary h-4 w-4 rounded"
                />
                <Label htmlFor="zakat" className="font-semibold text-foreground cursor-pointer">Accept Zakat contributions</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anon"
                  checked={editAnonymous}
                  onChange={(e) => setEditAnonymous(e.target.checked)}
                  className="accent-primary h-4 w-4 rounded"
                />
                <Label htmlFor="anon" className="font-semibold text-foreground cursor-pointer">Allow Anonymous donors</Label>
              </div>
            </div>

            <div className="p-4 bg-muted/50 flex justify-end gap-3 shrink-0 rounded-xl">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl border border-border">Cancel</Button>
              <Button type="submit" disabled={submitLoading} className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl px-5 shadow-sm">
                {submitLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
