'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Camera, Barcode, PenLine, UtensilsCrossed, Pencil, Star, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function groupByDay(meals) {
  const groups = {};
  for (const m of meals) {
    const key = new Date(m.logged_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    (groups[key] ||= []).push(m);
  }
  return groups;
}

function sourceIcon(source) {
  if (source === 'barcode') return <Barcode size={18} color="var(--primary)" />;
  if (source === 'text') return <PenLine size={18} color="var(--primary)" />;
  return <Camera size={18} color="var(--primary)" />;
}

export default function MealHistory({ initialMeals }) {
  const supabase = createClient();
  const [meals, setMeals] = useState(initialMeals);
  const [editing, setEditing] = useState(null); // meal id
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [faved, setFaved] = useState({}); // id -> true

  const remove = async (id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('meals').delete().eq('id', id);
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setDraft({ name: m.name, meal_type: m.meal_type, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat });
  };

  const saveEdit = async (id) => {
    setBusy(true);
    const patch = {
      name: draft.name,
      meal_type: draft.meal_type,
      calories: Number(draft.calories) || 0,
      protein: Number(draft.protein) || 0,
      carbs: Number(draft.carbs) || 0,
      fat: Number(draft.fat) || 0,
    };
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    await supabase.from('meals').update(patch).eq('id', id);
    setBusy(false);
    setEditing(null);
  };

  const favorite = async (m) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('favorite_foods').insert({
      user_id: user.id, name: m.name, meal_type: m.meal_type,
      calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, score: m.score || 0,
    });
    setFaved((f) => ({ ...f, [m.id]: true }));
  };

  if (!meals.length) {
    return (
      <div className="glass p-8 text-center">
        <UtensilsCrossed size={32} className="mx-auto mb-3" color="var(--text-muted)" />
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>No meals logged yet.</p>
        <Link href="/scan" className="btn-primary inline-flex"><Camera size={18} /> Add your first meal</Link>
      </div>
    );
  }

  const groups = groupByDay(meals);

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(groups).map(([day, dayMeals]) => {
        const cals = dayMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
        return (
          <div key={day}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-bold">{day}</h2>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{Math.round(cals)} kcal</span>
            </div>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {dayMeals.map((m) => (
                  <motion.div key={m.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="glass p-4">
                    {editing === m.id ? (
                      <div className="flex flex-col gap-2">
                        <input className="input-field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                        <div className="grid grid-cols-4 gap-2">
                          {['calories', 'protein', 'carbs', 'fat'].map((k) => (
                            <div key={k}>
                              <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{k.slice(0, 4)}</span>
                              <input type="number" className="input-field !px-2 !py-1.5 text-center text-sm"
                                value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <select className="input-field !w-auto !py-1.5 text-sm capitalize" value={draft.meal_type} onChange={(e) => setDraft({ ...draft, meal_type: e.target.value })}>
                            {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={() => setEditing(null)} className="rounded-lg p-2" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                            <button onClick={() => saveEdit(m.id)} disabled={busy} className="btn-primary !px-4 !py-2 text-sm">
                              {busy ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Save</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--bg-glass)' }}>
                          {sourceIcon(m.source)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{m.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="capitalize">{m.meal_type}</span> · P{Math.round(m.protein)} C{Math.round(m.carbs)} F{Math.round(m.fat)} ·{' '}
                            {new Date(m.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-extrabold">{Math.round(m.calories)}</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>kcal</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          <button onClick={() => favorite(m)} aria-label="Save as favorite" className="rounded-lg p-1.5"
                            style={{ color: faved[m.id] ? 'var(--secondary)' : 'var(--text-muted)' }}>
                            <Star size={15} fill={faved[m.id] ? 'var(--secondary)' : 'none'} />
                          </button>
                          <button onClick={() => startEdit(m)} aria-label="Edit" className="rounded-lg p-1.5" style={{ color: 'var(--text-muted)' }}><Pencil size={15} /></button>
                          <button onClick={() => remove(m.id)} aria-label="Delete" className="rounded-lg p-1.5" style={{ color: 'var(--text-muted)' }}><Trash2 size={15} /></button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
