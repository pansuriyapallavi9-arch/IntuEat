import Link from 'next/link';
import { Droplets, Camera, ArrowRight, Flame, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Ring from '@/components/Ring';
import BarChart from '@/components/BarChart';

export const dynamic = 'force-dynamic';

function midnight(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Consecutive days (ending today or yesterday) that have at least one meal.
function computeStreak(dateSet) {
  let streak = 0;
  const cursor = midnight(0);
  if (!dateSet.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 1); // allow "today not logged yet"
  while (dateSet.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const { data: recentMeals } = await supabase
    .from('meals')
    .select('name, meal_type, calories, protein, carbs, fat, logged_at')
    .eq('user_id', user.id)
    .gte('logged_at', midnight(29).toISOString())
    .order('logged_at', { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const { data: water } = await supabase
    .from('water_logs').select('glasses').eq('user_id', user.id).eq('log_date', today).maybeSingle();

  const meals = recentMeals || [];
  const todayStart = midnight(0).getTime();
  const todayMeals = meals.filter((m) => {
    const t = new Date(m.logged_at); t.setHours(0, 0, 0, 0);
    return t.getTime() === todayStart;
  });

  const totals = todayMeals.reduce(
    (a, m) => ({
      cals: a.cals + Number(m.calories || 0),
      protein: a.protein + Number(m.protein || 0),
      carbs: a.carbs + Number(m.carbs || 0),
      fat: a.fat + Number(m.fat || 0),
    }),
    { cals: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Streak + 7-day chart
  const dateSet = new Set(meals.map((m) => { const t = new Date(m.logged_at); t.setHours(0, 0, 0, 0); return t.getTime(); }));
  const streak = computeStreak(dateSet);

  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = midnight(i);
    const cals = meals.filter((m) => { const t = new Date(m.logged_at); t.setHours(0, 0, 0, 0); return t.getTime() === d.getTime(); })
      .reduce((s, m) => s + Number(m.calories || 0), 0);
    week.push({ label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), value: Math.round(cals), highlight: i === 0 });
  }

  const targetCals = profile?.target_calories || 2000;
  const targetProtein = profile?.target_protein || 150;
  const targetCarbs = profile?.target_carbs || 220;
  const targetFat = profile?.target_fat || 65;
  const targetWater = profile?.target_water || 8;
  const glasses = water?.glasses || 0;
  const remaining = Math.max(0, Math.round(targetCals - totals.cals));
  const goalHit = totals.cals >= targetCals * 0.95 && totals.cals <= targetCals * 1.1;
  const firstName = (profile?.name || 'there').split(' ')[0];

  const macros = [
    { label: 'Protein', value: totals.protein, max: targetProtein, color: 'var(--primary)' },
    { label: 'Carbs', value: totals.carbs, max: targetCarbs, color: 'var(--secondary)' },
    { label: 'Fat', value: totals.fat, max: targetFat, color: '#e08f6a' },
  ];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-extrabold">Hi {firstName} 👋</h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg, #f2994a, #e08f6a)' }}>
            <Flame size={16} /> {streak}
            <span className="text-xs font-semibold opacity-90">day{streak > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Calorie hero */}
      <div className="glass mb-4 flex items-center gap-5 p-5">
        <Ring value={totals.cals} max={targetCals} size={128} stroke={13} color={goalHit ? 'var(--primary)' : 'var(--primary)'}>
          <span className="text-2xl font-extrabold">{remaining}</span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>kcal left</span>
        </Ring>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            <Flame size={16} /> Today {goalHit && <span className="rounded-full px-2 py-0.5 text-[10px] text-white" style={{ background: 'var(--primary)' }}>ON TARGET 🎯</span>}
          </div>
          <p className="text-2xl font-extrabold">
            {Math.round(totals.cals)}
            <span className="text-base font-medium" style={{ color: 'var(--text-muted)' }}> / {targetCals} kcal</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {todayMeals.length ? `${todayMeals.length} meal${todayMeals.length > 1 ? 's' : ''} logged` : 'No meals yet — add one!'}
          </p>
        </div>
      </div>

      {/* Macro rings */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {macros.map((m) => (
          <div key={m.label} className="glass flex flex-col items-center p-4">
            <Ring value={m.value} max={m.max} size={76} stroke={8} color={m.color}>
              <span className="text-sm font-extrabold">{Math.round(m.value)}</span>
            </Ring>
            <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>of {m.max}g</p>
          </div>
        ))}
      </div>

      {/* 7-day trend -> Insights */}
      <Link href="/insights" className="glass mb-4 block p-5 transition-transform active:scale-[0.99]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            <BarChart3 size={18} /> This week
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Insights <ArrowRight size={14} />
          </span>
        </div>
        <BarChart data={week} goal={targetCals} unit=" kcal" height={110} />
      </Link>

      {/* Water + Add */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link href="/water" className="glass flex flex-col justify-between p-4 transition-transform active:scale-[0.98]">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--water)' }}>
            <Droplets size={18} /> Water
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold">{glasses}</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}> / {targetWater} glasses</span>
          </div>
        </Link>
        <Link href="/scan" className="glass flex flex-col justify-between p-4 transition-transform active:scale-[0.98]">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            <Camera size={18} /> Scan a meal
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
            Add food <ArrowRight size={16} />
          </div>
        </Link>
      </div>

      {/* Today's meals */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Today's meals</h2>
        <Link href="/history" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>See all</Link>
      </div>
      {todayMeals.length ? (
        <div className="flex flex-col gap-2">
          {todayMeals.slice(0, 5).map((m, i) => (
            <div key={i} className="glass flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{m.name}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {m.meal_type} · {new Date(m.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-extrabold">{Math.round(m.calories)}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>kcal</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your logged meals will appear here.</p>
          <Link href="/scan" className="btn-primary mt-3 inline-flex">
            <Camera size={18} /> Scan your first meal
          </Link>
        </div>
      )}
    </div>
  );
}
