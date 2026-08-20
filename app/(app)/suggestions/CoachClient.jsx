'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function CoachClient({ diet, deficiencies, history }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diet, deficiencies, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tips.');
      setTips(data.suggestions || []);
      setIsFallback(Boolean(data.fallback));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [diet, deficiencies, history]);

  useEffect(() => { load(); }, [load]);

  const activeDef = (deficiencies || []).filter((d) => d !== 'None');

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex flex-wrap items-center gap-2 p-4">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Focusing on:</span>
        {activeDef.length ? activeDef.map((d) => (
          <span key={d} className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: 'var(--secondary)' }}>{d}</span>
        )) : (
          <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>General wellness</span>
        )}
        <span className="rounded-full px-3 py-1 text-xs font-bold capitalize" style={{ background: 'var(--bg-glass)', color: 'var(--text-main)' }}>{diet}</span>
      </div>

      {loading && (
        <div className="glass flex flex-col items-center p-10">
          <Loader2 size={28} className="animate-spin" color="var(--primary)" />
          <p className="mt-3 text-sm font-semibold">Your coach is thinking…</p>
        </div>
      )}

      {error && !loading && (
        <div className="glass p-4" style={{ border: '1px solid var(--error)' }}>
          <p className="text-center text-sm font-semibold" style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      {!loading && isFallback && (
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing general guidance — the AI coach was busy. Tap refresh to try again.
        </p>
      )}

      {!loading && tips.map((t, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className="glass flex gap-3 p-5" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--bg-glass)' }}>
            <Sparkles size={18} color="var(--primary)" />
          </span>
          <div>
            <h3 className="font-bold">{t.title}</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{t.reason}</p>
          </div>
        </motion.div>
      ))}

      {!loading && (
        <button onClick={load} className="btn-secondary self-center text-sm">
          <RefreshCw size={16} /> Refresh tips
        </button>
      )}
    </div>
  );
}
