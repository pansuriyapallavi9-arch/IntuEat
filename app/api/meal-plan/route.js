import { NextResponse } from 'next/server';
import { getGroq, TEXT_MODEL, chatJSON } from '@/lib/groq';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 45;

const SYSTEM = `You are IntuEat's meal-planning AI. Build a realistic ONE-DAY meal plan that hits the
user's calorie and macro targets and respects their diet and deficiencies.
Rules:
- 4 meals: breakfast, lunch, dinner, snack. Real, common dishes (respect the diet strictly).
- Each meal has 1-3 items with an estimated portion. Provide per-meal calories/protein/carbs/fat.
- The day's total should land close to the calorie target (within ~10%).
- If the user has deficiencies, work in foods that help (e.g. iron -> spinach + citrus).
- Respond with ONLY JSON, no markdown:
{"summary":string,"meals":[{"mealType":"breakfast|lunch|dinner|snack","name":string,
"items":[string],"calories":number,"protein":number,"carbs":number,"fat":number}]}`;

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('diet, goal, deficiencies, target_calories, target_protein, target_carbs, target_fat')
    .eq('id', user.id)
    .maybeSingle();

  const groq = getGroq();
  if (!groq) return NextResponse.json({ error: 'AI is not configured.' }, { status: 500 });

  const defs = (profile?.deficiencies || []).filter((d) => d !== 'None');
  const userPrompt = `Diet: ${profile?.diet || 'veg'}. Goal: ${profile?.goal || 'maintain'}.
Targets: ${profile?.target_calories || 2000} kcal, ${profile?.target_protein || 150}g protein, ${profile?.target_carbs || 220}g carbs, ${profile?.target_fat || 65}g fat.
${defs.length ? `Deficiencies to address: ${defs.join(', ')}.` : ''}
Create today's plan as JSON.`;

  try {
    const parsed = await chatJSON(groq, {
      model: TEXT_MODEL,
      temperature: 0.5,
      maxTokens: 2200,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    });

    const meals = Array.isArray(parsed?.meals) ? parsed.meals : [];
    if (!meals.length) throw new Error('empty plan');

    const clean = meals.map((m) => ({
      mealType: m.mealType || 'meal',
      name: m.name || 'Meal',
      items: Array.isArray(m.items) ? m.items : [],
      calories: Math.round(Number(m.calories) || 0),
      protein: Math.round(Number(m.protein) || 0),
      carbs: Math.round(Number(m.carbs) || 0),
      fat: Math.round(Number(m.fat) || 0),
    }));

    return NextResponse.json({ summary: parsed.summary || '', meals: clean });
  } catch (err) {
    console.error('meal-plan error:', err);
    if (err?.status === 429) {
      return NextResponse.json({ error: 'AI is busy — try again in a few seconds.' }, { status: 429 });
    }
    return NextResponse.json({ error: err?.message || 'Could not build a plan.' }, { status: 500 });
  }
}
