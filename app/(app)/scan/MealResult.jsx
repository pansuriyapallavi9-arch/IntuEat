'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Loader2, RotateCcw, Globe, BadgeCheck } from 'lucide-react';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealResult({ result, mealType, setMealType, onSave, saving, onRescan }) {
  const macros = [
    { label: 'Calories', value: `${result.calories}`, unit: 'kcal' },
    { label: 'Protein', value: result.protein, unit: 'g' },
    { label: 'Carbs', value: result.carbs, unit: 'g' },
    { label: 'Fat', value: result.fat, unit: 'g' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>AI result</p>
          <h2 className="text-xl font-extrabold leading-tight">{result.name}</h2>
        </div>
        <div className="shrink-0 rounded-2xl px-3 py-2 text-center text-white" style={{ background: 'var(--primary)' }}>
          <div className="text-xl font-extrabold">{result.score}</div>
          <div className="text-[10px] font-semibold uppercase">Health</div>
        </div>
      </div>

      {(result.webSearched || result.verifiedSource) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {result.verifiedSource && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: 'var(--bg-glass)', color: 'var(--primary)' }}>
              <BadgeCheck size={13} /> Verified · {result.verifiedSource}
            </span>
          )}
          {result.webSearched && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: 'var(--bg-glass)', color: 'var(--water)' }}>
              <Globe size={13} /> Cross-checked with web search
            </span>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        {macros.map((m) => (
          <div key={m.label} className="rounded-2xl p-3" style={{ background: 'var(--bg-glass)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
            <div className="text-lg font-extrabold">{m.value} <span className="text-sm font-medium">{m.unit}</span></div>
          </div>
        ))}
      </div>

      {result.items?.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 font-bold">🧾 What AI detected</h4>
          <div className="flex flex-col gap-1.5">
            {result.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--bg-glass)' }}>
                <span className="min-w-0 truncate">
                  <span className="font-semibold">{it.name}</span>
                  {it.quantity ? <span style={{ color: 'var(--text-muted)' }}> · {it.quantity}</span> : null}
                </span>
                {it.calories != null && (
                  <span className="shrink-0 font-bold">{Math.round(it.calories)} kcal</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.suggestions?.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 font-bold">💡 Pair it with</h4>
          <div className="flex flex-col gap-2">
            {result.suggestions.map((s, i) => (
              <div key={i} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.6)', borderLeft: '4px solid var(--secondary)' }}>
                <div className="text-sm font-bold">{s.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="label">Log as</label>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {MEAL_TYPES.map((t) => (
          <button key={t} onClick={() => setMealType(t)}
            className="rounded-xl border py-2 text-xs font-semibold capitalize transition-all"
            style={{
              borderColor: mealType === t ? 'var(--primary)' : 'var(--border-medium)',
              background: mealType === t ? 'var(--bg-glass)' : 'transparent',
              color: mealType === t ? 'var(--primary)' : 'var(--text-muted)',
            }}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={onSave} disabled={saving} className="btn-primary flex-1">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Save to history</>}
        </button>
        <button onClick={onRescan} className="btn-secondary">
          <RotateCcw size={16} /> Redo
        </button>
      </div>
    </motion.div>
  );
}
