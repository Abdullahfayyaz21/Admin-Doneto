'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Eye,
  RefreshCw,
  TrendingUp,
  FolderHeart,
  ExternalLink,
  Sparkles,
  Layers,
  HeartHandshake,
  Users,
  Target,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/brand/states';
import { subscribeToModerationUpdates } from '@/lib/realtime';

// ── Types ──────────────────────────────────────────────────────────────────

export interface NgoCampaignItem {
  id: string | number;
  title: string;
  categoryName: string;
  goalAmount: number;
  collectedAmount: number;
  campaignStatus: 'Active' | 'Paused' | 'Completed' | 'Cancelled' | string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | string;
  imageUrl?: string | null;
  startDate?: string;
  endDate?: string | null;
  createdAt?: string;
  // User who created this campaign
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorRole: string;
  creatorIsVerified: boolean;
  creatorAccountStatus?: string;
}

export interface NgoCreatorSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  campaignsCount: number;
}

export interface NgoEntity {
  id: string; // canonical name slug or id
  name: string;
  isVerified: boolean;
  registrationNumber?: string | null;
  officialEmail?: string | null;
  officialPhone?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  categories: string[];
  campaigns: NgoCampaignItem[];
  campaignsCount: number;
  activeCampaignsCount: number;
  completedCampaignsCount: number;
  totalRaised: number;
  totalGoal: number;
  overallProgress: number;
  creators: NgoCreatorSummary[];
  latestActivityDate: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (val: number): string => {
  return `PKR ${Math.round(val).toLocaleString('en-PK')}`;
};

const normalizeNgoName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

/**
 * Robust helper to detect NGO entity from campaign attributes,
 * beneficiary metadata, description text (regex), and known/registered NGOs.
 */
function extractNgoNameFromCampaign(c: any, registeredNgoNames: string[] = []): string {
  // 1. Explicit NGO fields directly on campaign
  if (c.ngoName && typeof c.ngoName === 'string' && c.ngoName.trim()) {
    return c.ngoName.trim();
  }
  if (c.ngo?.publicName && typeof c.ngo.publicName === 'string' && c.ngo.publicName.trim()) {
    return c.ngo.publicName.trim();
  }
  if (c.ngo?.legalName && typeof c.ngo.legalName === 'string' && c.ngo.legalName.trim()) {
    return c.ngo.legalName.trim();
  }
  if (c.createdBy?.ngoName && typeof c.createdBy.ngoName === 'string' && c.createdBy.ngoName.trim()) {
    return c.createdBy.ngoName.trim();
  }
  if (c.creator?.ngoName && typeof c.creator.ngoName === 'string' && c.creator.ngoName.trim()) {
    return c.creator.ngoName.trim();
  }

  // 2. Beneficiary designated as Organization or Non-Profit
  const genericBeneficiaryKeywords = [
    'individual',
    'self',
    'community',
    'family',
    'myself',
    'public',
    'patient',
    'people',
    'others',
    'someone',
    'relative',
    'friend',
  ];

  if (
    c.beneficiaryType === 'Organization' ||
    c.beneficiaryType === 'Non-Profit Organization' ||
    c.beneficiaryType === 'NGO'
  ) {
    if (c.beneficiaryName && typeof c.beneficiaryName === 'string' && c.beneficiaryName.trim()) {
      return c.beneficiaryName.trim();
    }
  }

  // 3. If beneficiaryName has organizational keyword
  if (c.beneficiaryName && typeof c.beneficiaryName === 'string' && c.beneficiaryName.trim()) {
    const benTrim = c.beneficiaryName.trim();
    const isGeneric = genericBeneficiaryKeywords.includes(benTrim.toLowerCase());
    if (
      !isGeneric &&
      /(foundation|trust|welfare|society|organization|association|relief|institute|hospital|council|network|federation|charity|care|aid)/i.test(
        benTrim
      )
    ) {
      return benTrim;
    }
  }

  // 4. Regex scan across description, shortSummary, and title for NGO names
  // Accurately matches e.g. "Hajira Hamza Foundation (H2F)", "Edhi Foundation", "Shaukat Khanum Memorial Trust", etc.
  const ngoRegex =
    /\b([A-Z0-9][a-zA-Z0-9&.'-]*(?:\s+[A-Z0-9][a-zA-Z0-9&.'-]*){0,4}\s+(?:Foundation|Trust|Society|Welfare|Relief|Organization|Association|Charity|Hospital|Institute)(?:\s*\([A-Za-z0-9-]+\))?)/i;

  const combinedText = [c.description, c.shortSummary, c.title].filter(Boolean).join(' ');
  const match = combinedText.match(ngoRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 5. Check against registered NGO names from KYC
  for (const regName of registeredNgoNames) {
    if (regName && combinedText.toLowerCase().includes(regName.toLowerCase())) {
      return regName;
    }
  }

  // 6. Known well-known Pakistani NGOs list
  const knownNgos = [
    'Edhi Foundation',
    'Hajira Hamza Foundation (H2F)',
    'Hajira Hamza Foundation',
    'Shaukat Khanum Memorial Trust',
    'Saylani Welfare Trust',
    'Chhipa Welfare Foundation',
    'Alkhidmat Foundation',
    'Indus Hospital & Health Network',
    'JDC Welfare Organization',
    'Akhuwat Foundation',
    'The Citizens Foundation',
    'SOS Children\'s Villages',
    'Pink Ribbon Pakistan',
    'Shahid Afridi Foundation',
    'Sarwar Foundation',
  ];

  for (const known of knownNgos) {
    const simple = known.toLowerCase().replace(/\s*\([^)]+\)/, '').trim();
    if (combinedText.toLowerCase().includes(simple)) {
      return known;
    }
  }

  // 7. Non-generic beneficiaryName fallback
  if (
    c.beneficiaryName &&
    typeof c.beneficiaryName === 'string' &&
    c.beneficiaryName.trim() &&
    !genericBeneficiaryKeywords.includes(c.beneficiaryName.trim().toLowerCase())
  ) {
    return c.beneficiaryName.trim();
  }

  return '';
}

// ── Component ──────────────────────────────────────────────────────────────

export default function NGOsPage() {
  const [ngos, setNgos] = useState<NgoEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Search, Filter & Sort
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE_CAMPAIGNS' | 'VERIFIED' | 'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'CAMPAIGNS' | 'RAISED' | 'NAME' | 'NEWEST'>('CAMPAIGNS');

  // Detail Modal
  const [selectedNgo, setSelectedNgo] = useState<NgoEntity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'campaigns' | 'creators'>('campaigns');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ── Data Fetching & Aggregation ──────────────────────────────────────────
  const fetchNgosAndCampaigns = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      // Concurrently fetch all campaigns (both endpoints for resilience), users, and registered NGOs
      const [fundraisingRes, publicCampaignsRes, usersRes, verifiedNgosRes, kycRequestsRes] =
        await Promise.allSettled([
          api.get('/fundraising-campaigns'),
          api.get('/campaigns'),
          api.get('/users?limit=300'),
          api.get('/kyc/verified-ngos?limit=200'),
          api.get('/kyc/admin/requests?limit=200'),
        ]);

      // 1. Process users map for fast lookup
      const usersMap = new Map<string, any>();
      if (usersRes.status === 'fulfilled') {
        const raw = usersRes.value.data?.data?.data || usersRes.value.data?.data || usersRes.value.data || [];
        if (Array.isArray(raw)) {
          raw.forEach((u) => {
            const uid = String(u.id || u.user_id || '');
            if (uid) usersMap.set(uid, u);
          });
        }
      }

      // 2. Process registered / approved NGOs
      const registeredNgoMap = new Map<string, {
        isVerified: boolean;
        registrationNumber?: string | null;
        officialEmail?: string | null;
        officialPhone?: string | null;
        categories?: string[];
        logoUrl?: string | null;
      }>();

      if (verifiedNgosRes.status === 'fulfilled') {
        const list = verifiedNgosRes.value.data?.data || verifiedNgosRes.value.data || [];
        if (Array.isArray(list)) {
          list.forEach((n) => {
            const orgName = (n.publicName || n.ngoName || n.legalName || '').trim();
            if (orgName) {
              registeredNgoMap.set(orgName.toLowerCase(), {
                isVerified: true,
                registrationNumber: n.registrationNumber || null,
                officialEmail: n.officialEmail || null,
                officialPhone: n.officialPhone || null,
                categories: n.categories || [],
                logoUrl: n.logoUrl || null,
              });
            }
          });
        }
      }

      if (kycRequestsRes.status === 'fulfilled') {
        const list = kycRequestsRes.value.data?.data || kycRequestsRes.value.data || [];
        if (Array.isArray(list)) {
          list.forEach((r) => {
            const orgName = (r.ngoName || r.legalName || '').trim();
            if (orgName && !registeredNgoMap.has(orgName.toLowerCase())) {
              registeredNgoMap.set(orgName.toLowerCase(), {
                isVerified: r.status === 'Approved',
                registrationNumber: r.registrationNumber || null,
                officialEmail: r.officialEmail || null,
                categories: r.categories || [],
                logoUrl: r.logoUrl || null,
              });
            }
          });
        }
      }

      // 3. Process campaigns and merge from both endpoints (deduplicated by id)
      const cMap = new Map<string, any>();
      const addList = (res: PromiseSettledResult<any>) => {
        if (res.status === 'fulfilled') {
          const raw = res.value.data?.data || res.value.data || [];
          if (Array.isArray(raw)) {
            raw.forEach((c) => {
              if (c && (c.id || c.campaign_id)) {
                const id = String(c.id || c.campaign_id);
                // Prefer item with creator object populated
                if (!cMap.has(id) || (c.creator && !cMap.get(id).creator)) {
                  cMap.set(id, c);
                }
              }
            });
          }
        }
      };
      addList(fundraisingRes);
      addList(publicCampaignsRes);
      const campaignList: any[] = Array.from(cMap.values());

      const registeredNames = Array.from(registeredNgoMap.keys());

      // Group dictionary keyed by lowercase normalized NGO name
      const ngoGroups = new Map<string, {
        name: string;
        campaigns: NgoCampaignItem[];
        creatorsMap: Map<string, NgoCreatorSummary>;
        categories: Set<string>;
        latestDate: string;
      }>();

      for (const c of campaignList) {
        // Resolve NGO name using comprehensive extraction
        const rawNgoName = extractNgoNameFromCampaign(c, registeredNames);
        const ngoNameClean = normalizeNgoName(rawNgoName);
        if (!ngoNameClean) {
          // If no NGO name could be resolved, skip grouping into NGO directory
          continue;
        }

        const key = ngoNameClean.toLowerCase();

        // Resolve creator user
        const creatorId = String(c.creator?.id || c.createdById || c.userId || c.createdBy?.id || '');
        const creatorUser = creatorId ? usersMap.get(creatorId) : null;

        // Authoritative Creator Name:
        // Prioritize actual user name from campaign's embedded creator object (e.g. "Muhammad Abdullah Fayyaz", "Abdullah Fayyaz"),
        // or user account lookup, or createdBy object, then contact person
        const creatorName =
          (c.creator?.name && typeof c.creator.name === 'string' && c.creator.name.trim()) ||
          (c.createdBy?.name && typeof c.createdBy.name === 'string' && c.createdBy.name.trim()) ||
          (creatorUser?.name && typeof creatorUser.name === 'string' && creatorUser.name.trim()) ||
          (creatorUser?.fullName && typeof creatorUser.fullName === 'string' && creatorUser.fullName.trim()) ||
          (c.contactPerson && typeof c.contactPerson === 'string' && c.contactPerson.trim()) ||
          'Campaign Organizer';

        // Creator Email:
        const creatorEmail =
          (c.creator?.email && typeof c.creator.email === 'string' && c.creator.email.trim()) ||
          (c.createdBy?.email && typeof c.createdBy.email === 'string' && c.createdBy.email.trim()) ||
          (creatorUser?.email && typeof creatorUser.email === 'string' && creatorUser.email.trim()) ||
          (c.contactEmail && typeof c.contactEmail === 'string' && c.contactEmail.trim()) ||
          'Email not provided';

        // Creator Role:
        const creatorRole =
          c.creator?.role ||
          c.createdBy?.role ||
          creatorUser?.role ||
          'Campaign Organizer';

        // Creator Verification Status:
        const creatorIsVerified = Boolean(
          c.creator?.isVerified ||
          c.creator?.accountStatus === 'Verified' ||
          c.createdBy?.isVerified ||
          creatorUser?.isVerified ||
          creatorUser?.accountStatus === 'Verified' ||
          false
        );

        const creatorAccountStatus =
          c.creator?.accountStatus ||
          creatorUser?.accountStatus ||
          (creatorIsVerified ? 'Verified' : 'Active');

        const campaignItem: NgoCampaignItem = {
          id: c.id || c.campaign_id,
          title: c.title || 'Untitled Campaign',
          categoryName: c.categoryName || c.category?.name || 'General',
          goalAmount: parseFloat(String(c.goalAmount)) || 0,
          collectedAmount: parseFloat(String(c.collectedAmount)) || 0,
          campaignStatus: c.campaignStatus || 'Active',
          approvalStatus: c.approvalStatus || 'Approved',
          imageUrl: c.imageUrl || null,
          startDate: c.startDate,
          endDate: c.endDate,
          createdAt: c.createdAt || new Date().toISOString(),
          creatorId,
          creatorName,
          creatorEmail,
          creatorRole,
          creatorIsVerified,
          creatorAccountStatus,
        };

        if (!ngoGroups.has(key)) {
          ngoGroups.set(key, {
            name: ngoNameClean,
            campaigns: [],
            creatorsMap: new Map(),
            categories: new Set(),
            latestDate: campaignItem.createdAt || '',
          });
        }

        const group = ngoGroups.get(key)!;
        group.campaigns.push(campaignItem);

        if (campaignItem.categoryName) {
          group.categories.add(campaignItem.categoryName);
        }

        if (campaignItem.createdAt && (!group.latestDate || new Date(campaignItem.createdAt) > new Date(group.latestDate))) {
          group.latestDate = campaignItem.createdAt;
        }

        // Track creator user uniquely by id or email or name
        const creatorKey = (creatorId && creatorId !== 'undefined' ? creatorId : '') || creatorEmail || creatorName;
        if (!group.creatorsMap.has(creatorKey)) {
          group.creatorsMap.set(creatorKey, {
            id: creatorId,
            name: creatorName,
            email: creatorEmail,
            role: creatorRole,
            isVerified: creatorIsVerified,
            campaignsCount: 1,
          });
        } else {
          group.creatorsMap.get(creatorKey)!.campaignsCount += 1;
        }
      }

      // Also ensure any registered/verified NGOs appear even if they haven't launched campaigns yet
      for (const [key, regInfo] of Array.from(registeredNgoMap.entries())) {
        if (!ngoGroups.has(key)) {
          // Capitalize nice title from key
          const formattedName = key.split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          ngoGroups.set(key, {
            name: formattedName,
            campaigns: [],
            creatorsMap: new Map(),
            categories: new Set(regInfo.categories || []),
            latestDate: new Date().toISOString(),
          });
        }
      }

      // 4. Assemble final NGO entities list with aggregate financial metrics
      const assembledList: NgoEntity[] = [];

      for (const [key, group] of Array.from(ngoGroups.entries())) {
        const regInfo = registeredNgoMap.get(key);

        const totalRaised = group.campaigns.reduce((sum, c) => sum + c.collectedAmount, 0);
        const totalGoal = group.campaigns.reduce((sum, c) => sum + c.goalAmount, 0);
        const overallProgress = totalGoal > 0 ? Math.min(Math.round((totalRaised / totalGoal) * 100), 100) : 0;

        const activeCampaignsCount = group.campaigns.filter((c) => c.campaignStatus === 'Active').length;
        const completedCampaignsCount = group.campaigns.filter((c) => c.campaignStatus === 'Completed').length;

        assembledList.push({
          id: key.replace(/[^a-z0-9]/g, '-'),
          name: group.name,
          isVerified: Boolean(regInfo?.isVerified || group.campaigns.some((c) => c.creatorIsVerified)),
          registrationNumber: regInfo?.registrationNumber || null,
          officialEmail: regInfo?.officialEmail || (group.creatorsMap.values().next().value?.email || null),
          officialPhone: regInfo?.officialPhone || null,
          logoUrl: regInfo?.logoUrl || null,
          categories: Array.from(group.categories),
          campaigns: group.campaigns,
          campaignsCount: group.campaigns.length,
          activeCampaignsCount,
          completedCampaignsCount,
          totalRaised,
          totalGoal,
          overallProgress,
          creators: Array.from(group.creatorsMap.values()),
          latestActivityDate: group.latestDate || new Date().toISOString(),
        });
      }

      setNgos(assembledList);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to load NGOs directory:', err);
      if (!isBackground) {
        toast.error('Failed to load NGOs directory. Please check network connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load, background polling, and real-time moderation updates
  useEffect(() => {
    fetchNgosAndCampaigns();

    // Live background polling every 12 seconds
    const interval = setInterval(() => {
      fetchNgosAndCampaigns(true);
    }, 12000);

    // Instant websocket update trigger
    const unsubscribe = subscribeToModerationUpdates(() => {
      fetchNgosAndCampaigns(true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchNgosAndCampaigns]);


  // ── Filtering and Sorting ────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    const term = search.toLowerCase().trim();

    const filtered = ngos.filter((ngo) => {
      const matchesSearch =
        !term ||
        ngo.name.toLowerCase().includes(term) ||
        (ngo.officialEmail && ngo.officialEmail.toLowerCase().includes(term)) ||
        ngo.campaigns.some((c) => c.title.toLowerCase().includes(term)) ||
        ngo.creators.some(
          (cr) =>
            cr.name.toLowerCase().includes(term) ||
            cr.email.toLowerCase().includes(term)
        );

      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE_CAMPAIGNS') {
        return ngo.activeCampaignsCount > 0;
      }
      if (statusFilter === 'VERIFIED') {
        return ngo.isVerified;
      }
      if (statusFilter === 'COMPLETED') {
        return ngo.completedCampaignsCount > 0;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'CAMPAIGNS') {
        if (b.campaignsCount !== a.campaignsCount) {
          return b.campaignsCount - a.campaignsCount;
        }
        return b.totalRaised - a.totalRaised;
      }
      if (sortBy === 'RAISED') {
        return b.totalRaised - a.totalRaised;
      }
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'NEWEST') {
        return new Date(b.latestActivityDate).getTime() - new Date(a.latestActivityDate).getTime();
      }
      return 0;
    });

    return filtered;
  }, [ngos, search, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    return filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredAndSorted, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">NGOs & Foundations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Realtime directory of all NGOs created on campaigns. Drill down into any NGO to inspect all its initiatives and creator user attributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshedAt && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
              Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNgosAndCampaigns(true)}
            disabled={refreshing}
            className="rounded-xl border-border/60 h-9 gap-2 text-xs font-semibold text-foreground hover:bg-muted/50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#185500] dark:text-emerald-400' : ''}`} />
            Refresh
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border/60 h-9 gap-1.5 text-xs font-semibold text-foreground hover:bg-muted/50"
          >
            <Link href="/campaigns">
              <FolderHeart className="h-3.5 w-3.5" />
              All Campaigns
            </Link>
          </Button>
        </div>
      </div>


      {/* ── Main Directory Container ──────────────────────────────────────── */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs overflow-hidden">
        {/* Toolbar & Filters */}
        <div className="pb-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-border/60">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by NGO name, campaign title, creator, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-input bg-muted/30 pl-9 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: `All NGOs (${ngos.length})` },
                {
                  key: 'ACTIVE_CAMPAIGNS',
                  label: `Active (${ngos.filter((n) => n.activeCampaignsCount > 0).length})`,
                },
                {
                  key: 'VERIFIED',
                  label: `Verified (${ngos.filter((n) => n.isVerified).length})`,
                },
                {
                  key: 'COMPLETED',
                  label: `Funded (${ngos.filter((n) => n.completedCampaignsCount > 0).length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key as any);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap',
                    statusFilter === tab.key
                      ? 'bg-[#185500] text-white shadow-xs dark:bg-emerald-600'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-muted/40 text-xs text-foreground px-2 py-1 outline-none cursor-pointer"
              >
                <option value="CAMPAIGNS">Sort by Campaigns</option>
                <option value="RAISED">Sort by Funds Raised</option>
                <option value="NAME">Sort by Name (A-Z)</option>
                <option value="NEWEST">Sort by Recent Activity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory Content */}
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-[#185500] dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-foreground">No NGOs Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1">
              {search
                ? `No organization matched "${search}". Try searching with a different keyword or reset filters.`
                : 'When you create a campaign and designate an NGO name, it will automatically appear here with all its campaigns and creator users.'}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch('')}
                className="mt-4 rounded-xl text-xs"
              >
                Clear Search Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold pl-6 py-3.5">NGO / Organization</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Campaigns Created</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Funds Raised & Target</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Creators & Organizers</TableHead>
                  <TableHead className="text-xs font-semibold py-3.5">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-6 py-3.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((ngo) => (
                  <TableRow
                    key={ngo.id}
                    className="border-border/60 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedNgo(ngo);
                      setModalTab('campaigns');
                      setIsDetailOpen(true);
                    }}
                  >
                    {/* NGO Name & Details */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-[#185500]/10 text-[#185500] dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border border-border/40">
                          {ngo.logoUrl ? (
                            <img src={ngo.logoUrl} alt={ngo.name} className="h-full w-full object-cover" />
                          ) : (
                            ngo.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-foreground truncate max-w-[240px]">
                              {ngo.name}
                            </p>
                            {ngo.isVerified && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold py-0 px-1.5 h-4">
                                <ShieldCheck className="h-3 w-3 mr-0.5" /> Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                            {ngo.categories.length > 0
                              ? ngo.categories.join(', ')
                              : 'Social Welfare & Community'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Campaigns Count */}
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-semibold py-0.5 px-2 rounded-lg',
                              ngo.campaignsCount > 0
                                ? 'bg-[#185500]/10 text-[#185500] dark:bg-emerald-500/20 dark:text-emerald-400 border-[#185500]/20'
                                : 'text-muted-foreground'
                            )}
                          >
                            <FolderHeart className="h-3 w-3 mr-1" />
                            {ngo.campaignsCount} {ngo.campaignsCount === 1 ? 'Campaign' : 'Campaigns'}
                          </Badge>
                        </div>
                        {ngo.activeCampaignsCount > 0 && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                            {ngo.activeCampaignsCount} Active now
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Funds Raised & Target */}
                    <TableCell className="py-4">
                      <div className="text-xs space-y-1.5 max-w-[180px]">
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-foreground">
                            {formatCurrency(ngo.totalRaised)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {ngo.overallProgress}%
                          </span>
                        </div>
                        <Progress value={ngo.overallProgress} className="h-1.5 bg-muted" />
                        {ngo.totalGoal > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            Target Goal: {formatCurrency(ngo.totalGoal)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Creators Attribution */}
                    <TableCell className="py-4">
                      <div className="text-xs space-y-0.5">
                        {ngo.creators.length === 0 ? (
                          <span className="text-muted-foreground italic">No creators yet</span>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-semibold text-foreground truncate max-w-[160px]">
                                {ngo.creators[0].name}
                              </span>
                              {ngo.creators.length > 1 && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1 h-4">
                                  +{ngo.creators.length - 1} more
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">
                              {ngo.creators[0].email}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-4">
                      {ngo.campaignsCount > 0 ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active Initiatives
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border/80 text-xs font-semibold">
                          <Clock className="h-3 w-3 mr-1" /> Registered NGO
                        </Badge>
                      )}
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="text-right pr-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedNgo(ngo);
                          setModalTab('campaigns');
                          setIsDetailOpen(true);
                        }}
                        className="h-8 rounded-xl px-3 text-xs font-semibold bg-[#185500] hover:bg-[#1e6b00] text-white shadow-xs gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Campaigns & Creators
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!loading && filteredAndSorted.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} NGOs
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-xl text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-xs font-medium px-2">
                Page {currentPage} of {totalPages}
              </span>
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

      {/* ── Rich NGO Campaigns & Creators Drill-Down Modal ─────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto p-6">
          {selectedNgo && (
            <>
              {/* Modal Header */}
              <DialogHeader className="space-y-3 pb-2 border-b border-border/60">
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-2xl bg-[#185500]/10 text-[#185500] dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden border border-border/40">
                    {selectedNgo.logoUrl ? (
                      <img src={selectedNgo.logoUrl} alt={selectedNgo.name} className="h-full w-full object-cover" />
                    ) : (
                      selectedNgo.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                        {selectedNgo.name}
                      </DialogTitle>
                      {selectedNgo.isVerified && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified NGO
                        </Badge>
                      )}
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {selectedNgo.campaignsCount} total campaigns on platform • {selectedNgo.creators.length} distinct campaign creators
                    </DialogDescription>
                  </div>
                </div>

                {/* Quick NGO Metric Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Total Raised
                    </span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedNgo.totalRaised)}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Total Target Goal
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {formatCurrency(selectedNgo.totalGoal)}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Campaigns
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {selectedNgo.campaignsCount} ({selectedNgo.activeCampaignsCount} Active)
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Creator Users
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {selectedNgo.creators.length} User{selectedNgo.creators.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              {/* Navigation Tabs Inside Modal */}
              <Tabs value={modalTab} onValueChange={(v) => setModalTab(v as any)} className="w-full mt-4">
                <TabsList className="grid grid-cols-2 rounded-2xl bg-muted/60 p-1 mb-4">
                  <TabsTrigger value="campaigns" className="rounded-xl text-xs font-semibold">
                    <FolderHeart className="h-3.5 w-3.5 mr-1.5" />
                    Campaigns Created on this NGO ({selectedNgo.campaigns.length})
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="rounded-xl text-xs font-semibold">
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Participating Users ({selectedNgo.creators.length})
                  </TabsTrigger>
                </TabsList>

                {/* ── Tab 1: Campaigns with User Attribution ───────────────── */}
                <TabsContent value="campaigns" className="space-y-3.5 focus-visible:outline-none">
                  {selectedNgo.campaigns.length === 0 ? (
                    <div className="p-10 rounded-2xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                      <FolderHeart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      No campaigns have been created on this NGO yet.
                    </div>
                  ) : (
                    selectedNgo.campaigns.map((camp) => {
                      const goal = camp.goalAmount || 1;
                      const collected = camp.collectedAmount || 0;
                      const pct = Math.min(Math.round((collected / goal) * 100), 100);

                      return (
                        <div
                          key={camp.id}
                          className="p-4 rounded-2xl border border-border/70 bg-card hover:border-[#185500]/40 transition-all space-y-3 shadow-2xs"
                        >
                          {/* Top Row: Thumbnail Visual, Title, Category, Status & Action */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              {camp.imageUrl ? (
                                <div className="h-14 w-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
                                  <img
                                    src={camp.imageUrl}
                                    alt={camp.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-14 w-20 rounded-xl bg-[#185500]/10 text-[#185500] dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-border/60">
                                  <FolderHeart className="h-5 w-5" />
                                </div>
                              )}
                              <div className="space-y-1 min-w-0">
                                <h4 className="font-bold text-sm text-foreground leading-snug">
                                  {camp.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px] py-0 px-2 h-4 rounded-md">
                                    {camp.categoryName}
                                  </Badge>
                                  <Badge
                                    className={cn(
                                      'text-[10px] py-0 px-2 h-4 rounded-md font-semibold',
                                      camp.campaignStatus === 'Active'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : camp.campaignStatus === 'Completed'
                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                        : 'bg-muted text-muted-foreground'
                                    )}
                                  >
                                    Status: {camp.campaignStatus}
                                  </Badge>
                                  <Badge
                                    className={cn(
                                      'text-[10px] py-0 px-2 h-4 rounded-md font-semibold',
                                      camp.approvalStatus === 'Approved'
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    )}
                                  >
                                    {camp.approvalStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-xl text-xs font-semibold gap-1.5 shrink-0 border-[#185500]/30 text-[#185500] hover:bg-[#185500]/10 dark:text-emerald-400 dark:border-emerald-500/30"
                            >
                              <Link href={`/campaigns`}>
                                Audit Campaign <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>

                          {/* USER ATTRIBUTION BOX (Highlighted as requested!) */}
                          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-xl bg-[#185500]/15 text-[#185500] dark:bg-emerald-500/30 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground truncate">
                                    {camp.creatorName}
                                  </span>
                                  <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-3.5 font-medium">
                                    {camp.creatorRole}
                                  </Badge>
                                  {camp.creatorIsVerified && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                                      <ShieldCheck className="h-3 w-3 mr-0.5 inline" /> Verified User
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground block truncate">
                                  {camp.creatorEmail}
                                </span>
                              </div>
                            </div>

                            <div className="text-[11px] text-muted-foreground sm:text-right shrink-0">
                              {camp.startDate && (
                                <span>Started: {new Date(camp.startDate).toLocaleDateString()}</span>
                              )}
                              {camp.endDate && (
                                <span className="block text-[10px]">Ends: {new Date(camp.endDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          {/* Progress & Financials */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(collected)} raised ({pct}%)
                              </span>
                              <span className="text-muted-foreground font-medium text-[11px]">
                                Target Goal: {formatCurrency(goal)}
                              </span>
                            </div>
                            <Progress value={pct} className="h-2 bg-muted/60" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                {/* ── Tab 2: Users / Creators Breakdown ───────────────────── */}
                <TabsContent value="creators" className="space-y-3 focus-visible:outline-none">
                  {selectedNgo.creators.length === 0 ? (
                    <div className="p-10 rounded-2xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                      No creators associated with this NGO yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedNgo.creators.map((creator) => (
                        <div
                          key={creator.id || creator.email}
                          className="p-4 rounded-2xl border border-border/60 bg-card flex items-start gap-3 shadow-2xs"
                        >
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {creator.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-xs text-foreground truncate">
                                {creator.name}
                              </p>
                              {creator.isVerified && (
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {creator.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                {creator.role}
                              </Badge>
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {creator.campaignsCount} Campaign{creator.campaignsCount === 1 ? '' : 's'} Created
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Modal Footer */}
              <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-border/60 pt-4 mt-4">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl text-xs h-9 border-[#185500]/30 text-[#185500] hover:bg-[#185500]/10 dark:text-emerald-400 dark:border-emerald-500/30 flex-1"
                >
                  <Link href={`/campaigns`}>
                    <FolderHeart className="h-3.5 w-3.5 mr-1.5" />
                    Open Campaigns Management
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl text-xs h-9 sm:w-28"
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
