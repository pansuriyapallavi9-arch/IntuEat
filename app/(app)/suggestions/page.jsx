import { createClient } from '@/lib/supabase/server';
import CoachHub from './CoachHub';

export const dynamic = 'force-dynamic';

export default async function SuggestionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, diet, deficiencies')
    .eq('id', user.id)
    .maybeSingle();

  const { data: meals } = await supabase
    .from('meals')
    .select('name, calories')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(6);

  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold">AI Coach</h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
        Personalized guidance, chat, meal plans & recipes — tuned to your body & habits.
      </p>
      <CoachHub
        name={profile?.name || ''}
        diet={profile?.diet || 'veg'}
        deficiencies={profile?.deficiencies || []}
        history={meals || []}
      />
    </div>
  );
}
