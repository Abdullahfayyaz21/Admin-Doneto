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

// Singleton subscriber set and shared channels to prevent EventEmitter/stream leaks
const subscribers = new Set<(type?: string) => void>();
let isInitialized = false;
let sharedModChannel: BroadcastChannel | null = null;
let sharedKycChannel: BroadcastChannel | null = null;

function ensureChannels() {
  if (typeof window === 'undefined') return;

  if (!isInitialized) {
    isInitialized = true;

    // Single window event listeners attached only ONCE for the application lifecycle
    window.addEventListener('doneto_moderation_updated', (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      subscribers.forEach((cb) => {
        try {
          cb(detail?.type);
        } catch (err) {
          console.error('Error in moderation subscriber:', err);
        }
      });
    });

    window.addEventListener('doneto_kyc_updated', () => {
      subscribers.forEach((cb) => {
        try {
          cb('kyc');
        } catch (err) {
          console.error('Error in kyc subscriber:', err);
        }
      });
    });

    // Single persistent BroadcastChannel instance (avoids rapid open/close port churn)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        sharedModChannel = new BroadcastChannel('doneto_moderation_channel');
        sharedModChannel.onmessage = (event) => {
          const type = event.data?.type;
          subscribers.forEach((cb) => {
            try {
              cb(type);
            } catch (err) {
              console.error('Error in broadcast subscriber:', err);
            }
          });
        };

        sharedKycChannel = new BroadcastChannel('doneto_kyc_channel');
        sharedKycChannel.onmessage = () => {
          subscribers.forEach((cb) => {
            try {
              cb('kyc');
            } catch (err) {
              console.error('Error in kyc broadcast subscriber:', err);
            }
          });
        };
      }
    } catch {
      // safe fallback if BroadcastChannel is unsupported or restricted
    }
  }
}

/**
 * Broadcasts an update event across the current window and all open browser tabs.
 */
export function broadcastModerationUpdate(eventType: ModerationEventType = 'all') {
  if (typeof window === 'undefined') return;

  ensureChannels();

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

  // 2. Broadcast across browser tabs via shared channel (without rapidly creating/closing channels)
  try {
    if (sharedModChannel) {
      sharedModChannel.postMessage({ type: eventType, timestamp: Date.now() });
    }
    if (sharedKycChannel) {
      sharedKycChannel.postMessage({ type: 'MODERATION_CHANGED', timestamp: Date.now() });
    }
  } catch {
    // safe fallback
  }
}

/**
 * Subscribe to moderation updates across both local window events and cross-tab BroadcastChannel.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToModerationUpdates(callback: (type?: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  ensureChannels();
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}
