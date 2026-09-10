'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  HeartHandshake,
  FolderHeart,
  RefreshCw,
  TrendingUp,
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
import { Progress } from '@/components/ui/progress';
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
import { broadcastModerationUpdate, subscribeToModerationUpdates } from '@/lib/realtime';

interface CampaignSummary {
  id: number | string;
  title: string;
  goalAmount: string | number;
  collectedAmount: string | number;
  categoryName?: string;
  campaignStatus: 'Active' | 'Paused' | 'Completed' | 'Cancelled' | string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string | null;
}

interface NgoCreatorUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  countryCode?: string;
  role: string;
  ngoName?: string;
  ngoRegistrationNumber?: string;
  positionInNgo?: string;
  directCorrespondentName?: string;
  contactForAccreditation?: string;
  isVerifiedRecipient: boolean;
  isVerified: boolean;
  accountStatus: string;
  createdAt: string;
  campaigns: CampaignSummary[];
  campaignsCount: number;
  totalRaised: number;
  totalGoal: number;
}

export default function NGOsPage() {
  const [ngos, setNgos] = useState<NgoCreatorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'WITH_CAMPAIGNS'>('ALL');
  const [selectedNgo, setSelectedNgo] = useState<NgoCreatorUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchNgosAndCampaigns = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      // Fetch all users and all fundraising campaigns concurrently
      const [usersRes, campaignsRes] = await Promise.all([
        api.get('/users?limit=200'),
        api.get('/fundraising-campaigns'),
      ]);

      const rawUsers = usersRes.data?.data?.data || usersRes.data?.data || usersRes.data || [];
      const userList: any[] = Array.isArray(rawUsers) ? rawUsers : [];

      const rawCampaigns = campaignsRes.data?.data || campaignsRes.data || [];
      const campaignList: any[] = Array.isArray(rawCampaigns) ? rawCampaigns : [];

      // Map campaigns by createdById
      const campaignsByUser: Record<string, CampaignSummary[]> = {};
      for (const camp of campaignList) {
        const creatorId = String(camp.createdById || camp.userId || '');
        if (creatorId) {
          if (!campaignsByUser[creatorId]) {
            campaignsByUser[creatorId] = [];
          }
          campaignsByUser[creatorId].push({
            id: camp.id,
            title: camp.title || 'Untitled Campaign',
            goalAmount: camp.goalAmount || 0,
            collectedAmount: camp.collectedAmount || 0,
            categoryName: camp.categoryName || 'General',
            campaignStatus: camp.campaignStatus || 'Active',
            approvalStatus: camp.approvalStatus || 'Pending',
            imageUrl: camp.imageUrl,
            startDate: camp.startDate,
            endDate: camp.endDate,
          });
        }
      }

      // Filter and build NGO / Campaign Creators list:
      // Includes:
      // 1. Users with role 'NGO' or 'Recipient'
      // 2. Users with ngoName populated
      // 3. Users who have created fundraising campaigns on the platform
      // 4. Verified platform accounts eligible for campaign operations
      const ngoItems: NgoCreatorUser[] = [];

      for (const u of userList) {
        const userCampaigns = campaignsByUser[String(u.id)] || [];
        const isNgoRole = u.role === 'NGO' || u.role === 'Recipient';
        const hasNgoName = Boolean(u.ngoName && u.ngoName.trim());
        const hasCampaigns = userCampaigns.length > 0;
        const isVerifiedUser = u.isVerified === true || u.accountStatus === 'Verified';

        if (isNgoRole || hasNgoName || hasCampaigns || (isVerifiedUser && u.role !== 'Admin')) {
          const totalRaised = userCampaigns.reduce(
            (acc, c) => acc + (parseFloat(String(c.collectedAmount)) || 0),
            0
          );
          const totalGoal = userCampaigns.reduce(
            (acc, c) => acc + (parseFloat(String(c.goalAmount)) || 0),
            0
          );

          ngoItems.push({
            id: String(u.id),
            name: u.name || u.fullName || 'Organization',
            email: u.email || 'No email',
            phoneNumber: u.phoneNumber,
            countryCode: u.countryCode,
            role: u.role || 'NGO',
            ngoName: u.ngoName || u.name,
            ngoRegistrationNumber: u.ngoRegistrationNumber,
            positionInNgo: u.positionInNgo,
            directCorrespondentName: u.directCorrespondentName || u.name,
            contactForAccreditation: u.contactForAccreditation,
            isVerifiedRecipient: Boolean(u.isVerifiedRecipient || u.isVerified || u.accountStatus === 'Verified'),
            isVerified: Boolean(u.isVerified || u.accountStatus === 'Verified'),
            accountStatus: u.accountStatus || 'Pending',
            createdAt: u.createdAt || new Date().toISOString(),
            campaigns: userCampaigns,
            campaignsCount: userCampaigns.length,
            totalRaised,
            totalGoal,
          });
        }
      }

      // Sort: NGOs with active campaigns & verified first, then newest
      ngoItems.sort((a, b) => {
        if (b.campaignsCount !== a.campaignsCount) {
          return b.campaignsCount - a.campaignsCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setNgos(ngoItems);
    } catch (error) {
      console.error('Failed to load NGOs and campaigns:', error);
      if (!isBackground) {
        toast.error('Failed to load NGO directory');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleVerifyNgo = async (ngo: NgoCreatorUser) => {
    try {
      await api.patch(`/users/${ngo.id}`, {
        isVerified: true,
        isVerifiedRecipient: true,
        accountStatus: 'Verified',
        emailVerified: true,
        phoneVerified: true,
      });

      toast.success(`Organization / Creator "${ngo.ngoName || ngo.name}" verified!`);
      broadcastModerationUpdate('kyc');
      fetchNgosAndCampaigns(true);
      if (isDetailOpen && selectedNgo?.id === ngo.id) {
        setSelectedNgo((prev) => (prev ? { ...prev, isVerified: true, isVerifiedRecipient: true, accountStatus: 'Verified' } : null));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to verify organization.');
    }
  };

  const handleUnverifyNgo = async (ngo: NgoCreatorUser) => {
    try {
      await api.patch(`/users/${ngo.id}`, {
        isVerified: false,
        isVerifiedRecipient: false,
        accountStatus: 'Pending',
      });
      toast.success(`Organization "${ngo.name}" marked as unverified (Pending verification).`);
      broadcastModerationUpdate('kyc');
      fetchNgosAndCampaigns(true);
      if (isDetailOpen && selectedNgo?.id === ngo.id) {
        setSelectedNgo((prev) => (prev ? { ...prev, isVerified: false, isVerifiedRecipient: false, accountStatus: 'Pending' } : null));
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to unverify organization.');
    }
  };

  useEffect(() => {
    fetchNgosAndCampaigns();

    const interval = setInterval(() => {
      fetchNgosAndCampaigns(true);
    }, 15000);

    const unsubscribe = subscribeToModerationUpdates(() => {
      fetchNgosAndCampaigns(true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchNgosAndCampaigns]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return ngos.filter((ngo) => {
      const matchSearch =
        ngo.name?.toLowerCase().includes(term) ||
        ngo.ngoName?.toLowerCase().includes(term) ||
        ngo.email?.toLowerCase().includes(term) ||
        ngo.directCorrespondentName?.toLowerCase().includes(term) ||
        ngo.campaigns.some((c) => c.title.toLowerCase().includes(term));

      if (!matchSearch) return false;
      if (statusFilter === 'VERIFIED') return ngo.isVerified || ngo.accountStatus === 'Verified';
      if (statusFilter === 'WITH_CAMPAIGNS') return ngo.campaignsCount > 0;
      return true;
    });
  }, [ngos, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const formatCurrency = (val: number) => {
    return `PKR ${val.toLocaleString('en-PK')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NGOs & Campaign Creators</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Supervise registered non-profits, accredited organizations, and verified campaign creators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNgosAndCampaigns(true)}
            disabled={refreshing}
            className="rounded-xl border-border/60 h-9 gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border/60">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by NGO, creator, email, or campaign..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { key: 'ALL', label: `All Organizations (${ngos.length})` },
              { key: 'VERIFIED', label: `Verified Only (${ngos.filter((n) => n.isVerified).length})` },
              { key: 'WITH_CAMPAIGNS', label: `With Campaigns (${ngos.filter((n) => n.campaignsCount > 0).length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key as any);
                  setCurrentPage(1);
                }}
                className={cn(
                  'rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap',
                  statusFilter === tab.key
                    ? 'bg-[#185500] text-white shadow-xs dark:bg-emerald-600'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="rounded-2xl bg-muted/50 p-4 text-muted-foreground mb-3">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold">No Organizations Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              There are no organizations or campaign creators matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold pl-6 py-3.5">Organization / Creator</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Contact</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Accreditation</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Campaigns Created</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Funds Raised</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-6 py-3.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((ngo) => (
                  <TableRow key={ngo.id} className="border-border/60 hover:bg-muted/10 transition-colors">
                    {/* Organization / Creator Details */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-[#185500] dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                            {ngo.ngoName || ngo.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {ngo.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact details */}
                    <TableCell className="py-4">
                      <div className="text-xs space-y-0.5">
                        <p className="font-medium text-foreground">
                          {ngo.directCorrespondentName || ngo.name}
                        </p>
                        <p className="text-muted-foreground">
                          {ngo.phoneNumber || 'Phone not provided'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Accreditation Badge */}
                    <TableCell className="py-4">
                      {ngo.isVerified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified Creator
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs font-semibold">
                          <Clock className="h-3.5 w-3.5 mr-1" /> Pending KYC
                        </Badge>
                      )}
                    </TableCell>

                    {/* Campaigns Created */}
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-semibold py-0.5 px-2 rounded-lg',
                              ngo.campaignsCount > 0
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'text-muted-foreground'
                            )}
                          >
                            <FolderHeart className="h-3 w-3 mr-1" />
                            {ngo.campaignsCount} {ngo.campaignsCount === 1 ? 'Campaign' : 'Campaigns'}
                          </Badge>
                        </div>
                        {ngo.campaigns.length > 0 && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={ngo.campaigns[0].title}>
                            Latest: {ngo.campaigns[0].title}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Funds Raised */}
                    <TableCell className="py-4">
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-foreground">
                          {formatCurrency(ngo.totalRaised)}
                        </span>
                        {ngo.totalGoal > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            Goal: {formatCurrency(ngo.totalGoal)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {(!ngo.isVerified || ngo.accountStatus !== 'Verified') ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyNgo(ngo)}
                            className="h-8 rounded-xl px-2.5 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Verify
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnverifyNgo(ngo)}
                            className="h-8 rounded-xl px-2.5 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                          >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            Unverify
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedNgo(ngo);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 rounded-xl px-3 text-xs font-semibold bg-[#185500] hover:bg-[#1e6b00] text-white shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Profile & Campaigns
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
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-lg text-xs"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Rich NGO & Created Campaigns Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedNgo && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      selectedNgo.isVerified
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }
                  >
                    {selectedNgo.isVerified ? 'Verified Organization' : 'Pending KYC'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(selectedNgo.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  {selectedNgo.ngoName || selectedNgo.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Registration No: {selectedNgo.ngoRegistrationNumber || 'N/A'} • Role: {selectedNgo.role}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Official Information Card */}
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-2">
                  <p className="font-semibold uppercase text-muted-foreground text-[10px] tracking-wider">
                    Organization & Contact Info
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-muted-foreground">Correspondent:</span>
                      <span className="font-bold text-foreground">{selectedNgo.directCorrespondentName || selectedNgo.name}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-semibold text-foreground">{selectedNgo.positionInNgo || 'Lead Creator'}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-foreground">{selectedNgo.email}</span>
                    </div>
                    <div className="flex justify-between sm:justify-start sm:gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium text-foreground">{selectedNgo.phoneNumber || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Campaigns Created by this User Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <FolderHeart className="h-4 w-4 text-[#185500] dark:text-emerald-400" />
                      Campaigns Created by this Organization ({selectedNgo.campaigns.length})
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Total Raised: {formatCurrency(selectedNgo.totalRaised)}
                    </span>
                  </div>

                  {selectedNgo.campaigns.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                      This organization has not created any fundraising campaigns yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedNgo.campaigns.map((camp) => {
                        const goal = parseFloat(String(camp.goalAmount)) || 1;
                        const collected = parseFloat(String(camp.collectedAmount)) || 0;
                        const pct = Math.min(Math.round((collected / goal) * 100), 100);

                        return (
                          <div
                            key={camp.id}
                            className="p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-all flex flex-col gap-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-foreground line-clamp-1">
                                  {camp.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                    {camp.categoryName}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    Status: <strong className="text-foreground">{camp.campaignStatus}</strong>
                                  </span>
                                  <Badge
                                    className={cn(
                                      'text-[10px] py-0 px-1.5 h-4',
                                      camp.approvalStatus === 'Approved'
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    )}
                                  >
                                    {camp.approvalStatus}
                                  </Badge>
                                </div>
                              </div>

                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] rounded-lg shrink-0 gap-1"
                              >
                                <Link href="/campaigns">
                                  Audit <ExternalLink className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(collected)} ({pct}%)
                                </span>
                                <span className="text-muted-foreground">
                                  Goal: {formatCurrency(goal)}
                                </span>
                              </div>
                              <Progress value={pct} className="h-1.5 bg-muted" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-border/60 pt-4 mt-2">
                {(!selectedNgo.isVerified || selectedNgo.accountStatus !== 'Verified') ? (
                  <Button
                    onClick={() => handleVerifyNgo(selectedNgo)}
                    className="bg-[#185500] hover:bg-[#1e6b00] text-white rounded-xl text-xs font-semibold h-9"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Verify Organization
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUnverifyNgo(selectedNgo)}
                    variant="outline"
                    className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 rounded-xl text-xs font-semibold h-9"
                  >
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Unverify Organization
                  </Button>
                )}
                <Button asChild variant="outline" className="rounded-xl text-xs h-9">
                  <Link href={`/users/kyc?search=${encodeURIComponent(selectedNgo.ngoName || selectedNgo.name || '')}`}>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Audit KYC Docs
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
