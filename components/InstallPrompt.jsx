'use client';

import { useEffect, useState } from 'react';
import { Sprout, Download, Share, X, Plus } from 'lucide-react';

const DISMISS_KEY = 'ie-install-dismissed';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null); // beforeinstallprompt event (Android/desktop)
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed / running as an app → never show.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) return;

    // Respect a previous dismissal for 30 days.
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < 30 * 24 * 60 * 60 * 1000) return;

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIOS(ios);

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS fires no event — show the manual hint after a short delay.
    let t;
    if (ios) t = setTimeout(() => setShow(true), 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 px-4 md:bottom-6 md:left-auto md:right-6 md:w-80 md:px-0">
      <div className="glass flex items-start gap-3 p-4 shadow-lg">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
        >
          <Sprout size={22} color="#fff" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">Install IntuEat</p>
          {isIOS ? (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Tap <Share size={12} className="mx-0.5 inline align-[-1px]" /> then{' '}
              <span className="font-semibold">Add to Home Screen</span>
              <Plus size={12} className="mx-0.5 inline align-[-1px]" />
            </p>
          ) : (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Add it to your home screen for a full-screen, app-like experience.
            </p>
          )}
          {!isIOS && (
            <button onClick={install} className="btn-primary mt-3 w-full py-2 text-sm">
              <Download size={16} /> Install
            </button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 p-1" style={{ color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
