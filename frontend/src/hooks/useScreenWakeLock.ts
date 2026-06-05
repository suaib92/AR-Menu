'use client';

import { useEffect } from 'react';

// Keeps the screen awake while the page is mounted and visible.
// Re-acquires the lock when the tab becomes visible again after being hidden.
// Releases on unmount. Safe no-op on browsers without the Wake Lock API.
export function useScreenWakeLock(active = true) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let wakeLock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (cancelled) return;
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch {
        // Permission denied or policy blocked — silently ignore.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !wakeLock) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (wakeLock) {
        wakeLock.release().catch(() => undefined);
        wakeLock = null;
      }
    };
  }, [active]);
}
