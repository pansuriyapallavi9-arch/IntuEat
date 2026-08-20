import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// OAuth / email-confirmation callback. Supabase redirects here with a `code`
// which we exchange for a session, then route the user to the right place.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorDescription = searchParams.get('error_description');

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Send new users through onboarding, returning users to the dashboard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dest = '/dashboard';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .maybeSingle();
    dest = profile?.onboarded ? '/dashboard' : '/onboarding';
  }

  return NextResponse.redirect(`${origin}${dest}`);
}
