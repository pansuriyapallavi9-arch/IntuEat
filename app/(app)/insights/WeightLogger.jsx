'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateMacros } from '@/lib/nutrition';

export default function WeightLogger({ current }) {
  const router = useRouter();
  const supabase = createClient();
  const [weight, setWeight] = useState(current || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    const w = Number(weight);
    if (!w || w <= 0) { setError('Enter a valid weight.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().slice(0, 10);

      // 1) Record the weigh-in
      const { error: wErr } = await supabase
        .from('weight_logs')
        .upsert({ user_id: user.id, log_date: today, weight: w }, { onConflict: 'user_id,log_date' });
      if (wErr) throw wErr;

      // 2) Update profile weight + recompute targets
      const { data: profile } = await supabase
        .from('profiles').select('age, height, gender, goal').eq('id', user.id).maybeSingle();
      const macros = calculateMacros({ ...profile, weight: w });
      await supabase.from('profiles').update({
        weight: w,
        target_calories: macros.calories,
        target_protein: macros.protein,
        target_carbs: macros.carbs,
        target_fat: macros.fat,
        target_water: macros.water,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      setDone(true);
      setTimeout(() => setDone(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="label">Today's weight (kg)</label>
      <div className="flex gap-2">
        <input type="number" inputMode="decimal" className="input-field" placeholder="70"
          value={weight} onChange={(e) => setWeight(e.target.value)} />
        <button onClick={save} disabled={saving} className="btn-primary shrink-0">
          {saving ? <Loader2 size={18} className="animate-spin" /> : done ? <Check size={18} /> : 'Log'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm" style={{ color: 'var(--error)' }}>{error}</p>}
    </div>
  );
}
