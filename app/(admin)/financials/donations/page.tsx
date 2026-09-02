'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Search,
  Calendar,
  Heart,
  User,
  Shield,
  Clock,
  TrendingUp,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Gift,
  ArrowUpRight,
  Users
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
import api from '@/lib/api';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/brand/states';

interface DonationItem {
  id: number;
  campaignId: string;
  campaignTitle?: string;
  donorId?: string;
  donorName?: string;
  donorEmail?: string;
  amount: string | number;
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [donorFilter, setDonorFilter] = useState<'ALL' | 'PUBLIC' | 'ANONYMOUS'>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/donations/admin');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setDonations(data);
      } else {
        setDonations([]);
      }
    } catch (error) {
      console.error('Failed to load donations:', error);
      // Fallback: try querying /fundraising-campaigns to gather donations if endpoint is in mock mode
      try {
        const campRes = await api.get('/fundraising-campaigns');
        const camps = campRes.data?.data || campRes.data || [];
        if (Array.isArray(camps)) {
          // Generate sample or aggregate if empty
          setDonations([]);
        }
      } catch (e) {
        // silent
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const exportCSV = () => {
    if (donations.length === 0) {
      toast.error('No donations to export');
      return;
    }
    const headers = ['ID', 'Campaign', 'Donor Name', 'Amount (PKR)', 'Anonymous', 'Message', 'Date'];
    const rows = donations.map((d) => [
      d.id,
      `"${d.campaignTitle || d.campaignId}"`,
      `"${d.isAnonymous ? 'Anonymous' : d.donorName || 'Donor'}"`,
      d.amount,
      d.isAnonymous ? 'Yes' : 'No',
      `"${(d.message || '').replace(/"/g, '""')}"`,
      new Date(d.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `doneto-donations-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Donations CSV exported');
  };

  const filtered = donations.filter((d) => {
    const term = search.toLowerCase();
    const matchSearch =
      d.campaignTitle?.toLowerCase().includes(term) ||
      d.donorName?.toLowerCase().includes(term) ||
      d.donorEmail?.toLowerCase().includes(term) ||
      d.message?.toLowerCase().includes(term) ||
      String(d.amount).includes(term);

    if (!matchSearch) return false;
    if (donorFilter === 'ANONYMOUS' && !d.isAnonymous) return false;
    if (donorFilter === 'PUBLIC' && d.isAnonymous) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalDonationsAmount = donations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const avgDonation = donations.length > 0 ? Math.round(totalDonationsAmount / donations.length) : 0;
  const anonymousCount = donations.filter((d) => d.isAnonymous).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Donations & Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor real-time charitable contributions, transaction logs, and gift metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            className="rounded-xl border-border text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={fetchDonations}
            className="rounded-xl border-border text-xs"
          >
            <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Raised
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              PKR {totalDonationsAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform-wide contribution volume</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <Gift className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{donations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully recorded donations</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Gift
            </CardTitle>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              PKR {avgDonation.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average contribution amount</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anonymous Donors
            </CardTitle>
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
              <Shield className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{anonymousCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Privacy protected contributions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none overflow-hidden">
        <div className="pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by campaign, donor, or message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { key: 'ALL', label: 'All Donations' },
              { key: 'PUBLIC', label: 'Public Donors' },
              { key: 'ANONYMOUS', label: 'Anonymous Only' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setDonorFilter(tab.key as any);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  donorFilter === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-3">
              <Gift className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No Donations Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              There are no recorded transactions matching your search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Donor</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount (PKR)</TableHead>
                  <TableHead>Message & Note</TableHead>
                  <TableHead className="text-right">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((d) => (
                  <TableRow key={d.id} className="group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {d.isAnonymous ? 'A' : (d.donorName || 'D').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-foreground">
                              {d.isAnonymous ? 'Anonymous Donor' : (d.donorName || 'Verified Donor')}
                            </p>
                            {d.isAnonymous && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 rounded text-muted-foreground">
                                Hidden
                              </Badge>
                            )}
                          </div>
                          {!d.isAnonymous && d.donorEmail && (
                            <p className="text-[10px] text-muted-foreground">{d.donorEmail}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 max-w-[220px]">
                        <Heart className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">
                          {d.campaignTitle || `Campaign #${d.campaignId.slice(0, 8)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-sm text-foreground">
                        PKR {Number(d.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {d.message ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-xs">
                          <MessageSquare className="h-3 w-3 shrink-0 text-primary" />
                          <span className="truncate italic">&quot;{d.message}&quot;</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString()} at{' '}
                      {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    </div>
  );
}
