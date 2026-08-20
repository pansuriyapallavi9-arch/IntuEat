import { NextResponse } from 'next/server';
import { getGroq, VISION_MODEL, TEXT_MODEL, chatJSON } from '@/lib/groq';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 45;

const SYSTEM = `You are IntuEat's creative recipe AI. From a list of ingredients the user has (typed,
and/or shown in a fridge/pantry photo), invent ONE realistic, healthy recipe they can actually cook.
Rules:
- Use mainly the ingredients provided; you may assume basic staples (oil, salt, spices, water).
- Respect the stated diet if given.
- Give clear step-by-step instructions and per-serving nutrition.
- Respond with ONLY JSON, no markdown:
{"title":string,"servings":number,"time":string,"ingredients":[string],"steps":[string],
"perServing":{"calories":number,"protein":number,"carbs":number,"fat":number}}`;

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
  const { ingredients, image, diet } = body || {};
  const hasText = ingredients && ingredients.trim();
  if (!hasText && !image) {
    return NextResponse.json({ error: 'List some ingredients or add a photo.' }, { status: 400 });
  }

  const groq = getGroq();
  if (!groq) return NextResponse.json({ error: 'AI is not configured.' }, { status: 500 });

  const model = image ? VISION_MODEL : TEXT_MODEL;
  const textPart = `Ingredients: ${hasText ? ingredients.trim() : '(see photo)'}.${diet ? ` Diet: ${diet}.` : ''} Create one recipe as JSON.`;
  const userContent = image
    ? [{ type: 'text', text: textPart }, { type: 'image_url', image_url: { url: image } }]
    : textPart;

  try {
    const parsed = await chatJSON(groq, {
      model,
      temperature: 0.6,
      maxTokens: 2200,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userContent },
      ],
    });

    if (!parsed?.title) throw new Error('empty recipe');
    const recipe = {
      title: parsed.title,
      servings: Number(parsed.servings) || 1,
      time: parsed.time || '',
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      perServing: {
        calories: Math.round(Number(parsed.perServing?.calories) || 0),
        protein: Math.round(Number(parsed.perServing?.protein) || 0),
        carbs: Math.round(Number(parsed.perServing?.carbs) || 0),
        fat: Math.round(Number(parsed.perServing?.fat) || 0),
      },
    };
    return NextResponse.json(recipe);
  } catch (err) {
    console.error('recipe error:', err);
    if (err?.status === 429) {
      return NextResponse.json({ error: 'AI is busy — try again in a few seconds.' }, { status: 429 });
    }
    return NextResponse.json({ error: err?.message || 'Could not create a recipe.' }, { status: 500 });
  }
}
