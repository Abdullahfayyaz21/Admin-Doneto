'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
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

const users = [
  { name: 'Sarah Johnson', email: 'sarah.j@example.com', role: 'Admin', status: 'Active', avatar: 'SJ' },
  { name: 'Mike Chen', email: 'mike.c@example.com', role: 'Editor', status: 'Active', avatar: 'MC' },
  { name: 'Emma Wilson', email: 'emma.w@example.com', role: 'Viewer', status: 'Inactive', avatar: 'EW' },
  { name: 'James Brown', email: 'james.b@example.com', role: 'Editor', status: 'Active', avatar: 'JB' },
  { name: 'Lisa Anderson', email: 'lisa.a@example.com', role: 'Admin', status: 'Active', avatar: 'LA' },
  { name: 'David Lee', email: 'david.l@example.com', role: 'Viewer', status: 'Pending', avatar: 'DL' },
  { name: 'Rachel Green', email: 'rachel.g@example.com', role: 'Editor', status: 'Active', avatar: 'RG' },
  { name: 'Tom Wilson', email: 'tom.w@example.com', role: 'Viewer', status: 'Inactive', avatar: 'TW' },
  { name: 'Anna Smith', email: 'anna.s@example.com', role: 'Admin', status: 'Active', avatar: 'AS' },
  { name: 'Kevin Park', email: 'kevin.p@example.com', role: 'Editor', status: 'Pending', avatar: 'KP' },
];

const avatarColors = [
  'from-blue-500 to-indigo-600',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-purple-500 to-pink-600',
  'from-cyan-500 to-blue-600',
];

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Active: 'default',
  Inactive: 'secondary',
  Pending: 'destructive',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage your platform users and their permissions.
          </p>
        </div>
        <Button className="h-10 gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">All Users ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-muted/50 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 sm:w-64"
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} text-xs font-bold text-white`}
                        >
                          {user.avatar}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[user.status]}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
