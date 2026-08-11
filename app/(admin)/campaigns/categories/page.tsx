'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Grid,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderHeart,
  Calendar,
  Loader2,
  FolderOpen,
  AlertCircle,
  Clock,
  Layers
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

const avatarGradients = [
  'from-pink-500 via-red-500 to-yellow-500',
  'from-green-400 to-blue-500',
  'from-purple-600 to-indigo-600',
  'from-yellow-400 via-orange-500 to-red-500',
  'from-indigo-400 via-purple-400 to-pink-500',
  'from-blue-400 to-emerald-400',
  'from-teal-400 to-cyan-500',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/campaign-categories');
      const data = response.data.data || response.data;
      setCategories(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to retrieve campaign categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateOpen = () => {
    setFormName('');
    setIsCreateOpen(true);
  };

  const handleEditOpen = (category: Category) => {
    setSelectedCategory(category);
    setFormName(category.name);
    setIsEditOpen(true);
  };

  const handleDeleteOpen = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please fill in required fields.');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.post('/campaign-categories', {
        name: formName.trim(),
      });
      toast.success('Campaign category created successfully.');
      setIsCreateOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create campaign category.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!formName.trim()) {
      toast.error('Please fill in required fields.');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.patch(`/campaign-categories/${selectedCategory.id}`, {
        name: formName.trim(),
      });
      toast.success('Campaign category updated successfully.');
      setIsEditOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update campaign category.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      setSubmitLoading(true);
      await api.delete(`/campaign-categories/${selectedCategory.id}`);
      toast.success('Campaign category deleted successfully.');
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      // Custom friendly message for foreign key restrict error
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('restrict')) {
        toast.error('Cannot delete this category because it is currently linked to active fundraising campaigns.');
      } else {
        toast.error(msg || 'Failed to delete campaign category.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGradientIndex = (id: number) => {
    return id % avatarGradients.length;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get some stats
  const totalCategoriesCount = categories.length;
  const latestCategoryName = categories.length > 0 
    ? [...categories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].name
    : 'None';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in-50 slide-in-from-left-4 duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            Campaign Categories
          </h1>
          <p className="text-muted-foreground">
            Manage system-wide campaign categories and classifications.
          </p>
        </div>
        <Button 
          onClick={handleCreateOpen}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex items-center gap-2 self-start sm:self-auto rounded-xl py-6 px-5 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Create Category
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="grid gap-4 md:grid-cols-3 animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-75">
        <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-3xl font-bold">{totalCategoriesCount}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Available for new fundraising campaigns</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Classification</CardTitle>
            <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold truncate max-w-full">{latestCategoryName}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Most recently added classification</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <FolderHeart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              Active
            </div>
            <p className="text-xs text-muted-foreground mt-2">Operational and synced with database</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card border border-border p-4 rounded-2xl shadow-sm animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-5 rounded-xl bg-muted/50 border-border focus:border-primary text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={`rounded-xl border-border p-2.5 ${viewMode === 'grid' ? 'bg-primary text-white border-primary shadow-md hover:bg-primary/95' : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('table')}
            className={`rounded-xl border-border p-2.5 ${viewMode === 'table' ? 'bg-primary text-white border-primary shadow-md hover:bg-primary/95' : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border bg-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-border rounded-2xl bg-muted/20 text-center">
          <div className="p-4 bg-muted/20 text-muted-foreground rounded-full mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Categories Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {searchQuery 
              ? `No categories match search query "${searchQuery}". Please try another search.`
              : 'Get started by creating system campaign categories. These will be available for NGOs/Donors to select.'
            }
          </p>
          {!searchQuery && (
            <Button 
              onClick={handleCreateOpen}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg"
            >
              Create Your First Category
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const grad = avatarGradients[getGradientIndex(category.id)];
            return (
              <Card 
                key={category.id} 
                className="group border border-border bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
              >
                <div className="p-6 space-y-4">
                  {/* Card Header Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base">
                          {category.name}
                        </h3>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted border-border px-2 py-0.5 mt-1">
                          ID: #{category.id}
                        </Badge>
                      </div>
                    </div>
                    {/* Action Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 bg-popover border-border text-popover-foreground">
                        <DropdownMenuItem onClick={() => handleEditOpen(category)} className="flex items-center gap-2 hover:bg-muted cursor-pointer text-sm py-2">
                          <Pencil className="h-4 w-4 text-primary" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteOpen(category)} className="flex items-center gap-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer text-sm py-2">
                          <Trash2 className="h-4 w-4 text-red-400" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>Created: {formatDate(category.createdAt)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-150">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-16 text-muted-foreground py-4">Icon</TableHead>
                <TableHead className="w-16 text-muted-foreground py-4">ID</TableHead>
                <TableHead className="font-semibold text-muted-foreground py-4">Category Name</TableHead>
                <TableHead className="text-muted-foreground py-4">Created Date</TableHead>
                <TableHead className="w-20 text-right text-muted-foreground py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => {
                const grad = avatarGradients[getGradientIndex(category.id)];
                return (
                  <TableRow key={category.id} className="border-b border-border hover:bg-muted/50 transition-all duration-200 hover:-translate-y-[1px]">
                    <TableCell className="py-3">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold`}>
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">#{category.id}</TableCell>
                    <TableCell className="font-semibold text-foreground">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(category.createdAt)}</TableCell>
                    <TableCell className="text-right py-3 pr-6">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOpen(category)}
                          className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary rounded-lg"
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOpen(category)}
                          className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground rounded-2xl shadow-2xl">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create Campaign Category
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                Add a new category description and classification for fundraising campaigns.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label htmlFor="create-name" className="text-sm font-medium text-muted-foreground">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-name"
                  placeholder="e.g. Medical Aid, Education, Hunger Relief"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  className="bg-muted/50 border-border focus:border-primary rounded-xl py-5 text-sm text-foreground"
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-border hover:bg-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2 transition-transform duration-100 hover:scale-105 active:scale-95"
              >
                {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground rounded-2xl shadow-2xl">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Category
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                Update classification properties for this campaign category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium text-muted-foreground">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  className="bg-muted/50 border-border focus:border-primary rounded-xl py-5 text-sm text-foreground"
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl border border-border hover:bg-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2 transition-transform duration-100 hover:scale-105 active:scale-95"
              >
                {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background border-border text-foreground rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5.5 w-5.5" />
              Delete Campaign Category?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Are you sure you want to delete category <span className="text-foreground font-semibold">"{selectedCategory?.name}"</span>?
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs leading-relaxed mt-2">
            <strong>Warning:</strong> Campaign categories that are already assigned to active campaigns cannot be deleted due to integrity rules.
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border border-border hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={submitLoading}
              className="bg-red-650 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/10 flex items-center gap-2"
            >
              {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
