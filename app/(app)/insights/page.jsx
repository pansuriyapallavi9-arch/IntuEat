import Link from 'next/link';
import { ArrowLeft, TrendingUp, Flame, Beef } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import BarChart from '@/components/BarChart';
import LineChart from '@/components/LineChart';
import WeightLogger from './WeightLogger';

export const dynamic = 'force-dynamic';

function dayKey(d) {
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short' });
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const [{ data: profile }, { data: meals }, { data: weights }] = await Promise.all([
    supabase.from('profiles').select('target_calories, target_protein, weight').eq('id', user.id).maybeSingle(),
    supabase.from('meals').select('calories, protein, logged_at').eq('user_id', user.id).gte('logged_at', since.toISOString()),
    supabase.from('weight_logs').select('weight, log_date').eq('user_id', user.id).order('log_date', { ascending: true }).limit(60),
  ]);

  // Build last 14 days buckets
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({ date: d, cals: 0, protein: 0 });
  }
  for (const m of meals || []) {
    const t = new Date(m.logged_at); t.setHours(0, 0, 0, 0);
    const bucket = days.find((x) => x.date.getTime() === t.getTime());
    if (bucket) { bucket.cals += Number(m.calories || 0); bucket.protein += Number(m.protein || 0); }
  }

  const last7 = days.slice(-7);
  const loggedDays = days.filter((d) => d.cals > 0).length;
  const avgCals = loggedDays ? Math.round(days.reduce((s, d) => s + d.cals, 0) / loggedDays) : 0;
  const avgProtein = loggedDays ? Math.round(days.reduce((s, d) => s + d.protein, 0) / loggedDays) : 0;

  const calData = last7.map((d, i) => ({ label: dayKey(d.date), value: Math.round(d.cals), highlight: i === last7.length - 1 }));

  const weightPoints = (weights || []).map((w) => ({
    label: new Date(w.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: Number(w.weight),
  }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/dashboard" className="rounded-full p-1" aria-label="Back"><ArrowLeft size={20} /></Link>
        <h1 className="text-3xl font-extrabold">Insights</h1>
      </div>

      {/* Averages */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="glass p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--primary)' }}><Flame size={14} /> Avg kcal</div>
          <div className="mt-1 text-2xl font-extrabold">{avgCals || '—'}</div>
        </div>
        <div className="glass p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--secondary)' }}><Beef size={14} /> Avg protein</div>
          <div className="mt-1 text-2xl font-extrabold">{avgProtein || '—'}<span className="text-sm">g</span></div>
        </div>
        <div className="glass p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--water)' }}><TrendingUp size={14} /> Days logged</div>
          <div className="mt-1 text-2xl font-extrabold">{loggedDays}<span className="text-sm">/14</span></div>
        </div>
      </div>

      {/* Calories last 7 days */}
      <div className="glass mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Calories · last 7 days</h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>target {profile?.target_calories || 2000}</span>
        </div>
        <BarChart data={calData} goal={profile?.target_calories || 2000} unit=" kcal" />
      </div>

      {/* Weight tracking */}
      <div className="glass p-5">
        <h2 className="mb-1 font-bold">Weight</h2>
        <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Log it regularly — your daily targets update automatically as your weight changes.
        </p>
        {weightPoints.length > 0 ? (
          <div className="mb-4"><LineChart points={weightPoints} unit=" kg" /></div>
        ) : (
          <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>No weigh-ins yet. Add your first below.</p>
        )}
        <WeightLogger current={profile?.weight || ''} />
      </div>
    </div>
  );
}
