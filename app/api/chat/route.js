import { NextResponse } from 'next/server';
import { getGroq, TEXT_MODEL, chatText } from '@/lib/groq';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    /* ignore */
  }
  const history = Array.isArray(body?.messages) ? body.messages.slice(-10) : [];
  if (!history.length) {
    return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
  }

  const groq = getGroq();
  if (!groq) {
    return NextResponse.json({ error: 'AI is not configured.' }, { status: 500 });
  }

  // Pull the user's context so the coach gives grounded, personal answers
  const [{ data: profile }, { data: meals }] = await Promise.all([
    supabase.from('profiles').select('name, diet, goal, deficiencies, target_calories, target_protein, target_carbs, target_fat').eq('id', user.id).maybeSingle(),
    supabase.from('meals').select('name, calories, protein, meal_type').eq('user_id', user.id).gte('logged_at', startOfTodayISO()).order('logged_at', { ascending: false }),
  ]);

  const consumed = (meals || []).reduce(
    (a, m) => ({ cal: a.cal + Number(m.calories || 0), pro: a.pro + Number(m.protein || 0) }),
    { cal: 0, pro: 0 }
  );
  const defs = (profile?.deficiencies || []).filter((d) => d !== 'None');

  const system = `You are IntuEat's warm, practical AI nutrition coach chatting with ${profile?.name || 'the user'}.
Their profile: goal=${profile?.goal || 'maintain'}, diet=${profile?.diet || 'veg'}${defs.length ? `, watching deficiencies: ${defs.join(', ')}` : ''}.
Daily targets: ${profile?.target_calories || 2000} kcal, ${profile?.target_protein || 150}g protein, ${profile?.target_carbs || 220}g carbs, ${profile?.target_fat || 65}g fat.
Today so far: ${Math.round(consumed.cal)} kcal and ${Math.round(consumed.pro)}g protein across ${meals?.length || 0} meal(s): ${(meals || []).map((m) => m.name).slice(0, 6).join(', ') || 'nothing logged yet'}.
Answer in a friendly, concise way (a few sentences or short bullets with "- "). Use PLAIN TEXT only — no markdown symbols like **, ##, or backticks. Respect their diet. Give concrete foods and portions. If asked something medical, add a gentle "check with a professional" note. Never invent that they ate something they didn't.`;

  try {
    const reply = await chatText(groq, {
      model: TEXT_MODEL,
      temperature: 0.6,
      maxTokens: 900,
      messages: [{ role: 'system', content: system }, ...history],
    });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('chat error:', err);
    if (err?.status === 429) {
      return NextResponse.json({ error: 'The coach is busy right now — try again in a few seconds.' }, { status: 429 });
    }
    return NextResponse.json({ error: err?.message || 'Chat failed.' }, { status: 500 });
  }
}
