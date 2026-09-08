'use client';

/**
 * Moderation and platform real-time event coordination.
 * Coordinates cross-tab BroadcastChannel notifications and local Window CustomEvents
 * so sidebar badges, dashboard action counters, and moderation queues remain synchronized in real-time.
 */

export type ModerationEventType =
  | 'approvals'
  | 'kyc'
  | 'delete_requests'
  | 'reports'
  | 'withdrawals'
  | 'campaigns'
  | 'all';

/**
 * Broadcasts an update event across the current window and all open browser tabs.
 */
export function broadcastModerationUpdate(eventType: ModerationEventType = 'all') {
  if (typeof window === 'undefined') return;

  // 1. Dispatch custom events in the current window
  try {
    window.dispatchEvent(
      new CustomEvent('doneto_moderation_updated', {
        detail: { type: eventType, timestamp: Date.now() },
      })
    );
    window.dispatchEvent(new CustomEvent('doneto_kyc_updated'));
  } catch {
    // safe fallback
  }

  // 2. Broadcast across browser tabs via BroadcastChannel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const modChannel = new BroadcastChannel('doneto_moderation_channel');
      modChannel.postMessage({ type: eventType, timestamp: Date.now() });
      modChannel.close();

      const kycChannel = new BroadcastChannel('doneto_kyc_channel');
      kycChannel.postMessage({ type: 'MODERATION_CHANGED', timestamp: Date.now() });
      kycChannel.close();
    }
  } catch {
    // safe fallback if BroadcastChannel is unsupported
  }
}

/**
 * Subscribe to moderation updates across both local window events and cross-tab BroadcastChannel.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToModerationUpdates(callback: (type?: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent)?.detail;
    callback(detail?.type);
  };

  window.addEventListener('doneto_moderation_updated', handleCustomEvent);
  window.addEventListener('doneto_kyc_updated', handleCustomEvent);

  let modChannel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      modChannel = new BroadcastChannel('doneto_moderation_channel');
      modChannel.onmessage = (event) => {
        callback(event.data?.type);
      };
    }
  } catch {
    // safe fallback
  }

  return () => {
    window.removeEventListener('doneto_moderation_updated', handleCustomEvent);
    window.removeEventListener('doneto_kyc_updated', handleCustomEvent);
    if (modChannel) {
      try {
        modChannel.close();
      } catch {
        // safe fallback
      }
    }
  };
}
