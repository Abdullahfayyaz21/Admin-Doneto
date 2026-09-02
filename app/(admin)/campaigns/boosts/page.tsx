'use client';

import { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Award,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  FolderHeart
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface MockBoostRequest {
  id: number;
  campaignId: number;
  campaignTitle: string;
  ngoName: string;
  boostType: 'Premium' | 'Standard' | 'Flash';
  durationDays: number;
  price: number;
  status: 'Pending' | 'Active' | 'Rejected' | 'Expired';
  requestedAt: string;
  startsAt?: string;
  endsAt?: string;
}

const initialRequests: MockBoostRequest[] = [
  {
    id: 101,
    campaignId: 44,
    campaignTitle: 'Emergency Cardiac Surgery Fund',
    ngoName: 'Hope Medical Trust',
    boostType: 'Premium',
    durationDays: 14,
    price: 15000,
    status: 'Pending',
    requestedAt: '2026-08-06T14:32:00Z'
  },
  {
    id: 102,
    campaignId: 58,
    campaignTitle: 'Rebuilding Flood-Damaged Schools',
    ngoName: 'Al-Khidmat Foundation',
    boostType: 'Standard',
    durationDays: 7,
    price: 8000,
    status: 'Pending',
    requestedAt: '2026-08-06T17:45:00Z'
  },
  {
    id: 103,
    campaignId: 19,
    campaignTitle: 'Clean Water Wells for Thar',
    ngoName: 'Saylani Welfare Trust',
    boostType: 'Flash',
    durationDays: 3,
    price: 4500,
    status: 'Pending',
    requestedAt: '2026-08-07T01:10:00Z'
  }
];

const initialActiveBoosts: MockBoostRequest[] = [
  {
    id: 98,
    campaignId: 12,
    campaignTitle: 'Emergency Health Fund for Patients',
    ngoName: 'Edhi Foundation',
    boostType: 'Premium',
    durationDays: 30,
    price: 30000,
    status: 'Active',
    requestedAt: '2026-07-28T09:00:00Z',
    startsAt: '2026-07-28T10:00:00Z',
    endsAt: '2026-08-27T10:00:00Z'
  },
  {
    id: 99,
    campaignId: 23,
    campaignTitle: 'Providing Solar Kits to Off-Grid villages',
    ngoName: 'Indus Earth Trust',
    boostType: 'Standard',
    durationDays: 10,
    price: 10000,
    status: 'Active',
    requestedAt: '2026-08-01T11:20:00Z',
    startsAt: '2026-08-01T12:00:00Z',
    endsAt: '2026-08-11T12:00:00Z'
  }
];

export default function BoostRequestsPage() {
  const [requests, setRequests] = useState<MockBoostRequest[]>(initialRequests);
  const [activeBoosts, setActiveBoosts] = useState<MockBoostRequest[]>(initialActiveBoosts);

  // Modals state
  const [selectedReq, setSelectedReq] = useState<MockBoostRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Handle Approve Request
  const handleApprove = () => {
    if (!selectedReq) return;
    
    // Transition request to Active Boosts list
    const now = new Date();
    const ends = new Date();
    ends.setDate(now.getDate() + selectedReq.durationDays);

    const newActiveBoost: MockBoostRequest = {
      ...selectedReq,
      status: 'Active',
      startsAt: now.toISOString(),
      endsAt: ends.toISOString()
    };

    setActiveBoosts([newActiveBoost, ...activeBoosts]);
    setRequests(requests.filter(r => r.id !== selectedReq.id));
    
    toast.success(`Boost request for "${selectedReq.campaignTitle}" approved successfully.`);
    setIsApproveOpen(false);
  };

  // Handle Reject Request
  const handleReject = () => {
    if (!selectedReq) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    setRequests(requests.filter(r => r.id !== selectedReq.id));
    toast.error(`Boost request for "${selectedReq.campaignTitle}" was rejected.`);
    setIsRejectOpen(false);
    setRejectionReason('');
  };

  // Handle Terminate Active Boost
  const handleTerminate = () => {
    if (!selectedReq) return;

    setActiveBoosts(activeBoosts.filter(b => b.id !== selectedReq.id));
    toast.success(`Boost campaign for "${selectedReq.campaignTitle}" terminated.`);
    setIsTerminateOpen(false);
  };

  // Pricing helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const totalRevenue = activeBoosts.reduce((sum, b) => sum + b.price, 0) + 
    initialRequests.filter(r => r.status === 'Expired').reduce((sum, r) => sum + r.price, 0); // simulated

  return (
    <div className="space-y-6 animate-in fade-in-30 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Boost Requests
          </h1>
          <p className="text-muted-foreground text-sm">
            Review promotion applications and supervise active campaign boosts.
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card shadow-sm rounded-2xl hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Boosts</CardTitle>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Zap className="h-4.5 w-4.5 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeBoosts.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Currently promoted on discovery</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm rounded-2xl hover:border-yellow-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Applications</CardTitle>
            <div className="p-1.5 bg-yellow-500/10 text-yellow-600 rounded-lg">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{requests.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Awaiting approval review</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm rounded-2xl hover:border-emerald-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Simulated Revenue</CardTitle>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-650">{formatCurrency(totalRevenue + 40000)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Collected from campaign promotion</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm rounded-2xl hover:border-indigo-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discovery Conversion</CardTitle>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">+24.5%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Average boost performance lift</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Left - Requests Queue, Right - Active Boosts */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* REQUESTS QUEUE */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-yellow-500" /> Pending Applications Queue
            </h2>
            <Badge className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/25 font-semibold text-xs py-0.5 px-2.5">
              Review Awaited
            </Badge>
          </div>

          {requests.length === 0 ? (
            <Card className="bg-card p-8 text-center text-muted-foreground rounded-2xl">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">All applications reviewed</p>
              <p className="text-xs mt-1">No pending campaign boosts at the moment.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="bg-card rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                  <CardHeader className="p-4 bg-muted/40 flex flex-row items-center justify-between pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600">
                        Campaign #{req.campaignId}
                      </span>
                      <CardTitle className="text-sm font-bold text-foreground line-clamp-1">{req.campaignTitle}</CardTitle>
                    </div>
                    <Badge className={`border-none rounded-lg text-[9px] font-bold ${
                      req.boostType === 'Premium' ? 'bg-purple-500 text-white' :
                      req.boostType === 'Standard' ? 'bg-indigo-500 text-white' :
                      'bg-amber-500 text-white'
                    }`}>
                      {req.boostType} Boost
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p><strong className="text-foreground">NGO:</strong> {req.ngoName}</p>
                      <p><strong className="text-foreground">Duration:</strong> {req.durationDays} Days</p>
                      <p><strong className="text-foreground">Price:</strong> {formatCurrency(req.price)}</p>
                      <p className="text-muted-foreground"><strong>Submitted:</strong> {formatDate(req.requestedAt)}</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-1.5">
                      <Button 
                        onClick={() => { setSelectedReq(req); setIsRejectOpen(true); }}
                        variant="ghost" 
                        className="text-xs text-rose-500 hover:text-rose-455 hover:bg-rose-500/10 rounded-xl h-8 py-0"
                      >
                        Reject
                      </Button>
                      <Button 
                        onClick={() => { setSelectedReq(req); setIsApproveOpen(true); }}
                        className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-8 py-0"
                      >
                        Approve Boost
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE BOOSTS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-primary" /> Supervised Active Promotions
            </h2>
            <Badge className="bg-primary/10 text-primary border border-primary/25 font-semibold text-xs py-0.5 px-2.5">
              Live
            </Badge>
          </div>

          {activeBoosts.length === 0 ? (
            <Card className="bg-card p-8 text-center text-muted-foreground rounded-2xl">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No active promotions</p>
              <p className="text-xs mt-1">Approve boost requests in the queue to activate discovery boosters.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeBoosts.map((boost) => (
                <Card key={boost.id} className="bg-card rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all duration-300">
                  <CardHeader className="p-4 bg-emerald-500/5 flex flex-row items-center justify-between pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-650">
                        Live Boost Active
                      </span>
                      <CardTitle className="text-sm font-bold text-foreground line-clamp-1">{boost.campaignTitle}</CardTitle>
                    </div>
                    <Badge className="border-none rounded-lg text-[9px] font-bold bg-emerald-500 text-white animate-pulse">
                      Active
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p><strong className="text-foreground">NGO:</strong> {boost.ngoName}</p>
                      <p><strong className="text-foreground">Boost Class:</strong> {boost.boostType}</p>
                      <p><strong className="text-foreground">Starts:</strong> {formatDate(boost.startsAt)}</p>
                      <p><strong className="text-foreground">Ends:</strong> {formatDate(boost.endsAt)}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 text-[10px]">
                      <span className="text-muted-foreground font-semibold">Cost: {formatCurrency(boost.price)}</span>
                      <Button 
                        onClick={() => { setSelectedReq(boost); setIsTerminateOpen(true); }}
                        variant="ghost" 
                        className="text-xs text-rose-500 hover:text-rose-455 hover:bg-rose-500/10 rounded-xl h-8 py-0 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Terminate Early
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* --------------------- DIALOGS (SIMULATED) --------------------- */}

      {/* 1. APPROVE CONFIRMATION */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-sm border-border bg-background text-foreground rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Approve Boost Promotion?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              This will activate the discovery boost booster for campaign &ldquo;{selectedReq?.campaignTitle}&rdquo; for {selectedReq?.durationDays} days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)} className="rounded-xl text-xs border border-border">Cancel</Button>
            <Button 
              onClick={handleApprove} 
              className="bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4"
            >
              Confirm Activation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. REJECT DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md border-border bg-background text-foreground rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Reject Promotion Request</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Specify rejection notes for this boost request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 my-2 text-xs">
            <Label className="text-muted-foreground font-semibold">Rejection details</Label>
            <Textarea
              placeholder="e.g. Inappropriate media content, target audience mismatch..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-xl border-border bg-muted/50 text-foreground min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="rounded-xl text-xs border border-border">Cancel</Button>
            <Button 
              onClick={handleReject} 
              className="bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold px-4"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. TERMINATE CONFIRMATION */}
      <Dialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <DialogContent className="max-w-sm border-border bg-background text-foreground rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-650">Terminate Active Boost?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Are you sure you want to terminate the active boost promotion for &ldquo;{selectedReq?.campaignTitle}&rdquo;? The campaign will lose its discovery booster status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsTerminateOpen(false)} className="rounded-xl text-xs border border-border">Cancel</Button>
            <Button 
              onClick={handleTerminate} 
              className="bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold px-4"
            >
              Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
