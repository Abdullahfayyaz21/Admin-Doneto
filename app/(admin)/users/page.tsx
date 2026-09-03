'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  Building2,
  Mail,
  Phone,
  User as UserIcon,
  MapPin,
  FileText,
  Key,
  Globe,
  FileSignature,
  Briefcase,
  Award,
  CheckCircle2,
  Check,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  role: 'Admin' | 'NGO' | 'Donor';
  accountStatus: 'Not Verified' | 'Pending' | 'Verified' | 'Rejected';
  cnicNumber: string | null;
  address: string | null;
  description: string | null;
  ngoName: string | null;
  ngoRegistrationNumber: string | null;
  positionInNgo: string | null;
  directCorrespondentName: string | null;
  contactForAccreditation: string | null;
  proofOfAffiliation: string | null;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

const avatarColors = [
  'from-green-600 to-emerald-700',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-purple-500 to-pink-600',
  'from-emerald-500 to-green-600',
];

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Verified': 'default',
  'Not Verified': 'secondary',
  'Pending': 'outline',
  'Rejected': 'destructive',
};

const roleIcons: Record<string, React.ReactNode> = {
  Admin: <Shield className="h-3.5 w-3.5 mr-1 text-purple-600 dark:text-white" />,
  Donor: <UserCheck className="h-3.5 w-3.5 mr-1 text-[#185500] dark:text-white" />,
  NGO: <Building2 className="h-3.5 w-3.5 mr-1 text-[#185500] dark:text-white" />,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Selected User
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'NGO' | 'Donor'>('Donor');
  const [formStatus, setFormStatus] = useState<'Not Verified' | 'Pending' | 'Verified' | 'Rejected'>('Verified');
  const [formCnic, setFormCnic] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDescription, setFormDescription] = useState('');
  
  // NGO-specific form states
  const [formNgoName, setFormNgoName] = useState('');
  const [formNgoRegistrationNumber, setFormNgoRegistrationNumber] = useState('');
  const [formPositionInNgo, setFormPositionInNgo] = useState('');
  const [formDirectCorrespondentName, setFormDirectCorrespondentName] = useState('');
  const [formContactForAccreditation, setFormContactForAccreditation] = useState('');
  const [formProofOfAffiliation, setFormProofOfAffiliation] = useState('');

  // Verification flags
  const [formEmailVerified, setFormEmailVerified] = useState(false);
  const [formPhoneVerified, setFormPhoneVerified] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.accountStatus = statusFilter;

      const response = await api.get('/users', { params });
      
      const resData = response.data.data || response.data;
      setUsers(resData.data || []);
      setTotal(resData.total || 0);
      setLastPage(resData.lastPage || 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users with search debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, statusFilter, page]);

  // Reset page when filter changes
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleRoleFilter = (val: string) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  // Open creation dialog
  const openCreateDialog = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCountryCode('');
    setFormPassword('');
    setFormRole('Donor');
    setFormStatus('Verified');
    setFormCnic('');
    setFormAddress('');
    setFormDescription('');
    setFormNgoName('');
    setFormNgoRegistrationNumber('');
    setFormPositionInNgo('');
    setFormDirectCorrespondentName('');
    setFormContactForAccreditation('');
    setFormProofOfAffiliation('');
    setFormEmailVerified(false);
    setFormPhoneVerified(false);
    setIsCreateOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const payload: Record<string, any> = {
        name: formName.trim(),
        password: formPassword,
        role: formRole,
        accountStatus: formStatus,
        isVerified: formStatus === 'Verified',
        emailVerified: formEmailVerified || formStatus === 'Verified',
        phoneVerified: formPhoneVerified || formStatus === 'Verified',
      };

      if (formEmail.trim()) payload.email = formEmail.trim();
      if (formPhone.trim()) payload.phoneNumber = formPhone.trim();
      if (formCountryCode.trim()) payload.countryCode = formCountryCode.trim();
      if (formCnic.trim()) payload.cnicNumber = formCnic.trim();
      if (formAddress.trim()) payload.address = formAddress.trim();
      if (formDescription.trim()) payload.description = formDescription.trim();

      if (formRole === 'NGO') {
        if (formNgoName.trim()) payload.ngoName = formNgoName.trim();
        if (formNgoRegistrationNumber.trim()) payload.ngoRegistrationNumber = formNgoRegistrationNumber.trim();
        if (formPositionInNgo.trim()) payload.positionInNgo = formPositionInNgo.trim();
        if (formDirectCorrespondentName.trim()) payload.directCorrespondentName = formDirectCorrespondentName.trim();
        if (formContactForAccreditation.trim()) payload.contactForAccreditation = formContactForAccreditation.trim();
        if (formProofOfAffiliation.trim()) payload.proofOfAffiliation = formProofOfAffiliation.trim();
      }

      await api.post('/users', payload);
      toast.success('User created successfully!');
      setIsCreateOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormPhone(user.phoneNumber || '');
    setFormCountryCode(user.countryCode || '');
    setFormRole(user.role || 'Donor');
    setFormStatus(user.accountStatus || 'Pending');
    setFormCnic(user.cnicNumber || '');
    setFormAddress(user.address || '');
    setFormDescription(user.description || '');
    setFormNgoName(user.ngoName || '');
    setFormNgoRegistrationNumber(user.ngoRegistrationNumber || '');
    setFormPositionInNgo(user.positionInNgo || '');
    setFormDirectCorrespondentName(user.directCorrespondentName || '');
    setFormContactForAccreditation(user.contactForAccreditation || '');
    setFormProofOfAffiliation(user.proofOfAffiliation || '');
    setFormEmailVerified(user.emailVerified || false);
    setFormPhoneVerified(user.phoneVerified || false);
    setIsEditOpen(true);
  };

  const handleQuickVerify = async (user: User) => {
    try {
      const payload: Record<string, any> = {
        isVerified: true,
        accountStatus: 'Verified',
        emailVerified: true,
        phoneVerified: true,
      };

      if (user.role === 'NGO') {
        payload.isVerifiedRecipient = true;
      }

      await api.patch(`/users/${user.id}`, payload);
      
      // Also approve KYC request if one exists for this user/NGO
      try {
        await api.patch(`/kyc/admin/requests/${user.id}/review`, { status: 'APPROVED' });
      } catch {
        // silent if no separate KYC request record
      }

      toast.success(`User "${user.name}" verified on platform & web app!`);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      try {
        await api.patch(`/kyc/admin/requests/${user.id}/review`, { status: 'APPROVED' });
        toast.success(`User "${user.name}" verified on platform & web app!`);
        fetchUsers();
      } catch {
        toast.error(err.response?.data?.message || 'Failed to verify user.');
      }
    }
  };

  const handleQuickReject = async (user: User) => {
    try {
      const payload: Record<string, any> = {
        isVerified: false,
        accountStatus: 'Rejected',
      };
      if (user.role === 'NGO') {
        payload.isVerifiedRecipient = false;
      }
      await api.patch(`/users/${user.id}`, payload);
      toast.success(`User "${user.name}" marked as rejected/unverified.`);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitLoading(true);
      const isNowVerified = formStatus === 'Verified';
      const payload: Record<string, any> = {
        name: formName.trim() || selectedUser.name,
        role: formRole,
        accountStatus: formStatus,
        isVerified: isNowVerified,
        emailVerified: isNowVerified ? true : formEmailVerified,
        phoneVerified: isNowVerified ? true : formPhoneVerified,
      };

      if (formEmail.trim()) payload.email = formEmail.trim();
      if (formPhone.trim()) payload.phoneNumber = formPhone.trim();
      if (formCountryCode.trim()) payload.countryCode = formCountryCode.trim();
      if (formCnic.trim()) payload.cnicNumber = formCnic.trim();
      if (formAddress.trim()) payload.address = formAddress.trim();
      if (formDescription.trim()) payload.description = formDescription.trim();

      if (formRole === 'NGO') {
        if (formNgoName.trim()) payload.ngoName = formNgoName.trim();
        if (formNgoRegistrationNumber.trim()) payload.ngoRegistrationNumber = formNgoRegistrationNumber.trim();
        if (formPositionInNgo.trim()) payload.positionInNgo = formPositionInNgo.trim();
        if (formDirectCorrespondentName.trim()) payload.directCorrespondentName = formDirectCorrespondentName.trim();
        if (formContactForAccreditation.trim()) payload.contactForAccreditation = formContactForAccreditation.trim();
        if (formProofOfAffiliation.trim()) payload.proofOfAffiliation = formProofOfAffiliation.trim();
      }

      await api.patch(`/users/${selectedUser.id}`, payload);
      toast.success('User updated successfully!');
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    if (user.role === 'Admin') {
      toast.error('Admin accounts cannot be deleted.');
      return;
    }
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setSubmitLoading(true);
      await api.delete(`/users/${selectedUser.id}`);
      toast.success('User soft-deleted successfully!');
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!users.length) {
      toast.error('No users list found to export.');
      return;
    }
    const headers = [
      'User ID', 'Name', 'Email', 'Phone', 'Country Code', 'Role', 'Status', 
      'CNIC', 'Address', 'Email Verified', 'Phone Verified', 'Description', 
      'NGO Name', 'NGO Registration Number', 'Position in NGO', 
      'Direct Correspondent', 'Contact for Accreditation', 'Proof of Affiliation', 'Joined Date'
    ];
    const rows = users.map((u) => [
      u.id,
      u.name || '',
      u.email || '',
      u.phoneNumber || '',
      u.countryCode || '',
      u.role || '',
      u.accountStatus || '',
      u.cnicNumber || '',
      u.address || '',
      u.emailVerified ? 'Yes' : 'No',
      u.phoneVerified ? 'Yes' : 'No',
      u.description || '',
      u.ngoName || '',
      u.ngoRegistrationNumber || '',
      u.positionInNgo || '',
      u.directCorrespondentName || '',
      u.contactForAccreditation || '',
      u.proofOfAffiliation || '',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `doneto_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Users list exported successfully!');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage system users, NGO profiles, donors, and roles inside Doneto.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-10 gap-2 self-start sm:self-auto rounded-xl font-medium shadow-md">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm dark:border-0 dark:bg-transparent dark:shadow-none overflow-hidden">
        <CardHeader className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-muted/20 dark:bg-transparent dark:p-0 dark:pb-4">
          <CardTitle className="text-base font-semibold">
            All System Users ({total})
          </CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64 dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-36">
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger className="rounded-xl h-10 border border-input bg-background text-sm text-foreground dark:border-0 dark:bg-white/[0.05]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="NGO">NGO</SelectItem>
                  <SelectItem value="Donor">Donor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="rounded-xl h-10 border border-input bg-background text-sm text-foreground dark:border-0 dark:bg-white/[0.05]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Not Verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CSV Download Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={exportToCSV}
              className="h-10 w-10 shrink-0 rounded-xl border border-input bg-background hover:bg-muted text-foreground dark:border-0 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
              title="Export CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* User Table / Grid */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-transparent">
                  <TableHead className="font-semibold py-3.5 pl-6">User</TableHead>
                  <TableHead className="font-semibold py-3.5">Contact Details</TableHead>
                  <TableHead className="font-semibold py-3.5">Role</TableHead>
                  <TableHead className="font-semibold py-3.5">Status</TableHead>
                  <TableHead className="font-semibold py-3.5">Joined</TableHead>
                  <TableHead className="font-semibold py-3.5 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeletons
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="py-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="py-4">
                        <Skeleton className="h-3.5 w-16" />
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserIcon className="h-8 w-8 text-muted-foreground/50" />
                        <span className="font-medium text-base">No users found</span>
                        <p className="text-sm">Try modifying your filters or search term.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, i) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${
                              avatarColors[i % avatarColors.length]
                            } text-xs font-bold text-white shadow-sm`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block">
                              {user.name}
                            </span>
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
                              ID: {user.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-0.5 text-sm text-foreground">
                          {user.email ? (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              {user.email}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Email</span>
                          )}
                          {user.phoneNumber ? (
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Phone className="h-3 w-3 shrink-0" />
                              {user.phoneNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Phone</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center text-sm font-medium">
                          {roleIcons[user.role]}
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={statusVariant[user.accountStatus] || 'outline'} className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          {user.accountStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.accountStatus !== 'Verified' && !user.isVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickVerify(user)}
                              className="h-8 rounded-xl px-2.5 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:border-emerald-500/30"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                              Verify
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted rounded-full"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border">
                              {user.accountStatus !== 'Verified' && !user.isVerified ? (
                                <DropdownMenuItem onClick={() => handleQuickVerify(user)} className="cursor-pointer gap-2 text-emerald-600 font-medium dark:text-emerald-400">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  Verify User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleQuickReject(user)} className="cursor-pointer gap-2 text-amber-600 font-medium">
                                  <Shield className="h-4 w-4 text-amber-600" />
                                  Unverify Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openEditDialog(user)} className="cursor-pointer gap-2">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                Edit Profile
                              </DropdownMenuItem>
                              {user.role !== 'Admin' && (
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(user)}
                                  className="cursor-pointer text-red-600 focus:text-red-600 gap-2 focus:bg-red-50 dark:focus:bg-red-950/30"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4">
              <span className="text-sm text-muted-foreground">
                Showing page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{lastPage}</strong> (Total {total} users)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 px-3 gap-1 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage}
                  className="h-9 px-3 gap-1 rounded-xl"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Creation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleCreateUser} className="w-full">
            <DialogHeader className="pb-3 text-left">
              <DialogTitle className="text-xl font-bold text-[#185500] dark:text-white">Add New User</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Fill in the details to register a new user in the platform database.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2 max-h-[70vh] overflow-y-auto no-scrollbar px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                {/* General Section */}
                <div className="space-y-1 md:col-span-2 pt-1">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/80 dark:border-white/10">
                    <UserIcon className="h-4.5 w-4.5 text-[#185500] dark:text-white" />
                    <span className="text-sm font-bold text-[#185500] dark:text-white tracking-tight">General Information</span>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-name" className="text-xs font-semibold text-foreground">Full Name *</Label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="create-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter full name"
                      className="pl-10 h-11 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-email" className="text-xs font-semibold text-foreground">Email Address</Label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="create-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-phone" className="text-xs font-semibold text-foreground">Phone Number</Label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="create-phone"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+923001234567"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Country Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-country-code" className="text-xs font-semibold text-foreground">Country Code</Label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="create-country-code"
                      value={formCountryCode}
                      onChange={(e) => setFormCountryCode(e.target.value)}
                      placeholder="e.g. PK, US"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-pass" className="text-xs font-semibold text-foreground">Password *</Label>
                  <div className="relative flex items-center">
                    <Key className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="create-pass"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Password (min 6 chars)"
                      className="pl-10 h-11 rounded-xl text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* CNIC */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-cnic" className="text-xs font-semibold text-foreground">CNIC Number</Label>
                  <div className="relative flex items-center">
                    <FileText className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="create-cnic"
                      value={formCnic}
                      onChange={(e) => setFormCnic(e.target.value)}
                      placeholder="e.g. 35201-1234567-1"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="create-address" className="text-xs font-semibold text-foreground">Residential / Business Address</Label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="create-address"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Enter physical address"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="create-desc" className="text-xs font-semibold text-foreground">Bio / Description</Label>
                  <Textarea
                    id="create-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description about the user..."
                    className="rounded-xl min-h-[85px] text-sm p-3.5"
                  />
                </div>

                {/* Role and Account Section */}
                <div className="space-y-1 md:col-span-2 pt-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/80 dark:border-white/10">
                    <Shield className="h-4 w-4 text-[#185500] dark:text-white" />
                    <span className="text-sm font-bold text-[#185500] dark:text-white">Account & Verification</span>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">System Role</Label>
                  <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                    <SelectTrigger className="rounded-xl h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Donor">Donor</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Account Status</Label>
                  <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                    <SelectTrigger className="rounded-xl h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Not Verified">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Verification Toggles */}
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 p-3.5 bg-muted/30 border border-border/60 rounded-xl">
                  <div className="flex items-center justify-between flex-1">
                    <div className="space-y-0.5">
                      <Label htmlFor="create-email-verified" className="text-xs font-semibold cursor-pointer text-foreground">Email Verified</Label>
                      <p className="text-[11px] text-muted-foreground">Mark email as verified</p>
                    </div>
                    <Switch
                      id="create-email-verified"
                      checked={formEmailVerified}
                      onCheckedChange={setFormEmailVerified}
                    />
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <div className="space-y-0.5">
                      <Label htmlFor="create-phone-verified" className="text-xs font-semibold cursor-pointer text-foreground">Phone Verified</Label>
                      <p className="text-[11px] text-muted-foreground">Mark phone number as verified</p>
                    </div>
                    <Switch
                      id="create-phone-verified"
                      checked={formPhoneVerified}
                      onCheckedChange={setFormPhoneVerified}
                    />
                  </div>
                </div>

                {/* NGO specific details */}
                {formRole === 'NGO' && (
                  <>
                    <div className="space-y-1 md:col-span-2 pt-2">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-border/80 dark:border-white/10">
                        <Building2 className="h-4 w-4 text-[#185500] dark:text-white" />
                        <span className="text-sm font-bold text-[#185500] dark:text-white">NGO Accreditation Details</span>
                      </div>
                    </div>

                    {/* NGO Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="create-ngo-name" className="text-xs font-semibold text-foreground">NGO Official Name</Label>
                      <div className="relative flex items-center">
                        <Building2 className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="create-ngo-name"
                          value={formNgoName}
                          onChange={(e) => setFormNgoName(e.target.value)}
                          placeholder="e.g. Save The Children"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* NGO Registration Number */}
                    <div className="space-y-1.5">
                      <Label htmlFor="create-ngo-reg" className="text-xs font-semibold text-foreground">NGO Registration Number</Label>
                      <div className="relative flex items-center">
                        <FileText className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="create-ngo-reg"
                          value={formNgoRegistrationNumber}
                          onChange={(e) => setFormNgoRegistrationNumber(e.target.value)}
                          placeholder="e.g. REG-12345"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Position in NGO */}
                    <div className="space-y-1.5">
                      <Label htmlFor="create-ngo-pos" className="text-xs font-semibold text-foreground">Your Position in NGO</Label>
                      <div className="relative flex items-center">
                        <Briefcase className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="create-ngo-pos"
                          value={formPositionInNgo}
                          onChange={(e) => setFormPositionInNgo(e.target.value)}
                          placeholder="e.g. Director, Volunteer"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Direct Correspondent Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="create-ngo-corr" className="text-xs font-semibold text-foreground">Direct Correspondent Name</Label>
                      <div className="relative flex items-center">
                        <UserIcon className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="create-ngo-corr"
                          value={formDirectCorrespondentName}
                          onChange={(e) => setFormDirectCorrespondentName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Contact for Accreditation */}
                    <div className="space-y-1.5">
                      <Label htmlFor="create-ngo-contact" className="text-xs font-semibold text-foreground">Contact Email/Phone for Accreditation</Label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="create-ngo-contact"
                          value={formContactForAccreditation}
                          onChange={(e) => setFormContactForAccreditation(e.target.value)}
                          placeholder="email@ngo.org or phone"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Proof of Affiliation */}
                    <div className="space-y-1.5">
                      <Label htmlFor="create-ngo-proof" className="text-xs font-semibold text-foreground">Proof of Affiliation (URL / Text)</Label>
                      <div className="relative flex items-center">
                        <Award className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="create-ngo-proof"
                          value={formProofOfAffiliation}
                          onChange={(e) => setFormProofOfAffiliation(e.target.value)}
                          placeholder="URL to registration docs / proof"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-4 border-t border-border/60 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl h-11 px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="rounded-xl h-11 px-5"
              >
                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleEditUser} className="w-full">
            <DialogHeader className="pb-3 text-left">
              <DialogTitle className="text-xl font-bold text-[#185500] dark:text-white">Edit User Profiles & Status</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Modify user account details, role and manual verification status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2 max-h-[70vh] overflow-y-auto no-scrollbar px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                {/* General Section */}
                <div className="space-y-1 md:col-span-2 pt-1">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/80 dark:border-white/10">
                    <UserIcon className="h-4.5 w-4.5 text-[#185500] dark:text-white" />
                    <span className="text-sm font-bold text-[#185500] dark:text-white tracking-tight">General Information</span>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold text-foreground">Full Name *</Label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="edit-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="text-xs font-semibold text-foreground">Email Address</Label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="edit-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="text-xs font-semibold text-foreground">Phone Number</Label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="edit-phone"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Country Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-country-code" className="text-xs font-semibold text-foreground">Country Code</Label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="edit-country-code"
                      value={formCountryCode}
                      onChange={(e) => setFormCountryCode(e.target.value)}
                      placeholder="e.g. PK, US"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* CNIC */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cnic" className="text-xs font-semibold text-foreground">CNIC Number</Label>
                  <div className="relative flex items-center">
                    <FileText className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="edit-cnic"
                      value={formCnic}
                      onChange={(e) => setFormCnic(e.target.value)}
                      placeholder="35201-XXXXXXX-X"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="edit-address" className="text-xs font-semibold text-foreground">Residential / NGO Address</Label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                    <Input
                      id="edit-address"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Enter physical address"
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="edit-desc" className="text-xs font-semibold text-foreground">Bio / Description</Label>
                  <Textarea
                    id="edit-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description about the user..."
                    className="rounded-xl min-h-[85px] text-sm p-3.5"
                  />
                </div>

                {/* Role and Account Section */}
                <div className="space-y-1 md:col-span-2 pt-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/80 dark:border-white/10">
                    <Shield className="h-4 w-4 text-[#185500] dark:text-white" />
                    <span className="text-sm font-bold text-[#185500] dark:text-white">Account & Verification</span>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">User Role</Label>
                  <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                    <SelectTrigger className="rounded-xl h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Donor">Donor</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Verification Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Verification Status</Label>
                  <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                    <SelectTrigger className="rounded-xl h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Not Verified">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Verification Toggles */}
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 p-3.5 bg-muted/30 border border-border/60 rounded-xl">
                  <div className="flex items-center justify-between flex-1">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit-email-verified" className="text-xs font-semibold cursor-pointer text-foreground">Email Verified</Label>
                      <p className="text-[11px] text-muted-foreground">Toggle email verification status</p>
                    </div>
                    <Switch
                      id="edit-email-verified"
                      checked={formEmailVerified}
                      onCheckedChange={setFormEmailVerified}
                    />
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit-phone-verified" className="text-xs font-semibold cursor-pointer text-foreground">Phone Verified</Label>
                      <p className="text-[11px] text-muted-foreground">Toggle phone verification status</p>
                    </div>
                    <Switch
                      id="edit-phone-verified"
                      checked={formPhoneVerified}
                      onCheckedChange={setFormPhoneVerified}
                    />
                  </div>
                </div>

                {/* NGO specific details */}
                {formRole === 'NGO' && (
                  <>
                    <div className="space-y-1 md:col-span-2 pt-2">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-border/80 dark:border-white/10">
                        <Building2 className="h-4 w-4 text-[#185500] dark:text-white" />
                        <span className="text-sm font-bold text-[#185500] dark:text-white">NGO Accreditation Details</span>
                      </div>
                    </div>

                    {/* NGO Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-ngo-name" className="text-xs font-semibold text-foreground">NGO Official Name</Label>
                      <div className="relative flex items-center">
                        <Building2 className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="edit-ngo-name"
                          value={formNgoName}
                          onChange={(e) => setFormNgoName(e.target.value)}
                          placeholder="e.g. Save The Children"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* NGO Registration Number */}
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-ngo-reg" className="text-xs font-semibold text-foreground">NGO Registration Number</Label>
                      <div className="relative flex items-center">
                        <FileText className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="edit-ngo-reg"
                          value={formNgoRegistrationNumber}
                          onChange={(e) => setFormNgoRegistrationNumber(e.target.value)}
                          placeholder="e.g. REG-12345"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Position in NGO */}
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-ngo-pos" className="text-xs font-semibold text-foreground">Your Position in NGO</Label>
                      <div className="relative flex items-center">
                        <Briefcase className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="edit-ngo-pos"
                          value={formPositionInNgo}
                          onChange={(e) => setFormPositionInNgo(e.target.value)}
                          placeholder="e.g. Director, Volunteer"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Direct Correspondent Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-ngo-corr" className="text-xs font-semibold text-foreground">Direct Correspondent Name</Label>
                      <div className="relative flex items-center">
                        <UserIcon className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="edit-ngo-corr"
                          value={formDirectCorrespondentName}
                          onChange={(e) => setFormDirectCorrespondentName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Contact for Accreditation */}
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-ngo-contact" className="text-xs font-semibold text-foreground">Contact Email/Phone for Accreditation</Label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="edit-ngo-contact"
                          value={formContactForAccreditation}
                          onChange={(e) => setFormContactForAccreditation(e.target.value)}
                          placeholder="email@ngo.org or phone"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Proof of Affiliation */}
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-ngo-proof" className="text-xs font-semibold text-foreground">Proof of Affiliation (URL / Text)</Label>
                      <div className="relative flex items-center">
                        <Award className="absolute left-3.5 h-4 w-4 text-foreground dark:text-white pointer-events-none" />
                        <Input
                          id="edit-ngo-proof"
                          value={formProofOfAffiliation}
                          onChange={(e) => setFormProofOfAffiliation(e.target.value)}
                          placeholder="URL to registration docs / proof"
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-4 border-t border-border/60 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl h-11 px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="rounded-xl h-11 px-5"
              >
                {submitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Update User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600">Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action will hide the user from all dashboard listings and soft-delete their profile.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl h-10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteUser}
              disabled={submitLoading}
              className="rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white"
            >
              {submitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

