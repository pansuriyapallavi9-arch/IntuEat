'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit2, Save, Loader2, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateMacros, GOALS, DIETS, DEFICIENCIES } from '@/lib/nutrition';

export default function ProfileForm({ profile }) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: profile.name || '',
    age: profile.age ?? '',
    height: profile.height ?? '',
    weight: profile.weight ?? '',
    gender: profile.gender || 'female',
    goal: profile.goal || 'maintain',
    diet: profile.diet || 'veg',
    deficiencies: profile.deficiencies || [],
  });

  const macros = calculateMacros(form);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleDef = (def) => {
    if (def === 'None') return set({ deficiencies: ['None'] });
    let updated = form.deficiencies.filter((d) => d !== 'None');
    updated = updated.includes(def) ? updated.filter((d) => d !== def) : [...updated, def];
    set({ deficiencies: updated });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const m = calculateMacros(form);
      const { error } = await supabase.from('profiles').update({
        name: form.name,
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
        gender: form.gender,
        goal: form.goal,
        diet: form.diet,
        deficiencies: form.deficiencies,
        target_calories: m.calories,
        target_protein: m.protein,
        target_carbs: m.carbs,
        target_fat: m.fat,
        target_water: m.water,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) throw error;
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  };

  const targets = [
    { label: 'Calories', value: macros.calories, unit: 'kcal', color: 'var(--text-main)' },
    { label: 'Protein', value: macros.protein, unit: 'g', color: 'var(--primary)' },
    { label: 'Carbs', value: macros.carbs, unit: 'g', color: 'var(--secondary)' },
    { label: 'Fat', value: macros.fat, unit: 'g', color: '#e08f6a' },
    { label: 'Water', value: macros.water, unit: 'glasses', color: 'var(--water)' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button className="btn-secondary text-sm" onClick={() => (editing ? save() : setEditing(true))} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? <><Save size={16} /> Save</> : <><Edit2 size={16} /> Edit</>}
        </button>
      </div>

      <div className="glass grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input className="input-field" value={form.name} disabled={!editing} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <label className="label">Age</label>
          <input type="number" className="input-field" value={form.age} disabled={!editing} onChange={(e) => set({ age: e.target.value })} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input-field" value={form.gender} disabled={!editing} onChange={(e) => set({ gender: e.target.value })}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        <div>
          <label className="label">Height (cm)</label>
          <input type="number" className="input-field" value={form.height} disabled={!editing} onChange={(e) => set({ height: e.target.value })} />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input type="number" className="input-field" value={form.weight} disabled={!editing} onChange={(e) => set({ weight: e.target.value })} />
        </div>
        <div>
          <label className="label">Goal</label>
          <select className="input-field" value={form.goal} disabled={!editing} onChange={(e) => set({ goal: e.target.value })}>
            {GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Diet</label>
          <select className="input-field" value={form.diet} disabled={!editing} onChange={(e) => set({ diet: e.target.value })}>
            {DIETS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Known deficiencies</label>
          <div className="flex flex-wrap gap-2">
            {DEFICIENCIES.map((def) => {
              const active = form.deficiencies.includes(def);
              return (
                <button key={def} type="button" disabled={!editing} onClick={() => toggleDef(def)}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-70"
                  style={{
                    borderColor: active ? 'var(--primary)' : 'var(--border-medium)',
                    background: active ? 'var(--primary)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-muted)',
                  }}>
                  {def}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(224,108,117,0.12)', color: 'var(--error)' }}>{error}</p>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="mb-3 text-lg font-bold">Your daily targets</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {targets.map((t) => (
            <div key={t.label} className="glass p-4 text-center">
              <div className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>{t.label}</div>
              <div className="text-2xl font-extrabold" style={{ color: t.color }}>{t.value}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.unit}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <button onClick={signOut} className="btn-secondary mt-2 self-center text-sm"
        style={{ borderColor: 'rgba(224,108,117,0.4)', color: 'var(--error)' }}>
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
