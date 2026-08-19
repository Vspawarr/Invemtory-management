'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

// Chrome/Edge/Android fire this event when the site is installable; it's
// non-standard so lib.dom.d.ts doesn't type it.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Static per-session facts (not events to subscribe to), read via
// useSyncExternalStore purely so the server snapshot (false) and the first
// client render agree -- React then reconciles to the real client value
// right after hydration, with no manual effect/setState needed.
function noopSubscribe() {
  return () => {};
}
function useIsIOS() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /iPad|iPhone|iPod/.test(window.navigator.userAgent),
    () => false
  );
}
function useIsStandalone() {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true,
    () => false
  );
}

export default function InstallAppButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const isIOS = useIsIOS();
  const isStandalone = useIsStandalone();

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Already installed, or no installable path on this browser -- nothing to offer.
  if (isStandalone || (!deferredPrompt && !isIOS)) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSHelp(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ??
          'rounded-full bg-gold-500 px-3 py-1.5 text-xs font-bold text-navy-900 active:scale-95'
        }
      >
        📲 Install App
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-center text-sm font-black uppercase text-navy-900">Install This App</p>
            <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>
                Tap the <strong>Share</strong> icon (square with an arrow) in Safari&apos;s toolbar.
              </li>
              <li>
                Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.
              </li>
              <li>
                Tap <strong>Add</strong> in the top-right corner.
              </li>
            </ol>
            <button
              onClick={() => setShowIOSHelp(false)}
              className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
