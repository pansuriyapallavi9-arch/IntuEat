'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, Clock, Droplets, Sparkles, User, Plus, Sprout, LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InstallPrompt from '@/components/InstallPrompt';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/water', label: 'Water', icon: Droplets },
  { href: '/suggestions', label: 'Coach', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
];

// Mobile bottom bar: 2 items, center Add FAB, 2 items
const BOTTOM_LEFT = [NAV[0], NAV[1]];
const BOTTOM_RIGHT = [NAV[2], NAV[3]];

export default function AppShell({ name, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  };

  const initials = (name || 'You').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-[100dvh] md:flex">
      {/* ---- Desktop sidebar ---- */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 flex-col p-4 md:flex"
        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)', borderRight: '1px solid var(--border-light)' }}>
        <Link href="/dashboard" className="mb-8 mt-2 flex items-center gap-2 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <Sprout size={22} color="#fff" />
          </span>
          <span className="title-gradient text-2xl font-extrabold">IntuEat</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="relative flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-colors"
                style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>
                {active && (
                  <motion.span layoutId="sidebarActive" className="absolute inset-0 rounded-2xl"
                    style={{ background: 'var(--bg-glass)', borderLeft: '4px solid var(--primary)' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }} />
                )}
                <item.icon size={20} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href="/scan" className="btn-primary mb-3 w-full">
          <Plus size={18} /> Add food
        </Link>
        <button onClick={signOut} className="btn-secondary w-full text-sm">
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 md:hidden"
          style={{ background: 'rgba(247,249,242,0.8)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              <Sprout size={18} color="#fff" />
            </span>
            <span className="title-gradient text-xl font-extrabold">IntuEat</span>
          </div>
          <Link href="/profile" aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white"
            style={{ background: 'var(--primary)' }}>
            {initials}
          </Link>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-2 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>

      {/* ---- Mobile bottom nav ---- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-light)' }}>
        {BOTTOM_LEFT.map((item) => <BottomItem key={item.href} item={item} active={isActive(item.href)} />)}

        {/* Center Add FAB */}
        <Link href="/scan" aria-label="Add food" className="relative -top-5 flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', boxShadow: 'var(--shadow-glow)' }}>
            <Plus size={28} />
          </span>
        </Link>

        {BOTTOM_RIGHT.map((item) => <BottomItem key={item.href} item={item} active={isActive(item.href)} />)}
      </nav>

      <InstallPrompt />
    </div>
  );
}

function BottomItem({ item, active }) {
  return (
    <Link href={item.href} className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold"
      style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>
      <item.icon size={22} />
      {item.label}
    </Link>
  );
}
