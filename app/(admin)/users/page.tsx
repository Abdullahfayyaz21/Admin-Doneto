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
import { toast } from 'sonner';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  role: 'Admin' | 'NGO' | 'Donor';
  accountStatus: 'Not Verified' | 'Pending' | 'Verified' | 'Rejected';
  cnicNumber: string | null;
  address: string | null;
  isVerified: boolean;
  emailVerified: boolean;
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
  Admin: <Shield className="h-3.5 w-3.5 mr-1 text-purple-600 dark:text-purple-400" />,
  Donor: <UserCheck className="h-3.5 w-3.5 mr-1 text-green-600 dark:text-green-400" />,
  NGO: <Building2 className="h-3.5 w-3.5 mr-1 text-green-600 dark:text-green-400" />,
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
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'NGO' | 'Donor'>('Donor');
  const [formStatus, setFormStatus] = useState<'Not Verified' | 'Pending' | 'Verified' | 'Rejected'>('Verified');
  const [formCnic, setFormCnic] = useState('');
  const [formAddress, setFormAddress] = useState('');

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
      
      // NestJS wraps backend responses inside { data, total, page, lastPage } 
      // check if inside nested response from HttpExceptionFilter / TransformInterceptor
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
    setFormPassword('');
    setFormRole('Donor');
    setFormStatus('Verified');
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
      };

      if (formEmail.trim()) payload.email = formEmail.trim();
      if (formPhone.trim()) payload.phoneNumber = formPhone.trim();

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
    setFormRole(user.role || 'Donor');
    setFormStatus(user.accountStatus || 'Pending');
    setFormCnic(user.cnicNumber || '');
    setFormAddress(user.address || '');
    setIsEditOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitLoading(true);
      const payload: Record<string, any> = {
        name: formName.trim(),
        role: formRole,
        accountStatus: formStatus,
        isVerified: formStatus === 'Verified',
        emailVerified: formStatus === 'Verified' ? true : selectedUser.emailVerified,
        cnicNumber: formCnic.trim() || null,
        address: formAddress.trim() || null,
      };

      if (formEmail.trim()) {
        payload.email = formEmail.trim();
      } else {
        payload.email = null;
      }

      if (formPhone.trim()) {
        payload.phoneNumber = formPhone.trim();
      } else {
        payload.phoneNumber = null;
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
    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'CNIC', 'Address', 'Joined Date'];
    const rows = users.map((u) => [
      u.id,
      u.name || '',
      u.email || '',
      u.phoneNumber || '',
      u.role || '',
      u.accountStatus || '',
      u.cnicNumber || '',
      u.address || '',
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
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage system users, NGO profiles, donors, and roles inside Doneto.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="h-10 gap-2 self-start sm:self-auto rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-medium shadow-md shadow-primary/10">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/50 bg-muted/20">
          <CardTitle className="text-base font-semibold">
            All System Users ({total})
          </CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-36">
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger className="rounded-xl h-10">
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
                <SelectTrigger className="rounded-xl h-10">
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
              className="h-10 w-10 shrink-0 rounded-xl hover:bg-muted"
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
                            <DropdownMenuItem onClick={() => openEditDialog(user)} className="cursor-pointer gap-2">
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                              Edit / Verify
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user)}
                              className="cursor-pointer text-red-600 focus:text-red-600 gap-2 focus:bg-red-50 dark:focus:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-border/50">
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
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add New User</DialogTitle>
              <DialogDescription>
                Fill in the details to register a new user in the platform database.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="create-name" className="text-xs font-semibold">Full Name *</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="create-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter full name"
                    className="pl-9 h-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="create-email" className="text-xs font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="create-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="create-phone" className="text-xs font-semibold">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="create-phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+923001234567"
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="create-pass" className="text-xs font-semibold">Password *</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="create-pass"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="pl-9 h-10 rounded-xl"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">System Role</Label>
                  <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                    <SelectTrigger className="rounded-xl h-10">
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
                  <Label className="text-xs font-semibold">Account Status</Label>
                  <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                    <SelectTrigger className="rounded-xl h-10">
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
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="rounded-xl h-10 bg-primary text-white hover:bg-primary/95"
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
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleEditUser}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Edit User Profiles & Status</DialogTitle>
              <DialogDescription>
                Modify user account details, role and manual verification status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold">Full Name *</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-xs font-semibold">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* CNIC (Only useful for NGO/Donor verification) */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-cnic" className="text-xs font-semibold">CNIC Number</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-cnic"
                    value={formCnic}
                    onChange={(e) => setFormCnic(e.target.value)}
                    placeholder="35201-XXXXXXX-X"
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-address" className="text-xs font-semibold">Residential / NGO Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-address"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Enter physical address"
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">User Role</Label>
                  <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                    <SelectTrigger className="rounded-xl h-10">
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
                  <Label className="text-xs font-semibold">Verification Status</Label>
                  <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                    <SelectTrigger className="rounded-xl h-10">
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
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="rounded-xl h-10 bg-primary text-white hover:bg-primary/95"
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

