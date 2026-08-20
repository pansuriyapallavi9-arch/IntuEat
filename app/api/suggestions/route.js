import { NextResponse } from 'next/server';
import { getGroq, TEXT_MODEL, chatJSON } from '@/lib/groq';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are IntuEat's encouraging, evidence-based AI nutrition coach.
Given a user's known nutrient deficiencies, dietary preference and recent meals, produce
personalized, actionable guidance. Be warm but specific and practical.
Respond with ONLY a JSON object, no markdown, of the form:
{"suggestions":[{"title":string,"reason":string}]}
Return exactly 3 suggestions. Each "title" is a short punchy action (<=6 words). Each
"reason" is one specific, motivating tip under 200 chars that respects the user's diet
and targets their deficiencies.`;

// Curated fallback so the Coach page always shows useful guidance even if the
// AI is rate-limited or unavailable.
const DEF_TIPS = {
  Iron: { title: 'Pair iron with vitamin C', reason: 'Add lemon or tomato to iron-rich foods like spinach and lentils — vitamin C boosts iron absorption significantly.' },
  Zinc: { title: 'Snack on seeds', reason: 'Pumpkin and hemp seeds are zinc-dense and easy to sprinkle on meals for immunity and skin health.' },
  'Omega 3': { title: 'Add omega-3 sources', reason: 'Walnuts, flax and chia (or fatty fish) supply omega-3s that support heart and brain health.' },
  'Vitamin B12': { title: 'Top up B12', reason: 'Use fortified plant milk or nutritional yeast (or eggs/dairy) to keep B12 steady, especially on plant-based diets.' },
  'Vitamin D': { title: 'Catch morning sun', reason: '15 minutes of sunlight plus fortified foods or mushrooms helps rebuild vitamin D naturally.' },
  Calcium: { title: 'Build in calcium', reason: 'Dairy, fortified plant milk, tofu and leafy greens keep bones strong — aim for a source daily.' },
};
const GENERIC_TIPS = [
  { title: 'Front-load protein', reason: 'Include a protein source at every meal to stay full and support muscle instead of loading it all at dinner.' },
  { title: 'Eat the rainbow', reason: 'Different colored fruits and veg cover different micronutrients — variety beats any single superfood.' },
  { title: 'Hydrate before meals', reason: 'A glass of water before eating aids digestion and helps you tell real hunger from thirst.' },
];

function fallbackTips(deficiencies) {
  const defs = (deficiencies || []).filter((d) => d && d !== 'None');
  const tips = [];
  for (const d of defs) if (DEF_TIPS[d]) tips.push(DEF_TIPS[d]);
  let i = 0;
  while (tips.length < 3) tips.push(GENERIC_TIPS[i++ % GENERIC_TIPS.length]);
  return tips.slice(0, 3);
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }
  const { deficiencies = [], diet = 'veg', history = [] } = body || {};

  const groq = getGroq();

  const defList =
    Array.isArray(deficiencies) && deficiencies.filter((d) => d !== 'None').length
      ? deficiencies.filter((d) => d !== 'None').join(', ')
      : 'no specific deficiencies (general wellness)';
  const recent =
    (history || []).slice(0, 6).map((m) => `${m.name} (${Math.round(m.calories || 0)} kcal)`).join('; ') ||
    'no meals logged yet';

  const userPrompt = `Deficiencies: ${defList}.
Diet preference: ${diet}.
Recent meals: ${recent}.
Give 3 tailored suggestions as JSON {"suggestions":[{"title":string,"reason":string}]}.`;

  try {
    if (!groq) throw new Error('AI not configured');

    const parsed = await chatJSON(groq, {
      model: TEXT_MODEL,
      temperature: 0.6,
      maxTokens: 2560,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const list = Array.isArray(parsed) ? parsed : parsed?.suggestions;
    if (!Array.isArray(list) || !list.length) throw new Error('empty');

    return NextResponse.json({ suggestions: list.slice(0, 3) });
  } catch (err) {
    // Graceful degradation — never break the Coach page.
    console.error('suggestions error (using fallback):', err?.message || err);
    return NextResponse.json({ suggestions: fallbackTips(deficiencies), fallback: true });
  }
}
