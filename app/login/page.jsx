'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Surface any error the OAuth callback bounced back with (?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) setError(err);
  }, []);

  const signInWithGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google, so no further work here.
  };

  const goAfterAuth = async () => {
    // Send the user to onboarding until their profile is complete
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .maybeSingle();
    router.replace(profile?.onboarded ? '/dashboard' : '/onboarding');
    router.refresh();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        if (data.session) {
          await goAfterAuth();
        } else {
          setInfo('Almost there! Check your email to confirm your account, then sign in.');
          setMode('signin');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await goAfterAuth();
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass w-full max-w-md p-7"
      >
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <Sprout size={24} color="#fff" />
          </span>
          <span className="title-gradient text-3xl font-extrabold">IntuEat</span>
        </Link>

        <h1 className="text-center text-2xl font-bold">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mb-6 mt-1 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {mode === 'signin'
            ? 'Sign in to continue your journey.'
            : 'Start eating intuitively today.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="label">Name</label>
                <input
                  className="input-field"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === 'signup'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(224,108,117,0.12)', color: 'var(--error)' }}>
              {error}
            </p>
          )}
          {info && (
            <p className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
              style={{ background: 'var(--bg-glass)', color: 'var(--text-main)' }}>
              <Mail size={16} /> {info}
            </p>
          )}

          <button type="submit" className="btn-primary mt-1 w-full text-base" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1" style={{ background: 'var(--border-medium)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>OR</span>
          <span className="h-px flex-1" style={{ background: 'var(--border-medium)' }} />
        </div>

        {/* Google OAuth */}
        <button type="button" onClick={signInWithGoogle} disabled={googleLoading || loading}
          className="btn-secondary w-full text-base">
          {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <><GoogleIcon /> Continue with Google</>}
        </button>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="font-semibold"
            style={{ color: 'var(--primary)' }}
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </main>
  );
}
