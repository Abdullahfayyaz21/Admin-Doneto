import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const activities = [
  {
    name: 'Sarah Johnson',
    action: 'Updated profile',
    status: 'Completed',
    date: '2024-01-15',
  },
  {
    name: 'Mike Chen',
    action: 'Created account',
    status: 'Pending',
    date: '2024-01-14',
  },
  {
    name: 'Emma Wilson',
    action: 'Deleted post',
    status: 'Failed',
    date: '2024-01-14',
  },
  {
    name: 'James Brown',
    action: 'Changed password',
    status: 'Completed',
    date: '2024-01-13',
  },
  {
    name: 'Lisa Anderson',
    action: 'Uploaded file',
    status: 'Completed',
    date: '2024-01-12',
  },
  {
    name: 'David Lee',
    action: 'Exported data',
    status: 'Pending',
    date: '2024-01-11',
  },
];

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Completed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

export function ActivityTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{activity.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {activity.action}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[activity.status]}>
                  {activity.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {activity.date}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
