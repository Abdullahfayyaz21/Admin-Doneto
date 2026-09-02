'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
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
  Heart,
  DollarSign
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
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/brand/states';

interface DonorUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  countryCode?: string;
  isVerified: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  accountStatus: string;
  createdAt: string;
}

export default function DonorsPage() {
  const [donors, setDonors] = useState<DonorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [selectedDonor, setSelectedDonor] = useState<DonorUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=Donor&limit=100');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setDonors(data);
      } else {
        setDonors([]);
      }
    } catch (error) {
      console.error('Failed to load donors:', error);
      toast.error('Failed to load donor directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const filtered = donors.filter((d) => {
    const term = search.toLowerCase();
    const matchSearch =
      d.name?.toLowerCase().includes(term) ||
      d.email?.toLowerCase().includes(term) ||
      d.phoneNumber?.includes(term);

    if (!matchSearch) return false;
    if (statusFilter === 'VERIFIED' && !d.isVerified) return false;
    if (statusFilter === 'UNVERIFIED' && d.isVerified) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const verifiedCount = donors.filter((d) => d.isVerified || d.emailVerified).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Donors Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View registered donors, community patrons, and profile verification statuses.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchDonors}
          className="rounded-xl border-border self-start md:self-auto text-xs"
        >
          <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Refresh Donors
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donors
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{donors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered patron community</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified Donors
            </CardTitle>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Email or phone verified</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Community Health
            </CardTitle>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <Heart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Patrons engaging regularly</p>
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
              placeholder="Search by name, email, or phone..."
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
              { key: 'ALL', label: 'All Donors' },
              { key: 'VERIFIED', label: 'Verified' },
              { key: 'UNVERIFIED', label: 'Unverified' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key as any);
                  setCurrentPage(1);
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                  statusFilter === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-3">
              <UserCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No Donors Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              There are no registered donors matching your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Donor Profile</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((donor) => (
                  <TableRow key={donor.id} className="group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {donor.name ? donor.name.slice(0, 2).toUpperCase() : 'DN'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate max-w-[180px]">
                            {donor.name || 'Anonymous Donor'}
                          </p>
                          <p className="text-xs text-muted-foreground">ID: #{donor.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-foreground font-medium">{donor.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{donor.phoneNumber || 'Not provided'}</span>
                    </TableCell>
                    <TableCell>
                      {donor.isVerified || donor.emailVerified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-medium rounded-lg">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs font-normal rounded-lg">
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(donor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedDonor(donor);
                          setIsDetailOpen(true);
                        }}
                        className="h-8 rounded-lg px-2.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        Details
                      </Button>
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

      {/* Donor Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          {selectedDonor && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      selectedDonor.isVerified || selectedDonor.emailVerified
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {selectedDonor.isVerified || selectedDonor.emailVerified ? 'Verified Donor' : 'Standard Account'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(selectedDonor.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold mt-2">
                  {selectedDonor.name}
                </DialogTitle>
                <DialogDescription>{selectedDonor.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1.5">
                  <p className="font-semibold uppercase text-muted-foreground text-[10px] tracking-wider">
                    Contact & Security
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">{selectedDonor.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-medium text-foreground">{selectedDonor.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Status:</span>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedDonor.accountStatus || 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl w-full"
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
