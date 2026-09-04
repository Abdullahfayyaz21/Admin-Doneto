'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getAdminKycRequestsApi,
  KycRequest,
  KycStatus,
  KycQueryDto,
} from '@/lib/kyc';

export interface KycCounts {
  total: number;
  pending: number;
  hold: number;
  approved: number;
  rejected: number;
}

export type SyncIntervalOption = 0 | 5 | 10 | 30 | 60; // 0 = paused/manual

export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant double-tone notification
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Silent fail if audio context not permitted by browser policy
  }
}

export function broadcastKycUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('doneto_kyc_updated'));
    try {
      const channel = new BroadcastChannel('doneto_kyc_channel');
      channel.postMessage({ type: 'KYC_STATE_CHANGED', timestamp: Date.now() });
      channel.close();
    } catch {
      // BroadcastChannel fallback
    }
  }
}

interface UseRealtimeKycOptions {
  search?: string;
  statusFilter?: 'ALL' | KycStatus | string;
  page?: number;
  limit?: number;
  initialInterval?: SyncIntervalOption;
  enableAudioAlert?: boolean;
}

export function useRealtimeKyc(options: UseRealtimeKycOptions = {}) {
  const {
    search = '',
    statusFilter = 'ALL',
    page = 1,
    limit = 10,
    initialInterval = 10,
    enableAudioAlert = true,
  } = options;

  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [syncInterval, setSyncInterval] = useState<SyncIntervalOption>(initialInterval);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('doneto_kyc_sound');
      return stored !== null ? stored === 'true' : enableAudioAlert;
    }
    return enableAudioAlert;
  });

  const [counts, setCounts] = useState<KycCounts>({
    total: 0,
    pending: 0,
    hold: 0,
    approved: 0,
    rejected: 0,
  });

  const previousPendingIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef(true);

  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.allSettled([
        getAdminKycRequestsApi({ limit: 1 }),
        getAdminKycRequestsApi({ limit: 100, status: KycStatus.PENDING }),
        getAdminKycRequestsApi({ limit: 1, status: KycStatus.APPROVED }),
        getAdminKycRequestsApi({ limit: 1, status: KycStatus.REJECTED }),
      ]);

      let totalCount = 0;
      let pendingCount = 0;
      let holdCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;

      if (allRes.status === 'fulfilled') {
        totalCount = allRes.value.total || 0;
      }

      if (pendingRes.status === 'fulfilled') {
        const pendingList = pendingRes.value.data || [];
        // Separate PENDING from HOLD requests if marked in notes/status
        const purePending = pendingList.filter(
          (r) => r.status === KycStatus.PENDING && !r.rejectionReason?.startsWith('[ON HOLD]')
        );
        const holdList = pendingList.filter(
          (r) => r.status === KycStatus.HOLD || r.rejectionReason?.startsWith('[ON HOLD]')
        );
        pendingCount = purePending.length;
        holdCount = holdList.length;

        // Check for new incoming requests
        const currentPendingIds = new Set(purePending.map((r) => r.id));
        if (!isInitialFetchRef.current && currentPendingIds.size > 0) {
          const newItems = purePending.filter((r) => !previousPendingIdsRef.current.has(r.id));
          if (newItems.length > 0) {
            if (soundEnabled) {
              playNotificationChime();
            }
            newItems.forEach((item) => {
              toast.info(`New Verification Request: ${item.ngoName || 'NGO Representative'}`, {
                description: `CNIC: ${item.cnicNumber || 'Submitted for Audit'}`,
                duration: 6000,
              });
            });
          }
        }
        previousPendingIdsRef.current = currentPendingIds;
      }

      if (approvedRes.status === 'fulfilled') {
        approvedCount = approvedRes.value.total || 0;
      }

      if (rejectedRes.status === 'fulfilled') {
        rejectedCount = rejectedRes.value.total || 0;
      }

      setCounts({
        total: totalCount,
        pending: pendingCount,
        hold: holdCount,
        approved: approvedCount,
        rejected: rejectedCount,
      });
    } catch {
      // Silent error handling for background count updates
    }
  }, [soundEnabled]);

  const fetchRequests = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) {
          setLoading(true);
        } else {
          setIsSyncing(true);
        }

        const params: KycQueryDto = {
          page,
          limit,
        };

        if (search.trim()) params.search = search.trim();

        if (statusFilter === 'HOLD') {
          params.status = KycStatus.PENDING;
        } else if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }

        const response = await getAdminKycRequestsApi(params);
        let dataList = response.data || [];

        // Client-side filtering if user specifically filtered by HOLD tab
        if (statusFilter === 'HOLD') {
          dataList = dataList.filter(
            (r) => r.status === KycStatus.HOLD || r.rejectionReason?.startsWith('[ON HOLD]')
          );
        } else if (statusFilter === KycStatus.PENDING) {
          dataList = dataList.filter(
            (r) => r.status === KycStatus.PENDING && !r.rejectionReason?.startsWith('[ON HOLD]')
          );
        }

        setRequests(dataList);
        setTotal(statusFilter === 'HOLD' ? dataList.length : response.total || 0);
        setLastPage(response.lastPage || 1);
        setLastUpdated(new Date());
        isInitialFetchRef.current = false;
      } catch (err: any) {
        if (!isBackground) {
          toast.error(err.response?.data?.message || 'Failed to retrieve KYC queue.');
        }
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    },
    [page, limit, search, statusFilter]
  );

  // Initial and param change fetch
  useEffect(() => {
    fetchRequests(false);
    fetchCounts();
  }, [fetchRequests, fetchCounts]);

  // Periodic Real-Time Sync Polling
  useEffect(() => {
    if (syncInterval === 0) return;

    const timer = setInterval(() => {
      fetchRequests(true);
      fetchCounts();
    }, syncInterval * 1000);

    return () => clearInterval(timer);
  }, [syncInterval, fetchRequests, fetchCounts]);

  // Cross-tab and window event listener
  useEffect(() => {
    const handleCustomEvent = () => {
      fetchRequests(true);
      fetchCounts();
    };

    window.addEventListener('doneto_kyc_updated', handleCustomEvent);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('doneto_kyc_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'KYC_STATE_CHANGED') {
          fetchRequests(true);
          fetchCounts();
        }
      };
    } catch {
      // Ignore broadcast channel if unsupported
    }

    return () => {
      window.removeEventListener('doneto_kyc_updated', handleCustomEvent);
      if (channel) channel.close();
    };
  }, [fetchRequests, fetchCounts]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('doneto_kyc_sound', String(next));
      }
      if (next) playNotificationChime();
      return next;
    });
  };

  const triggerRefresh = async () => {
    await Promise.all([fetchRequests(false), fetchCounts()]);
    toast.success('KYC verification queue refreshed.');
  };

  return {
    requests,
    setRequests,
    loading,
    isSyncing,
    total,
    lastPage,
    lastUpdated,
    counts,
    syncInterval,
    setSyncInterval,
    soundEnabled,
    toggleSound,
    triggerRefresh,
    fetchRequests,
    fetchCounts,
  };
}
