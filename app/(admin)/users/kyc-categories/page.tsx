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
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  EyeOff
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
import { Switch } from '@/components/ui/switch';
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
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function KycCategoriesPage() {
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
  const [formIcon, setFormIcon] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kyc/admin/categories');
      const data = response.data.data || response.data;
      setCategories(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to retrieve NGO categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateOpen = () => {
    setFormName('');
    setFormIcon('');
    setFormIsActive(true);
    setIsCreateOpen(true);
  };

  const handleEditOpen = (category: Category) => {
    setSelectedCategory(category);
    setFormName(category.name);
    setFormIcon(category.icon || '');
    setFormIsActive(category.isActive);
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
      await api.post('/kyc/admin/categories', {
        name: formName.trim(),
        icon: formIcon.trim() || undefined,
        isActive: formIsActive,
      });
      toast.success('KYC NGO category created successfully.');
      setIsCreateOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create NGO category.');
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
      await api.patch(`/kyc/admin/categories/${selectedCategory.id}`, {
        name: formName.trim(),
        icon: formIcon.trim() || null,
        isActive: formIsActive,
      });
      toast.success('KYC NGO category updated successfully.');
      setIsEditOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update NGO category.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const nextActiveState = !category.isActive;
      // Optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: nextActiveState } : c))
      );
      
      await api.patch(`/kyc/admin/categories/${category.id}`, {
        isActive: nextActiveState,
      });
      toast.success(`Category "${category.name}" has been ${nextActiveState ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      console.error(err);
      // Revert on error
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: category.isActive } : c))
      );
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      setSubmitLoading(true);
      await api.delete(`/kyc/admin/categories/${selectedCategory.id}`);
      toast.success('KYC NGO category deleted successfully.');
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('restrict')) {
        toast.error('Cannot delete this category because it is currently linked to registered NGOs.');
      } else {
        toast.error(msg || 'Failed to delete NGO category.');
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

  // Stats computation
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const inactiveCategories = categories.filter((c) => !c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in-50 slide-in-from-left-4 duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            KYC / NGO Categories
          </h1>
          <p className="text-muted-foreground">
            Manage NGO classifications available for selection during KYC registration and verification.
          </p>
        </div>
        <Button 
          onClick={handleCreateOpen}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex items-center gap-2 self-start sm:self-auto rounded-xl py-6 px-5 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-75">
        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total NGO Classifications</CardTitle>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-3xl font-bold">{totalCategories}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total defined classifications</p>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Categories</CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-3xl font-bold text-emerald-400">{activeCategories}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Selectable by NGOs during sign up</p>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hidden Categories</CardTitle>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <XCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-3xl font-bold text-red-400">{inactiveCategories}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Deactivated / Hidden from selection</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl shadow-md animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-5 rounded-xl bg-white/5 border-white/10 focus:border-primary text-sm shadow-inner placeholder:text-muted-foreground/60 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={`rounded-xl border-white/10 p-2.5 ${viewMode === 'grid' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 hover:bg-primary/95' : 'bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white'}`}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('table')}
            className={`rounded-xl border-white/10 p-2.5 ${viewMode === 'table' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 hover:bg-primary/95' : 'bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white'}`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* List / Grid Display */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-white/10 bg-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center">
          <div className="p-4 bg-muted/20 text-muted-foreground rounded-full mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No KYC Categories Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {searchQuery 
              ? `No categories match search query "${searchQuery}". Please try another search.`
              : 'Add custom classifications to map NGOs and categorize their social sectors.'
            }
          </p>
          {!searchQuery && (
            <Button 
              onClick={handleCreateOpen}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg"
            >
              Add First Category
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
                className={`group border bg-white/5 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between animate-in fade-in-50 slide-in-from-bottom-4 duration-300 ${
                  category.isActive ? 'border-white/10 hover:border-primary/40 hover:-translate-y-1' : 'border-red-500/20 bg-red-950/5 opacity-80 hover:opacity-100 hover:border-red-500/40 hover:-translate-y-1'
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-base group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <Badge 
                          variant={category.isActive ? 'default' : 'secondary'} 
                          className={`text-[10px] px-2 py-0.5 mt-1 border ${
                            category.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-white/10 text-white">
                        <DropdownMenuItem onClick={() => handleToggleActive(category)} className="flex items-center gap-2 hover:bg-white/5 cursor-pointer text-sm py-2">
                          {category.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 text-amber-500" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 text-emerald-500" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditOpen(category)} className="flex items-center gap-2 hover:bg-white/5 cursor-pointer text-sm py-2">
                          <Pencil className="h-4 w-4 text-primary" />
                          Edit Details
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
                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>Created: {formatDate(category.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Visible:</span>
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() => handleToggleActive(category)}
                      className="scale-75 data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-150">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="w-16 text-muted-foreground py-4">Icon</TableHead>
                <TableHead className="w-16 text-muted-foreground py-4">ID</TableHead>
                <TableHead className="font-semibold text-muted-foreground py-4">Category Name</TableHead>
                <TableHead className="text-muted-foreground py-4">Status</TableHead>
                <TableHead className="text-muted-foreground py-4">Created Date</TableHead>
                <TableHead className="w-24 text-right text-muted-foreground py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => {
                const grad = avatarGradients[getGradientIndex(category.id)];
                return (
                  <TableRow key={category.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-all duration-200 hover:-translate-y-[1px]">
                    <TableCell className="py-3">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold`}>
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">#{category.id}</TableCell>
                    <TableCell className="font-semibold text-white">{category.name}</TableCell>
                    <TableCell>
                      <Badge 
                        className={`text-[10px] border px-2 py-0.5 ${
                          category.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(category.createdAt)}</TableCell>
                    <TableCell className="text-right py-3 pr-6">
                      <div className="flex justify-end items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleActive(category)}
                          className="scale-75 data-[state=checked]:bg-emerald-500"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOpen(category)}
                          className="h-8 w-8 text-primary hover:text-white hover:bg-primary/20 rounded-lg"
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOpen(category)}
                          className="h-8 w-8 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg"
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
        <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-white/10 text-white rounded-2xl shadow-2xl">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create NGO Category
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/80 mt-1 text-sm">
                Add a new classifications category for validating registered NGOs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label htmlFor="create-name" className="text-sm font-medium text-muted-foreground">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-name"
                  placeholder="e.g. Advocacy, Healthcare, Environmental, Education"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  className="bg-white/5 border-white/10 focus:border-primary rounded-xl py-5 text-sm text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-icon" className="text-sm font-medium text-muted-foreground">
                  Icon Key/Label
                </Label>
                <Input
                  id="create-icon"
                  placeholder="e.g. education, heart, leaf (optional)"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  maxLength={255}
                  className="bg-white/5 border-white/10 focus:border-primary rounded-xl py-5 text-sm text-white"
                />
              </div>
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 mt-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Activate Category</Label>
                  <p className="text-xs text-muted-foreground">If active, this option will immediately be visible to NGOs during KYC registration.</p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 border-t border-white/5 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-white/10 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2 transition-transform duration-100 hover:scale-105 active:scale-95"
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
        <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-white/10 text-white rounded-2xl shadow-2xl">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Category
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/80 mt-1 text-sm">
                Update classification details for this NGO category.
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
                  className="bg-white/5 border-white/10 focus:border-primary rounded-xl py-5 text-sm text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon" className="text-sm font-medium text-muted-foreground">
                  Icon Key/Label
                </Label>
                <Input
                  id="edit-icon"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  maxLength={255}
                  className="bg-white/5 border-white/10 focus:border-primary rounded-xl py-5 text-sm text-white"
                />
              </div>
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 mt-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Is Category Active</Label>
                  <p className="text-xs text-muted-foreground">NGOs will only see active classifications when filling out their validation profiles.</p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 border-t border-white/5 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl border border-white/10 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2 transition-transform duration-100 hover:scale-105 active:scale-95"
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
        <DialogContent className="sm:max-w-[420px] bg-zinc-950 border-white/10 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5.5 w-5.5" />
              Delete NGO Category?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80 mt-2 text-sm leading-relaxed">
              Are you sure you want to delete category <span className="text-white font-semibold">"{selectedCategory?.name}"</span>?
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs leading-relaxed mt-2">
            <strong>Warning:</strong> NGO categories that are already assigned to users or KYC requests cannot be deleted to protect historical record relationships.
          </div>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-white/5 pt-4 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl border border-white/10 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={submitLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/10 flex items-center gap-2"
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
