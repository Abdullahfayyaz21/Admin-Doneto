'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Search,
  Trash2,
  Download,
  Copy,
  Check,
  Eye,
  FileText,
  Video,
  File,
  Grid,
  List,
  HardDrive,
  Clock,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  FolderOpen
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
import { LoadingState } from '@/components/brand/states';

interface MediaItem {
  id: string;
  fileName: string;
  fileType?: string;
  mimeType?: string;
  fileSize?: number;
  storageKey?: string;
  url?: string;
  downloadUrl?: string;
  createdAt: string;
  userId?: string;
}

export default function MediaAssetsPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/media');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setMediaList(data);
      } else {
        setMediaList([]);
      }
    } catch (error) {
      console.error('Failed to load media assets:', error);
      toast.error('Failed to load media assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = async () => {
    if (!selectedMedia) return;
    try {
      setIsDeleting(true);
      await api.delete(`/media/${selectedMedia.id}`);
      toast.success('Media asset deleted successfully');
      setIsDeleteOpen(false);
      setSelectedMedia(null);
      fetchMedia();
    } catch (error: any) {
      console.error('Delete media error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete media asset');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Storage key copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime?: string) => {
    if (mime?.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-emerald-500" />;
    if (mime?.startsWith('video/')) return <Video className="h-5 w-5 text-blue-500" />;
    if (mime?.includes('pdf') || mime?.includes('document')) return <FileText className="h-5 w-5 text-amber-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const filtered = mediaList.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.fileName?.toLowerCase().includes(term) ||
      item.storageKey?.toLowerCase().includes(term) ||
      item.mimeType?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalBytes = mediaList.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Media & Asset Storage
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage campaign imagery, documents, identity attachments, and platform assets.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchMedia}
          className="rounded-xl border-border self-start md:self-auto"
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          Refresh Storage
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mediaList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Uploaded platform files</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Usage
            </CardTitle>
            <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-500">
              <HardDrive className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatBytes(totalBytes)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total disk footprint</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Provider
            </CardTitle>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <Layers className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Cloudflare R2 / Local</div>
            <p className="text-xs text-muted-foreground mt-1">Presigned SSL protected URLs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Container */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none overflow-hidden">
        <div className="pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by filename or storage key..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground dark:border-0 dark:bg-white/[0.05] dark:placeholder:text-muted-foreground/60 dark:focus:bg-white/[0.08] dark:focus:ring-1 dark:focus:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border/60 bg-muted/40 p-1 dark:border-0 dark:bg-white/[0.05]">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {filtered.length} files
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingState text="Loading media assets…" size="md" />
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-3">
              <FolderOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No Media Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              No files match your search criteria or storage is empty.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {paginatedList.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-28 w-full bg-muted/40 flex items-center justify-center overflow-hidden">
                  {item.url || item.downloadUrl ? (
                    <img
                      src={item.url || item.downloadUrl}
                      alt={item.fileName}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:bg-black/20 transition-colors">
                    {(!item.url && !item.downloadUrl) && getFileIcon(item.mimeType)}
                  </div>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground truncate" title={item.fileName}>
                      {item.fileName || 'asset-file'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatBytes(item.fileSize)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() => {
                        setSelectedMedia(item);
                        setIsPreviewOpen(true);
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMedia(item);
                        setIsDeleteOpen(true);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>File</TableHead>
                  <TableHead>MIME Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-muted border border-border flex items-center justify-center">
                          {getFileIcon(item.mimeType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                            {item.fileName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                            {item.storageKey}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {item.mimeType || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatBytes(item.fileSize)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedMedia(item);
                            setIsPreviewOpen(true);
                          }}
                          className="h-8 text-xs rounded-lg"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(item.storageKey || item.id, item.id)}
                          className="h-8 text-xs rounded-lg"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedMedia(item);
                            setIsDeleteOpen(true);
                          }}
                          className="h-8 text-xs rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Media Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          {selectedMedia && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold truncate">
                  {selectedMedia.fileName}
                </DialogTitle>
                <DialogDescription>
                  Size: {formatBytes(selectedMedia.fileSize)} | Type: {selectedMedia.mimeType || 'file'}
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 flex flex-col items-center justify-center">
                {selectedMedia.url || selectedMedia.downloadUrl ? (
                  <div className="max-h-72 w-full rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                    <img
                      src={selectedMedia.url || selectedMedia.downloadUrl}
                      alt={selectedMedia.fileName}
                      className="max-h-72 w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                    {getFileIcon(selectedMedia.mimeType)}
                    <p className="text-xs mt-2">Preview not available for this binary format</p>
                  </div>
                )}

                <div className="w-full mt-4 p-3 rounded-xl border border-border bg-muted/30 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage Key:</span>
                    <span className="font-mono text-foreground">{selectedMedia.storageKey || selectedMedia.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded On:</span>
                    <span className="text-foreground">{new Date(selectedMedia.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(selectedMedia.storageKey || selectedMedia.id, selectedMedia.id)}
                    className="rounded-xl"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Key
                  </Button>
                  {(selectedMedia.url || selectedMedia.downloadUrl) && (
                    <a
                      href={selectedMedia.url || selectedMedia.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="rounded-xl">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open File
                      </Button>
                    </a>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Media Asset
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &quot;{selectedMedia?.fileName}&quot;? This action cannot be undone and will break any campaign or user profile pointing to this storage key.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
