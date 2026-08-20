'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, GlassWater } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function WaterTracker({ goal, initial }) {
  const supabase = createClient();
  const [glasses, setGlasses] = useState(initial);
  const saveTimer = useRef(null);

  const pct = Math.min(100, goal > 0 ? (glasses / goal) * 100 : 0);

  const persist = (value) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().slice(0, 10);
      await supabase
        .from('water_logs')
        .upsert(
          { user_id: user.id, log_date: today, glasses: value },
          { onConflict: 'user_id,log_date' }
        );
    }, 400);
  };

  const change = (delta) => {
    setGlasses((g) => {
      const next = Math.max(0, g + delta);
      persist(next);
      return next;
    });
  };

  return (
    <div className="glass flex flex-col items-center p-8">
      {/* Glass visual */}
      <div className="relative mb-6 overflow-hidden"
        style={{ width: 160, height: 240, border: '4px solid var(--border-medium)', borderRadius: '16px 16px 34px 34px', background: 'rgba(255,255,255,0.35)' }}>
        <motion.div initial={false} animate={{ height: `${pct}%` }} transition={{ type: 'spring', damping: 16 }}
          className="absolute inset-x-0 bottom-0"
          style={{ background: 'linear-gradient(180deg, #A2C2E1 0%, #76A9D0 100%)', borderTop: '2px solid rgba(255,255,255,0.6)' }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold"
          style={{ color: pct > 50 ? '#fff' : 'var(--text-main)' }}>
          {Math.round(pct)}%
        </div>
      </div>

      <div className="mb-4 flex items-center gap-6">
        <button onClick={() => change(-1)} aria-label="Remove glass"
          className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--bg-glass)' }}>
          <Minus size={24} />
        </button>
        <div className="text-center">
          <div className="text-3xl font-extrabold">{glasses}</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>of {goal} glasses</div>
        </div>
        <button onClick={() => change(1)} aria-label="Add glass"
          className="flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: 'var(--primary)' }}>
          <Plus size={24} />
        </button>
      </div>

      <p className="flex items-center gap-2 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <GlassWater size={16} />
        {glasses >= goal ? "You hit your goal today! 🎉" : `${goal - glasses} more to reach your goal.`}
      </p>
    </div>
  );
}
