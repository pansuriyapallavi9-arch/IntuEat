import { createClient } from '@/lib/supabase/server';
import WaterTracker from './WaterTracker';

export const dynamic = 'force-dynamic';

export default async function WaterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: profile }, { data: log }] = await Promise.all([
    supabase.from('profiles').select('target_water').eq('id', user.id).maybeSingle(),
    supabase.from('water_logs').select('glasses').eq('user_id', user.id).eq('log_date', today).maybeSingle(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold">Water</h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>Small sips, big wins. Stay hydrated.</p>
      <WaterTracker goal={profile?.target_water || 8} initial={log?.glasses || 0} />
    </div>
  );
}
