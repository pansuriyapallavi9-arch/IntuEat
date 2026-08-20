'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarDays, Loader2, Sparkles, Plus, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const EMOJI = { breakfast: '🍳', lunch: '🥗', dinner: '🍛', snack: '🍎' };

export default function MealPlan() {
  const router = useRouter();
  const supabase = createClient();
  const [plan, setPlan] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState({});

  const generate = async () => {
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const res = await fetch('/api/meal-plan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not build a plan.');
      setPlan(data.meals);
      setSummary(data.summary || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (m, i) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('meals').insert({
      user_id: user.id, name: m.name, meal_type: m.mealType,
      calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, source: 'plan',
    });
    setAdded((a) => ({ ...a, [i]: true }));
    router.refresh();
  };

  const total = plan ? plan.reduce((s, m) => s + m.calories, 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      {!plan && !loading && (
        <div className="glass flex flex-col items-center p-8 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-glass)' }}>
            <CalendarDays size={26} color="var(--primary)" />
          </span>
          <h3 className="text-lg font-bold">One-day meal plan</h3>
          <p className="mb-5 mt-1 max-w-xs text-sm" style={{ color: 'var(--text-muted)' }}>
            AI builds a full day of meals that fits your calorie & macro targets and diet.
          </p>
          <button onClick={generate} className="btn-primary"><Sparkles size={18} /> Generate my plan</button>
        </div>
      )}

      {loading && (
        <div className="glass flex flex-col items-center p-10">
          <Loader2 size={26} className="animate-spin" color="var(--primary)" />
          <p className="mt-3 text-sm font-semibold">Building your day…</p>
        </div>
      )}

      {error && !loading && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(224,108,117,0.12)', color: 'var(--error)' }}>{error}</p>}

      {plan && (
        <>
          {summary && <p className="glass p-4 text-sm" style={{ color: 'var(--text-muted)' }}>{summary}</p>}
          {plan.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{EMOJI[m.mealType] || '🍽️'}</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--primary)' }}>{m.mealType}</p>
                    <p className="font-bold leading-tight">{m.name}</p>
                  </div>
                </div>
                <button onClick={() => addMeal(m, i)} className="btn-secondary !px-3 !py-2 text-xs">
                  {added[i] ? <><Check size={14} /> Added</> : <><Plus size={14} /> Log</>}
                </button>
              </div>
              {m.items?.length > 0 && (
                <ul className="mb-2 ml-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {m.items.map((it, j) => <li key={j}>• {it}</li>)}
                </ul>
              )}
              <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {m.calories} kcal · P{m.protein} C{m.carbs} F{m.fat}
              </div>
            </motion.div>
          ))}
          <div className="glass flex items-center justify-between p-4">
            <span className="font-bold">Day total</span>
            <span className="font-extrabold">{total} kcal</span>
          </div>
          <button onClick={generate} className="btn-secondary self-center text-sm"><Sparkles size={16} /> Regenerate</button>
        </>
      )}
    </div>
  );
}
