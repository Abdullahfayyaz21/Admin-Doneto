'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Edit2,
  Ban,
  FileCheck,
  Sparkles
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

interface NgoUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  countryCode?: string;
  ngoName?: string;
  ngoRegistrationNumber?: string;
  positionInNgo?: string;
  directCorrespondentName?: string;
  contactForAccreditation?: string;
  isVerifiedRecipient: boolean;
  isVerified: boolean;
  accountStatus: string;
  createdAt: string;
}

export default function NGOsPage() {
  const [ngos, setNgos] = useState<NgoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [selectedNgo, setSelectedNgo] = useState<NgoUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchNgos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?role=Recipient&limit=100');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setNgos(data);
      } else {
        setNgos([]);
      }
    } catch (error) {
      console.error('Failed to load NGOs:', error);
      toast.error('Failed to load NGO directory');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerifyNgo = async (ngo: NgoUser) => {
    try {
      await api.patch(`/users/${ngo.id}`, {
        isVerified: true,
        isVerifiedRecipient: true,
        accountStatus: 'Verified',
        emailVerified: true,
        phoneVerified: true,
      });
      try {
        await api.patch(`/kyc/admin/requests/${ngo.id}/review`, { status: 'APPROVED' });
      } catch {
        // silent
      }
      toast.success(`NGO "${ngo.ngoName || ngo.name}" verified on platform & web app!`);
      fetchNgos();
      if (isDetailOpen) setIsDetailOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to verify NGO.');
    }
  };

  useEffect(() => {
    fetchNgos();
  }, [fetchNgos]);

  const filtered = ngos.filter((n) => {
    const term = search.toLowerCase();
    const matchSearch =
      n.ngoName?.toLowerCase().includes(term) ||
      n.name?.toLowerCase().includes(term) ||
      n.email?.toLowerCase().includes(term) ||
      n.ngoRegistrationNumber?.toLowerCase().includes(term);

    if (!matchSearch) return false;
    if (statusFilter === 'VERIFIED' && !n.isVerifiedRecipient) return false;
    if (statusFilter === 'UNVERIFIED' && n.isVerifiedRecipient) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const verifiedCount = ngos.filter((n) => n.isVerifiedRecipient).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            NGO Directory & Accreditation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage recipient organizations, official registration data, and accreditation statuses.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchNgos}
          className="rounded-xl border-border self-start md:self-auto text-xs"
        >
          <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Refresh Directory
        </Button>
      </div>



      {/* Main Table */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none overflow-hidden">
        <div className="pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by NGO name, rep, or reg number..."
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
              { key: 'ALL', label: 'All NGOs' },
              { key: 'VERIFIED', label: 'Verified Only' },
              { key: 'UNVERIFIED', label: 'Unverified / Pending' },
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
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No NGOs Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              There are no recipient organizations matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Organization</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Registered Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((ngo) => (
                  <TableRow key={ngo.id} className="group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                            {ngo.ngoName || ngo.name || 'NGO Organization'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {ngo.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {ngo.directCorrespondentName || ngo.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {ngo.positionInNgo || 'Director / Lead'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-medium text-foreground">
                        {ngo.ngoRegistrationNumber || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ngo.isVerifiedRecipient || ngo.isVerified || ngo.accountStatus === 'Verified' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-medium rounded-lg">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-xs font-medium rounded-lg">
                          <Clock className="h-3 w-3 mr-1" /> Pending KYC
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(ngo.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!ngo.isVerifiedRecipient && !ngo.isVerified && ngo.accountStatus !== 'Verified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyNgo(ngo)}
                            className="h-8 rounded-lg px-2 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Verify
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedNgo(ngo);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 rounded-lg px-2.5 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          Details
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

      {/* NGO Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          {selectedNgo && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      selectedNgo.isVerifiedRecipient || selectedNgo.isVerified || selectedNgo.accountStatus === 'Verified'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }
                  >
                    {selectedNgo.isVerifiedRecipient || selectedNgo.isVerified || selectedNgo.accountStatus === 'Verified'
                      ? 'Verified Recipient'
                      : 'Pending KYC Verification'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(selectedNgo.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold mt-2">
                  {selectedNgo.ngoName || selectedNgo.name}
                </DialogTitle>
                <DialogDescription>
                  Registration No: {selectedNgo.ngoRegistrationNumber || 'Not provided'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1.5">
                  <p className="font-semibold uppercase text-muted-foreground text-[10px] tracking-wider">
                    Official Contact & Leadership
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direct Correspondent:</span>
                    <span className="font-bold text-foreground">{selectedNgo.directCorrespondentName || selectedNgo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position in NGO:</span>
                    <span className="font-semibold text-foreground">{selectedNgo.positionInNgo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{selectedNgo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-foreground">{selectedNgo.phoneNumber || 'N/A'}</span>
                  </div>
                  {selectedNgo.contactForAccreditation && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accreditation Contact:</span>
                      <span className="text-foreground">{selectedNgo.contactForAccreditation}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                  <p className="font-semibold uppercase text-muted-foreground text-[10px] tracking-wider">
                    Account Status
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedNgo.accountStatus || 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {!selectedNgo.isVerifiedRecipient && !selectedNgo.isVerified && selectedNgo.accountStatus !== 'Verified' && (
                  <Button
                    onClick={() => handleVerifyNgo(selectedNgo)}
                    className="bg-[#185500] hover:bg-[#1e6b00] text-white dark:bg-white dark:text-black rounded-xl flex-1 text-xs font-semibold"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Verify NGO (Web App)
                  </Button>
                )}
                <Button asChild variant="outline" className="rounded-xl flex-1 text-xs">
                  <Link href={`/users/kyc?search=${encodeURIComponent(selectedNgo.ngoName || selectedNgo.name || '')}`}>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Audit KYC Docs
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl"
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
