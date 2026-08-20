import { NextResponse } from 'next/server';
import { getGroq, VISION_MODEL, TEXT_MODEL, chatJSON } from '@/lib/groq';
import { healthScore } from '@/lib/nutrition';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Prompt for photo / single-item mode (weight is known in grams)
const VISION_SYSTEM = `You are IntuEat's expert nutritionist AI vision agent.
Your job: look at a food photo (and/or a food name) and return precise, real-world nutrition data.

Rules:
- Identify the single primary dish. Be specific (e.g. "Grilled chicken caesar salad", not "salad").
- Estimate macros for the EXACT weight the user gives, in grams. Scale linearly from per-100g values.
- calories are kcal; protein, carbs, fat are grams. Use realistic USDA-style values.
- "score" is a 0-10 healthiness rating (10 = very healthy, whole foods; low = fried/sugary/ultra-processed).
- Give exactly 2 creative, specific "pairing" suggestions that fix a likely nutritional gap in this dish.
  Keep each reason under 160 chars.
- Portion sanity-check (per typical serving): 1 roti/chapati ~70-90 kcal; 1 cup cooked rice ~200 kcal;
  1 slice medium pizza ~200 kcal; 1 egg ~78 kcal; 1 medium banana ~105 kcal; 1 cup dal ~180 kcal.
- Respond with ONLY a JSON object, no markdown, no commentary. Use this exact shape:
{"foodName":string,"calories":number,"protein":number,"carbs":number,"fat":number,"score":number,
"suggestions":[{"title":string,"reason":string}]}`;

// Prompt for free-text mode — the AI parses brands, sizes, quantities itself
const TEXT_SYSTEM = `You are IntuEat's expert nutritionist AI. The user describes what they ate in free-form,
natural language — possibly with brands, sizes, quantities, and even prices/currency
(e.g. "2 medium Domino's cheese pizzas and one 20 rupee Thumbs Up").

How to interpret it:
- Break the text into individual food/drink items. Detect quantity for each ("2", "one", "a couple").
- Use real-world brand & portion knowledge to estimate each item's nutrition, then multiply by quantity.
  Examples: a medium Domino's cheese pizza ≈ 6 slices, ~1150 kcal total; a 250 ml Thumbs Up ≈ 110 kcal;
  a regular McDonald's fries ≈ 320 kcal; 1 roti ≈ 80 kcal; 1 cup cooked rice ≈ 200 kcal; 1 idli ≈ 58 kcal;
  1 samosa ≈ 260 kcal; 1 cup dal ≈ 180 kcal; 1 scoop whey ≈ 120 kcal. Respect stated sizes
  (small/medium/large/regular); otherwise assume a typical single serving.
- Prices/currency are only a weak hint about portion size (e.g. a "₹20 Thumbs Up" is a small bottle).
  NEVER treat money as calories.
- SUM every item into TOTAL nutrition for the whole meal described.
- "foodName" is a short human summary of the order (e.g. "2 Medium Pizzas + Thumbs Up").
- "score" is a 0-10 healthiness rating for the overall meal.
- Give exactly 2 specific, encouraging suggestions to balance this meal (each reason < 160 chars).
- Respond with ONLY a JSON object, no markdown. Exact shape:
{"foodName":string,"calories":number,"protein":number,"carbs":number,"fat":number,"score":number,
"items":[{"name":string,"quantity":string,"calories":number}],
"suggestions":[{"title":string,"reason":string}]}`;

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { image, foodName, weight, description } = body || {};
  const isTextMode = !image && !!(description && description.trim());

  if (!image && !foodName && !isTextMode) {
    return NextResponse.json(
      { error: 'Provide a photo, a food name, or a description.' },
      { status: 400 }
    );
  }

  const groq = getGroq();
  if (!groq) {
    return NextResponse.json(
      { error: 'AI is not configured. Add GROQ_API_KEY to your environment.' },
      { status: 500 }
    );
  }

  // Build the request depending on mode
  let model;
  let messages;

  if (isTextMode) {
    model = TEXT_MODEL;
    messages = [
      { role: 'system', content: TEXT_SYSTEM },
      { role: 'user', content: `The user ate: "${description.trim()}". Analyze the whole meal.` },
    ];
  } else {
    const weightVal = Math.max(1, parseFloat(weight) || 100);
    const userContent = [
      {
        type: 'text',
        text: `Analyze this meal.${
          foodName ? ` The user says it is: "${foodName}".` : ''
        } Calculate nutrition for exactly ${weightVal} grams.`,
      },
    ];
    if (image) userContent.push({ type: 'image_url', image_url: { url: image } });

    model = VISION_MODEL;
    messages = [
      { role: 'system', content: VISION_SYSTEM },
      { role: 'user', content: userContent },
    ];
  }

  try {
    const parsed = await chatJSON(groq, {
      model,
      temperature: 0.3,
      maxTokens: 3072,
      messages,
    });

    const detected = parsed.foodName || foodName || description || 'Food';
    const name = isTextMode
      ? detected
      : `${Math.max(1, parseFloat(weight) || 100)}g of ${detected.charAt(0).toUpperCase()}${detected.slice(1)}`;

    const result = {
      name,
      foodName: detected,
      calories: Math.round(Number(parsed.calories) || 0),
      protein: Number((Number(parsed.protein) || 0).toFixed(1)),
      carbs: Number((Number(parsed.carbs) || 0).toFixed(1)),
      fat: Number((Number(parsed.fat) || 0).toFixed(1)),
      score:
        parsed.score != null ? Number(Number(parsed.score).toFixed(1)) : healthScore(parsed),
      items: Array.isArray(parsed.items) ? parsed.items.slice(0, 12) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('analyze-meal error:', err);
    if (err?.status === 429) {
      return NextResponse.json(
        { error: 'The AI is busy right now (rate limit). Please try again in a few seconds.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err?.message || 'AI analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
