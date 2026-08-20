'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PenLine, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MealResult from './MealResult';

const EXAMPLES = [
  'medium size dominoz 2 pizza and one 20 rupees thumbs up',
  '2 rotis, a bowl of dal and a cup of curd',
  'grande caramel latte and a blueberry muffin',
  '3 boiled eggs, 1 banana and a scoop of whey protein',
];

export default function DescribeScanner() {
  const router = useRouter();
  const supabase = createClient();

  const [text, setText] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text.trim() }),
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

  const reset = () => { setResult(null); setError(''); };

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
        source: 'text',
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
      {!result && (
        <div className="glass p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--bg-glass)' }}>
              <PenLine size={18} color="var(--primary)" />
            </span>
            <div>
              <h3 className="font-bold leading-tight">Just describe it</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Brands, sizes & quantities — AI figures out the rest.</p>
            </div>
          </div>

          <textarea
            className="input-field min-h-28 resize-none"
            placeholder="e.g. 2 medium Domino's pizzas and one Thumbs Up"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Example chips */}
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setText(ex)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ borderColor: 'var(--border-medium)', color: 'var(--text-muted)' }}>
                {ex.length > 34 ? ex.slice(0, 34) + '…' : ex}
              </button>
            ))}
          </div>

          <button onClick={analyze} disabled={analyzing || !text.trim()} className="btn-primary mt-4 w-full">
            {analyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing…</> : <><Sparkles size={18} /> Analyze with AI</>}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(224,108,117,0.12)', color: 'var(--error)' }}>
          {error}
        </p>
      )}

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
