'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateMacros, GOALS, DIETS, DEFICIENCIES } from '@/lib/nutrition';

const TOTAL = 5;

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    gender: 'female',
    goal: 'maintain',
    age: '',
    height: '',
    weight: '',
    diet: 'veg',
    deficiencies: [],
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleDef = (def) => {
    if (def === 'None') return set({ deficiencies: ['None'] });
    let updated = form.deficiencies.filter((d) => d !== 'None');
    updated = updated.includes(def) ? updated.filter((d) => d !== def) : [...updated, def];
    set({ deficiencies: updated });
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 3) return form.age && form.height && form.weight;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Your session expired. Please sign in again.');

      const macros = calculateMacros(form);
      const { error } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          gender: form.gender,
          goal: form.goal,
          age: Number(form.age),
          height: Number(form.height),
          weight: Number(form.weight),
          diet: form.diet,
          deficiencies: form.deficiencies,
          target_calories: macros.calories,
          target_protein: macros.protein,
          target_carbs: macros.carbs,
          target_fat: macros.fat,
          target_water: macros.water,
          onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;

      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err?.message || 'Could not save your profile.');
      setSaving(false);
    }
  };

  const next = () => (step < TOTAL ? setStep(step + 1) : finish());

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
              style={{ background: i + 1 <= step ? 'var(--primary)' : 'var(--border-medium)' }} />
          ))}
        </div>

        <div className="glass p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div>
                  <h2 className="title-gradient text-2xl font-bold">Welcome to IntuEat 🌱</h2>
                  <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Let's get to know you.</p>
                  <label className="label">What should we call you?</label>
                  <input className="input-field mb-4" placeholder="Jane" value={form.name}
                    onChange={(e) => set({ name: e.target.value })} />
                  <label className="label">Gender</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['female', 'male'].map((g) => (
                      <button key={g} type="button" onClick={() => set({ gender: g })}
                        className="rounded-2xl border-2 py-3 font-semibold capitalize transition-all"
                        style={{
                          borderColor: form.gender === g ? 'var(--primary)' : 'var(--border-medium)',
                          background: form.gender === g ? 'var(--bg-glass)' : 'transparent',
                          color: form.gender === g ? 'var(--text-main)' : 'var(--text-muted)',
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="title-gradient text-2xl font-bold">Your goal</h2>
                  <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>We tailor your daily targets to this.</p>
                  <div className="flex flex-col gap-3">
                    {GOALS.map((g) => (
                      <button key={g.id} type="button" onClick={() => set({ goal: g.id })}
                        className="flex items-center gap-3 rounded-2xl border-2 p-4 text-left font-semibold transition-all"
                        style={{
                          borderColor: form.goal === g.id ? 'var(--primary)' : 'var(--border-medium)',
                          background: form.goal === g.id ? 'var(--bg-glass)' : 'transparent',
                          color: form.goal === g.id ? 'var(--text-main)' : 'var(--text-muted)',
                        }}>
                        <span className="text-xl">{g.emoji}</span> {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="title-gradient text-2xl font-bold">Body metrics</h2>
                  <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Used for accurate metabolic math.</p>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="label">Age (years)</label>
                      <input type="number" inputMode="numeric" className="input-field" placeholder="25"
                        value={form.age} onChange={(e) => set({ age: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Height (cm)</label>
                      <input type="number" inputMode="numeric" className="input-field" placeholder="170"
                        value={form.height} onChange={(e) => set({ height: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Weight (kg)</label>
                      <input type="number" inputMode="numeric" className="input-field" placeholder="70"
                        value={form.weight} onChange={(e) => set({ weight: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="title-gradient text-2xl font-bold">Dietary preference</h2>
                  <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>What do you eat?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {DIETS.map((d) => (
                      <button key={d.id} type="button" onClick={() => set({ diet: d.id })}
                        className="rounded-2xl border-2 py-4 font-semibold transition-all"
                        style={{
                          borderColor: form.diet === d.id ? 'var(--primary)' : 'var(--border-medium)',
                          background: form.diet === d.id ? 'var(--bg-glass)' : 'transparent',
                          color: form.diet === d.id ? 'var(--text-main)' : 'var(--text-muted)',
                        }}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="title-gradient text-2xl font-bold">Health baseline</h2>
                  <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Any known deficiencies? (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFICIENCIES.map((def) => {
                      const active = form.deficiencies.includes(def);
                      return (
                        <button key={def} type="button" onClick={() => toggleDef(def)}
                          className="rounded-full border px-4 py-2 text-sm font-medium transition-all"
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
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(224,108,117,0.12)', color: 'var(--error)' }}>
              {error}
            </p>
          )}

          <div className="mt-7 flex items-center justify-between">
            {step > 1 ? (
              <button className="btn-secondary" onClick={() => setStep(step - 1)} disabled={saving}>
                <ArrowLeft size={18} /> Back
              </button>
            ) : <span />}
            <button className="btn-primary" onClick={next} disabled={!canProceed() || saving}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : step === TOTAL ? (<><Check size={18} /> Finish</>) : (<>Next <ArrowRight size={18} /></>)}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
