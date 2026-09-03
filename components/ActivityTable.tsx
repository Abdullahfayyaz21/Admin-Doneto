'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, UserCheck, Building2, User as UserIcon } from 'lucide-react';
import api from '@/lib/api';

interface UserActivity {
  id: string;
  name: string;
  email: string | null;
  role: string;
  accountStatus: string;
  isVerified: boolean;
  createdAt: string;
}

export function ActivityTable() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users?limit=6');
        const list = res.data?.data?.data || res.data?.data || res.data || [];
        if (Array.isArray(list)) {
          setActivities(list);
        } else {
          setActivities([]);
        }
      } catch (err) {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentUsers();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recent';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No recent platform activities recorded.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">User / Organization</TableHead>
            <TableHead className="text-muted-foreground">Role</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground text-right">Joined Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((user) => {
            const isVerified = user.isVerified || user.accountStatus === 'Verified';
            return (
              <TableRow key={user.id} className="border-b border-border hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div>
                    <span className="font-semibold text-foreground text-xs block">{user.name || 'User'}</span>
                    <span className="text-[11px] text-muted-foreground truncate block max-w-[180px]">
                      {user.email || 'No email provided'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    {user.role === 'NGO' || user.role === 'Recipient' ? (
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                    ) : user.role === 'Admin' ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    <span>{user.role || 'Member'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isVerified ? 'default' : 'secondary'}
                    className={`text-[10px] px-2 py-0.5 rounded-md ${
                      isVerified
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {isVerified ? 'Verified' : user.accountStatus || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground text-right">
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
