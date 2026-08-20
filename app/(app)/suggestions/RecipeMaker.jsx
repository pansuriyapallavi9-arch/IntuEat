'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Loader2, Sparkles, Upload, Clock, Users, RotateCcw } from 'lucide-react';
import { fileToResizedDataUrl } from '@/lib/image';

export default function RecipeMaker({ diet }) {
  const [ingredients, setIngredients] = useState('');
  const [image, setImage] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try { setImage(await fileToResizedDataUrl(file)); }
    catch (err) { setError(err.message); }
  };

  const generate = async () => {
    if (!ingredients.trim() && !image) { setError('List some ingredients or add a fridge photo.'); return; }
    setLoading(true);
    setError('');
    setRecipe(null);
    try {
      const res = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, image, diet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create a recipe.');
      setRecipe(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setRecipe(null); setError(''); };

  if (recipe) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
        <h2 className="text-xl font-extrabold">{recipe.title}</h2>
        <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {recipe.time && <span className="flex items-center gap-1"><Clock size={13} /> {recipe.time}</span>}
          <span className="flex items-center gap-1"><Users size={13} /> serves {recipe.servings}</span>
        </div>

        <div className="my-4 grid grid-cols-4 gap-2">
          {[['Cal', recipe.perServing.calories], ['P', recipe.perServing.protein + 'g'], ['C', recipe.perServing.carbs + 'g'], ['F', recipe.perServing.fat + 'g']].map(([l, v]) => (
            <div key={l} className="rounded-xl p-2 text-center" style={{ background: 'var(--bg-glass)' }}>
              <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{l}</div>
              <div className="font-extrabold">{v}</div>
            </div>
          ))}
        </div>
        <p className="mb-1 text-[11px] uppercase" style={{ color: 'var(--text-muted)' }}>per serving</p>

        {recipe.ingredients?.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-1 font-bold">Ingredients</h4>
            <ul className="ml-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {recipe.ingredients.map((it, i) => <li key={i}>• {it}</li>)}
            </ul>
          </div>
        )}
        {recipe.steps?.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-1 font-bold">Steps</h4>
            <ol className="ml-1 flex flex-col gap-1.5 text-sm">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: 'var(--primary)' }}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <button onClick={reset} className="btn-secondary w-full text-sm"><RotateCcw size={16} /> New recipe</button>
      </motion.div>
    );
  }

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--bg-glass)' }}>
          <ChefHat size={18} color="var(--primary)" />
        </span>
        <div>
          <h3 className="font-bold leading-tight">What's in your kitchen?</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>List ingredients or snap your fridge — AI invents a recipe.</p>
        </div>
      </div>

      <textarea className="input-field min-h-24 resize-none" placeholder="e.g. paneer, spinach, onion, tomato, garlic"
        value={ingredients} onChange={(e) => setIngredients(e.target.value)} />

      <div className="mt-3 flex items-center gap-2">
        <label className="btn-secondary cursor-pointer text-sm">
          <Upload size={16} /> {image ? 'Photo added' : 'Add fridge photo'}
          <input type="file" accept="image/*" onChange={onPick} className="hidden" />
        </label>
        {image && <button onClick={() => setImage(null)} className="text-xs" style={{ color: 'var(--text-muted)' }}>remove</button>}
      </div>

      {error && <p className="mt-3 text-sm" style={{ color: 'var(--error)' }}>{error}</p>}

      <button onClick={generate} disabled={loading} className="btn-primary mt-4 w-full">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Cooking…</> : <><Sparkles size={18} /> Create recipe</>}
      </button>
    </div>
  );
}
