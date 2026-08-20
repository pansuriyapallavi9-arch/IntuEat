import { createClient } from '@/lib/supabase/server';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold">Profile</h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
      <ProfileForm profile={profile || {}} />
    </div>
  );
}
