'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Grid,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Loader2,
  FolderOpen,
  AlertCircle,
  Layers,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Tag,
  AlignLeft,
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
import {
  getAdminNgoCategoriesApi,
  createAdminNgoCategoryApi,
  updateAdminNgoCategoryApi,
  deleteAdminNgoCategoryApi,
  NgoCategory
} from '@/lib/kyc-categories';

const avatarGradients = [
  'from-emerald-600 to-teal-700',
  'from-green-500 to-emerald-600',
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-pink-600',
  'from-teal-500 to-emerald-600',
];

export default function KycCategoriesPage() {
  const [categories, setCategories] = useState<NgoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NgoCategory | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminNgoCategoriesApi();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to retrieve NGO categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateOpen = () => {
    setFormName('');
    setFormDescription('');
    setFormIcon('');
    setFormIsActive(true);
    setIsCreateOpen(true);
  };

  const handleEditOpen = (category: NgoCategory) => {
    setSelectedCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormIcon(category.icon || '');
    setFormIsActive(category.isActive);
    setIsEditOpen(true);
  };

  const handleDeleteOpen = (category: NgoCategory) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Category name is required.');
      return;
    }

    try {
      setSubmitLoading(true);
      await createAdminNgoCategoryApi({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        icon: formIcon.trim() || undefined,
        isActive: formIsActive,
      });
      toast.success('NGO category created successfully.');
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
      toast.error('Category name is required.');
      return;
    }

    try {
      setSubmitLoading(true);
      await updateAdminNgoCategoryApi(selectedCategory.id, {
        name: formName.trim(),
        description: formDescription.trim() || null,
        icon: formIcon.trim() || null,
        isActive: formIsActive,
      });
      toast.success('NGO category updated successfully.');
      setIsEditOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update NGO category.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (category: NgoCategory) => {
    const nextActiveState = !category.isActive;
    try {
      // Optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: nextActiveState } : c))
      );
      
      await updateAdminNgoCategoryApi(category.id, {
        isActive: nextActiveState,
      });
      toast.success(`Category "${category.name}" is now ${nextActiveState ? 'active' : 'inactive'}.`);
    } catch (err: any) {
      console.error(err);
      // Revert on error
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, isActive: category.isActive } : c))
      );
      toast.error(err.response?.data?.message || 'Failed to update category status.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      setSubmitLoading(true);
      await deleteAdminNgoCategoryApi(selectedCategory.id);
      toast.success('NGO category deleted successfully.');
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('restrict') || msg.toLowerCase().includes('in use')) {
        toast.error('Cannot delete this category because it is currently linked to registered NGOs.');
      } else {
        toast.error(msg || 'Failed to delete NGO category.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return cat.isActive;
    if (statusFilter === 'INACTIVE') return !cat.isActive;
    return true;
  });

  const getGradient = (id: string | number) => {
    const num = typeof id === 'number' ? id : id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarGradients[Math.abs(num) % avatarGradients.length];
  };

  const formatDate = (dateString: string | undefined) => {
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
          <h1 className="text-2xl font-bold tracking-tight">
            KYC / NGO Categories
          </h1>
          <p className="text-muted-foreground">
            Manage NGO classifications available for selection during KYC registration and verification.
          </p>
        </div>
        <Button 
          onClick={handleCreateOpen}
          className="shadow-md flex items-center gap-2 self-start sm:self-auto rounded-xl py-6 px-5 bg-[#185500] text-white hover:bg-[#1e6b00] dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </Button>
      </div>



      {/* Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card border border-border/60 p-4 rounded-2xl shadow-sm animate-in fade-in-50 slide-in-from-bottom-3 duration-300 delay-100 dark:bg-transparent dark:border-0 dark:p-0 dark:shadow-none">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories by title, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-5 rounded-xl bg-muted/50 border border-input text-sm shadow-sm placeholder:text-muted-foreground text-foreground focus-visible:ring-0 dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus-visible:ring-1 dark:focus-visible:ring-white/20"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5 bg-muted p-1.5 rounded-xl dark:bg-white/[0.05]">
            <Button
              variant={statusFilter === 'ALL' ? 'default' : 'ghost'}
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-lg py-1 px-3 h-8 text-xs font-semibold ${statusFilter === 'ALL' ? 'bg-[#185500] text-white dark:bg-white dark:text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'ghost'}
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-lg py-1 px-3 h-8 text-xs font-semibold ${statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-emerald-600'}`}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'INACTIVE' ? 'default' : 'ghost'}
              onClick={() => setStatusFilter('INACTIVE')}
              className={`rounded-lg py-1 px-3 h-8 text-xs font-semibold ${statusFilter === 'INACTIVE' ? 'bg-red-600 text-white shadow-sm' : 'text-muted-foreground hover:text-red-600'}`}
            >
              Hidden
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border/60 rounded-xl overflow-hidden p-1 bg-muted/50 dark:border-0 dark:bg-white/[0.05]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-[#185500] text-white dark:bg-white dark:text-black shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('table')}
              className={`h-8 w-8 rounded-lg ${viewMode === 'table' ? 'bg-[#185500] text-white dark:bg-white dark:text-black shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* List / Grid Display */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card p-6 rounded-2xl space-y-4 border border-border/60">
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
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-muted/20 text-center border border-border/60">
          <div className="p-4 bg-muted/20 text-muted-foreground rounded-full mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No KYC Categories Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {searchQuery 
              ? `No categories match search query "${searchQuery}". Please try another keyword.`
              : 'Add custom classifications to organize and validate registered NGOs.'
            }
          </p>
          {!searchQuery && (
            <Button 
              onClick={handleCreateOpen}
              className="rounded-xl shadow-lg bg-[#185500] text-white hover:bg-[#1e6b00] dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add First Category
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const grad = getGradient(category.id);
            return (
              <Card 
                key={category.id} 
                className={`group bg-card hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between border border-border/60 ${
                  category.isActive ? 'hover:-translate-y-1' : 'bg-red-500/5 opacity-85 hover:opacity-100 hover:-translate-y-1'
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base line-clamp-1">
                          {category.name}
                        </h3>
                        <Badge 
                          variant={category.isActive ? 'default' : 'secondary'} 
                          className={`text-[10px] px-2 py-0.5 mt-1 border ${
                            category.isActive 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
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
                      <DropdownMenuContent align="end" className="w-40 bg-popover border-border text-popover-foreground rounded-xl">
                        <DropdownMenuItem onClick={() => handleToggleActive(category)} className="flex items-center gap-2 hover:bg-muted cursor-pointer text-xs py-2">
                          {category.isActive ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 text-emerald-500" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditOpen(category)} className="flex items-center gap-2 hover:bg-muted cursor-pointer text-xs py-2">
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteOpen(category)} className="flex items-center gap-2 hover:bg-red-500/10 text-red-500 hover:text-red-600 cursor-pointer text-xs py-2">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {category.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">
                      No description provided.
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-6 py-3.5 bg-muted/20 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>{formatDate(category.createdAt)}</span>
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
        <Card className="bg-card rounded-2xl overflow-hidden shadow-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-150 border border-border/60">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-16 text-muted-foreground py-4">Icon</TableHead>
                <TableHead className="w-20 text-muted-foreground py-4">ID</TableHead>
                <TableHead className="font-semibold text-muted-foreground py-4">Category Name</TableHead>
                <TableHead className="text-muted-foreground py-4">Description</TableHead>
                <TableHead className="text-muted-foreground py-4">Status</TableHead>
                <TableHead className="text-muted-foreground py-4">Created Date</TableHead>
                <TableHead className="w-24 text-right text-muted-foreground py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => {
                const grad = getGradient(category.id);
                return (
                  <TableRow key={category.id} className="border-b border-border hover:bg-muted/30 transition-all duration-200">
                    <TableCell className="py-3">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold`}>
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">#{category.id}</TableCell>
                    <TableCell className="font-semibold text-foreground">{category.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {category.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`text-[10px] border px-2 py-0.5 ${
                          category.isActive 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : 'bg-muted text-muted-foreground border-border'
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
                          className="h-8 w-8 text-[#185500] dark:text-white hover:bg-muted rounded-lg"
                        >
                          <Pencil className="h-4 w-4" />
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
        <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground rounded-2xl shadow-2xl p-6 no-scrollbar">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#185500] dark:text-white">
                <Plus className="h-5 w-5 text-[#185500] dark:text-white" />
                Create NGO Category
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                Add a new classifications category for validating registered NGOs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="create-name" className="text-xs font-semibold text-muted-foreground">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-name"
                  placeholder="e.g. Healthcare, Education, Poverty Alleviation"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  className="bg-muted/50 border-border focus:border-primary rounded-xl py-5 text-sm text-foreground"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-desc" className="text-xs font-semibold text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="create-desc"
                  placeholder="Briefly describe the focus area of NGOs belonging to this classification..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="bg-muted/50 border-border focus:border-primary rounded-xl text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-icon" className="text-xs font-semibold text-muted-foreground">
                  Icon Identifier (Optional)
                </Label>
                <Input
                  id="create-icon"
                  placeholder="e.g. heart, shield, building, award"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  maxLength={100}
                  className="bg-muted/50 border-border focus:border-primary rounded-xl py-5 text-sm text-foreground"
                />
              </div>
              <div className="flex items-center justify-between bg-muted/40 p-3.5 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Active Category</Label>
                  <p className="text-[11px] text-muted-foreground">Visible to NGOs when submitting KYC verification.</p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="rounded-xl flex items-center gap-2 bg-[#185500] text-white hover:bg-[#1e6b00] dark:bg-white dark:text-black dark:hover:bg-neutral-200"
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
        <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground rounded-2xl shadow-2xl p-6 no-scrollbar">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#185500] dark:text-white">
                <Pencil className="h-5 w-5 text-[#185500] dark:text-white" />
                Edit Category
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                Update classification details for this NGO category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold text-muted-foreground">
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
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc" className="text-xs font-semibold text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="edit-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="bg-muted/50 border-border focus:border-primary rounded-xl text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-icon" className="text-xs font-semibold text-muted-foreground">
                  Icon Identifier
                </Label>
                <Input
                  id="edit-icon"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  maxLength={100}
                  className="bg-muted/50 border-border focus:border-primary rounded-xl py-5 text-sm text-foreground"
                />
              </div>
              <div className="flex items-center justify-between bg-muted/40 p-3.5 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Active Category</Label>
                  <p className="text-[11px] text-muted-foreground">Visible to NGOs when submitting KYC verification.</p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl border border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitLoading}
                className="bg-[#185500] text-white hover:bg-[#1e6b00] dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl shadow-md flex items-center gap-2"
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
              Delete NGO Category?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Are you sure you want to delete category <span className="text-foreground font-semibold">&ldquo;{selectedCategory?.name}&rdquo;</span>?
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs leading-relaxed mt-2">
            <strong>Warning:</strong> Categories that are already assigned to registered NGOs or KYC requests cannot be deleted to protect historical record relationships.
          </div>
          <DialogFooter className="gap-2 sm:gap-2 border-t border-border pt-4 mt-2">
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
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg flex items-center gap-2"
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
