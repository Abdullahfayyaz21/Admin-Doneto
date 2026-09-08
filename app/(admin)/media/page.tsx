'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  FolderOpen,
  RefreshCw,
  Maximize2,
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
import { broadcastModerationUpdate, subscribeToModerationUpdates } from '@/lib/realtime';

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
  uploadedById?: string;
}

export default function MediaAssetsPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Resolve direct display URL with resilient Cloudinary CDN fallback
  const getMediaUrl = useCallback((item?: MediaItem | null): string => {
    if (!item) return '';
    if (item.url && item.url.startsWith('http')) return item.url;
    if (item.downloadUrl && item.downloadUrl.startsWith('http')) return item.downloadUrl;
    if (item.storageKey) {
      const cleanKey = item.storageKey.replace(/^uploads\//, '');
      return `https://res.cloudinary.com/djn3m9ji/image/upload/${cleanKey}`;
    }
    return '';
  }, []);

  const isImageItem = useCallback((item?: MediaItem | null): boolean => {
    if (!item) return false;
    if (item.mimeType?.startsWith('image/')) return true;
    return /\.(jpe?g|png|webp|gif|svg|bmp|avif)$/i.test(item.fileName || item.storageKey || '');
  }, []);

  const fetchMedia = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/media');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setMediaList(data);
      } else {
        setMediaList([]);
      }
    } catch (error) {
      console.error('Failed to load media assets:', error);
      if (!isBackground) {
        toast.error('Failed to load media assets');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();

    const interval = setInterval(() => {
      fetchMedia(true);
    }, 15000);

    const unsubscribe = subscribeToModerationUpdates(() => {
      fetchMedia(true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchMedia]);

  const handleDelete = async () => {
    if (!selectedMedia) return;
    try {
      setIsDeleting(true);
      await api.delete(`/media/${selectedMedia.id}`);
      toast.success('Media asset deleted successfully');
      setIsDeleteOpen(false);
      setSelectedMedia(null);
      broadcastModerationUpdate('campaigns');
      fetchMedia(true);
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

  // Metrics
  const totalBytes = useMemo(
    () => mediaList.reduce((acc, curr) => acc + (curr.fileSize || 0), 0),
    [mediaList]
  );

  const imageCount = useMemo(
    () => mediaList.filter((m) => isImageItem(m)).length,
    [mediaList, isImageItem]
  );

  const documentCount = useMemo(
    () =>
      mediaList.filter(
        (m) =>
          m.mimeType?.includes('pdf') ||
          m.mimeType?.includes('document') ||
          /\.(pdf|docx?|xlsx?|txt)$/i.test(m.fileName || '')
      ).length,
    [mediaList]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return mediaList.filter((item) => {
      return (
        item.fileName?.toLowerCase().includes(term) ||
        item.storageKey?.toLowerCase().includes(term) ||
        item.mimeType?.toLowerCase().includes(term)
      );
    });
  }, [mediaList, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filtered, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media & Asset Storage</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit and manage campaign imagery, documents, identity attachments, and cloud assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMedia(true)}
            disabled={refreshing}
            className="rounded-xl border-border/60 h-9 gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <Card className="rounded-2xl border border-border/60 bg-card p-4 shadow-xs overflow-hidden">
        <div className="pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60">
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
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border/60 bg-muted/40 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-background shadow-xs text-primary'
                    : 'text-muted-foreground hover:text-foreground'
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
          <div className="p-12">
            <LoadingState text="Loading media assets…" size="md" />
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 text-muted-foreground mb-3">
              <FolderOpen className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold">No Media Assets Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              No files match your search criteria or storage is empty.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {paginatedList.map((item) => {
              const url = getMediaUrl(item);
              const isImg = isImageItem(item);
              const isBroken = brokenImageIds[item.id];

              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative h-32 w-full bg-muted/30 flex items-center justify-center overflow-hidden">
                    {isImg && url && !isBroken ? (
                      <img
                        src={url}
                        alt={item.fileName}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => {
                          setBrokenImageIds((prev) => ({ ...prev, [item.id]: true }));
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                        {getFileIcon(item.mimeType)}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMedia(item);
                        setIsPreviewOpen(true);
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      title="Preview Asset"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
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
                        className="text-xs text-[#185500] dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMedia(item);
                          setIsDeleteOpen(true);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete asset"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold pl-6">Preview</TableHead>
                  <TableHead className="text-xs font-semibold">File</TableHead>
                  <TableHead className="text-xs font-semibold">MIME Type</TableHead>
                  <TableHead className="text-xs font-semibold">Size</TableHead>
                  <TableHead className="text-xs font-semibold">Uploaded Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((item) => {
                  const url = getMediaUrl(item);
                  const isImg = isImageItem(item);
                  const isBroken = brokenImageIds[item.id];

                  return (
                    <TableRow key={item.id} className="group hover:bg-muted/10">
                      <TableCell className="pl-6 py-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted/40 border border-border flex items-center justify-center shrink-0">
                          {isImg && url && !isBroken ? (
                            <img
                              src={url}
                              alt={item.fileName}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              className="h-full w-full object-cover"
                              onError={() => {
                                setBrokenImageIds((prev) => ({ ...prev, [item.id]: true }));
                              }}
                            />
                          ) : (
                            getFileIcon(item.mimeType)
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                            {item.fileName}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[220px]">
                            {item.storageKey}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {item.mimeType || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium py-3">
                        {formatBytes(item.fileSize)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-3">
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
                            onClick={() => {
                              setSelectedMedia(item);
                              setIsDeleteOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 p-4">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg text-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-lg text-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          {selectedMedia && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold truncate">
                  {selectedMedia.fileName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedMedia.mimeType} • {formatBytes(selectedMedia.fileSize)}
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                {isImageItem(selectedMedia) && getMediaUrl(selectedMedia) ? (
                  <div className="relative max-h-96 w-full rounded-xl overflow-hidden bg-black/5 dark:bg-black/30 flex items-center justify-center p-2 border border-border/60">
                    <img
                      src={getMediaUrl(selectedMedia)}
                      alt={selectedMedia.fileName}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="max-h-96 w-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="h-44 w-full rounded-xl border border-dashed border-border/80 flex flex-col items-center justify-center text-muted-foreground">
                    {getFileIcon(selectedMedia.mimeType)}
                    <p className="text-xs mt-2">Document format preview</p>
                  </div>
                )}

                <div className="w-full mt-4 p-3 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-1.5">
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

              <DialogFooter className="flex gap-2 sm:justify-between border-t border-border/60 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(selectedMedia.storageKey || selectedMedia.id, selectedMedia.id)}
                    className="rounded-xl text-xs h-9"
                  >
                    {copiedId === selectedMedia.id ? (
                      <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Copy Key
                  </Button>
                  {getMediaUrl(selectedMedia) && (
                    <a
                      href={getMediaUrl(selectedMedia)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="rounded-xl text-xs h-9 bg-[#185500] hover:bg-[#1e6b00] text-white">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Full Asset
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
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Media Asset
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to permanently delete &ldquo;{selectedMedia?.fileName}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 border-t border-border/60 pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold h-9"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
