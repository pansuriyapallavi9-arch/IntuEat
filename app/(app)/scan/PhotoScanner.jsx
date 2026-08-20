'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, CheckCircle, Sparkles, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fileToResizedDataUrl } from '@/lib/image';
import MealResult from './MealResult';

export default function PhotoScanner() {
  const router = useRouter();
  const supabase = createClient();

  const [preview, setPreview] = useState(null);
  const [weight, setWeight] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPreview(dataUrl);
    } catch (err) {
      setError(err.message);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setWeight('');
    setError('');
  };

  const analyze = async () => {
    if (!preview || !weight) return;
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview, weight }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('meals').insert({
        user_id: user.id,
        name: result.name,
        meal_type: mealType,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        score: result.score,
        source: 'ai',
      });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Image / upload */}
      <div className="glass overflow-hidden p-4">
        {!preview ? (
          <div className="flex flex-col items-center py-8 text-center">
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5 }}
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'var(--bg-glass)' }}>
              <Camera size={32} color="var(--primary)" />
            </motion.span>
            <h3 className="text-lg font-bold">Snap your dish</h3>
            <p className="mb-5 mt-1 max-w-xs text-sm" style={{ color: 'var(--text-muted)' }}>
              Our AI vision model identifies the food and calculates precise macros.
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <label className="btn-primary cursor-pointer">
                <Camera size={18} /> Take photo
                <input type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
              </label>
              <label className="btn-secondary cursor-pointer">
                <Upload size={18} /> Upload
                <input type="file" accept="image/*" onChange={onPick} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Meal preview" className="mb-3 max-h-72 w-full rounded-2xl object-cover" />
            <button onClick={reset} className="btn-secondary w-full text-sm">
              <RotateCcw size={16} /> Choose another
            </button>
          </div>
        )}
      </div>

      {/* Weight prompt */}
      {preview && !result && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="glass p-5" style={{ border: '2px solid var(--primary)' }}>
          <h3 className="text-center font-bold">Nice shot ✨</h3>
          <p className="mb-4 mt-1 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Roughly how much is on the plate?
          </p>
          <label className="label">Weight (grams)</label>
          <input type="number" inputMode="numeric" className="input-field mb-4 text-center text-xl font-bold"
            placeholder="200" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <button onClick={analyze} disabled={analyzing || !weight} className="btn-primary w-full">
            {analyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing…</> : <><Sparkles size={18} /> Analyze with AI</>}
          </button>
        </motion.div>
      )}

      {error && (
        <p className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(224,108,117,0.12)', color: 'var(--error)' }}>
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <MealResult
          result={result}
          mealType={mealType}
          setMealType={setMealType}
          onSave={save}
          saving={saving}
          onRescan={reset}
        />
      )}
    </div>
  );
}
