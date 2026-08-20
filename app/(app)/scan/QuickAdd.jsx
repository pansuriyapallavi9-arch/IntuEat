'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Clock, Plus, Check, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function QuickAdd() {
  const router = useRouter();
  const supabase = createClient();

  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedKey, setAddedKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: favs }, { data: meals }] = await Promise.all([
      supabase.from('favorite_foods').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('meals').select('name, meal_type, calories, protein, carbs, fat, score, logged_at')
        .eq('user_id', user.id).order('logged_at', { ascending: false }).limit(40),
    ]);
    setFavorites(favs || []);
    // De-dupe recent by name, keep newest 8
    const seen = new Set();
    const uniq = [];
    for (const m of meals || []) {
      if (seen.has(m.name)) continue;
      seen.add(m.name);
      uniq.push(m);
      if (uniq.length >= 8) break;
    }
    setRecent(uniq);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const logItem = async (item, key) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('meals').insert({
      user_id: user.id,
      name: item.name,
      meal_type: item.meal_type || 'snack',
      calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat,
      score: item.score || 0,
      source: 'quick',
    });
    setAddedKey(key);
    setTimeout(() => setAddedKey(null), 1500);
    router.refresh();
  };

  const removeFav = async (id) => {
    setFavorites((f) => f.filter((x) => x.id !== id));
    await supabase.from('favorite_foods').delete().eq('id', id);
  };

  if (loading) {
    return <div className="glass flex justify-center p-10"><Loader2 size={24} className="animate-spin" color="var(--primary)" /></div>;
  }

  const Row = ({ item, keyId, favId }) => (
    <div className="glass flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {Math.round(item.calories)} kcal · P{Math.round(item.protein)} C{Math.round(item.carbs)} F{Math.round(item.fat)}
        </p>
      </div>
      {favId && (
        <button onClick={() => removeFav(favId)} aria-label="Remove favorite" className="rounded-lg p-2" style={{ color: 'var(--text-muted)' }}>
          <Trash2 size={15} />
        </button>
      )}
      <button onClick={() => logItem(item, keyId)} className="btn-primary !px-3 !py-2 text-sm">
        {addedKey === keyId ? <Check size={16} /> : <Plus size={16} />}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-2 flex items-center gap-2 px-1">
          <Star size={16} color="var(--secondary)" />
          <h3 className="font-bold">Favorites</h3>
        </div>
        {favorites.length ? (
          <div className="flex flex-col gap-2">
            {favorites.map((f) => <Row key={f.id} item={f} keyId={`f-${f.id}`} favId={f.id} />)}
          </div>
        ) : (
          <div className="glass p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Tap the ⭐ on any meal in History to save it here for one-tap logging.
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2 px-1">
          <Clock size={16} color="var(--primary)" />
          <h3 className="font-bold">Recent</h3>
        </div>
        {recent.length ? (
          <div className="flex flex-col gap-2">
            {recent.map((m, i) => <Row key={`r-${i}`} item={m} keyId={`r-${i}`} />)}
          </div>
        ) : (
          <div className="glass p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Your recently logged meals will show up here.
          </div>
        )}
      </section>
    </div>
  );
}
