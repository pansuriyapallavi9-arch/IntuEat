import { createClient } from '@/lib/supabase/server';
import MealHistory from './MealHistory';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: meals } = await supabase
    .from('meals')
    .select('id, name, meal_type, calories, protein, carbs, fat, score, source, logged_at')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold">History</h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>Everything you've logged, newest first.</p>
      <MealHistory initialMeals={meals || []} />
    </div>
  );
}
