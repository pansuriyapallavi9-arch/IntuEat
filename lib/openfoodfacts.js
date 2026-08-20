// OpenFoodFacts nutrition lookup — free, no API key.
// Used to ground the AI with verified, real-world label data for branded/packaged foods.

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

// Words that carry no product meaning — ignored when scoring name relevance.
const STOP = new Set([
  'the', 'a', 'an', 'of', 'and', 'with', 'one', 'two', 'some', 'my',
  'small', 'medium', 'large', 'regular', 'cup', 'cups', 'bowl', 'glass',
  'plate', 'piece', 'pieces', 'slice', 'slices', 'g', 'gram', 'grams',
  'ml', 'kg', 'oz', 'rupee', 'rupees', 'rs',
]);

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Per-100g kcal, with fallbacks for products that only store kJ or a raw value.
function kcalPer100g(n) {
  const kcal = num(n['energy-kcal_100g']) ?? num(n['energy-kcal_value']);
  if (kcal) return kcal;
  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
  if (kj) return Math.round(kj / 4.184);
  return null;
}

function tokens(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

// Search OpenFoodFacts for a food term and return the best relevant match's per-100g
// nutrition, or null. Never throws — returns null on any failure. Precision-first:
// only returns a hit whose product name actually matches the query.
export async function searchFoodNutrition(query) {
  const term = String(query || '').trim();
  if (term.length < 2) return null;

  const queryTokens = tokens(term);
  if (queryTokens.length === 0) return null;

  const url =
    `${SEARCH_URL}?search_terms=${encodeURIComponent(term)}` +
    '&search_simple=1&action=process&json=1&page_size=20' +
    '&fields=product_name,brands,nutriments';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'IntuEat/1.0 (nutrition tracking app)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const products = Array.isArray(data?.products) ? data.products : [];

    let best = null;
    let bestScore = 0;

    for (const p of products) {
      const name = String(p.product_name || '').trim();
      if (!name) continue;

      const n = p?.nutriments || {};
      const calories = kcalPer100g(n);
      if (!calories || calories <= 0 || calories > 1000) continue; // implausible for real food

      // Relevance: how many query tokens appear in the product name / brand.
      const hay = `${name} ${p.brands || ''}`.toLowerCase();
      const matches = queryTokens.filter((t) => hay.includes(t)).length;
      if (matches === 0) continue; // skip products unrelated to the query

      const hasMacros =
        num(n['proteins_100g']) != null &&
        num(n['carbohydrates_100g']) != null &&
        num(n['fat_100g']) != null;

      // Favor stronger name matches, then completeness of macro data.
      const score = matches * 10 + (hasMacros ? 3 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { p, name, n, calories };
      }
    }

    if (!best) return null;
    const { p, name, n, calories } = best;

    return {
      productName: name,
      brand: String(p.brands || '').split(',')[0].trim() || null,
      per100g: {
        calories: Math.round(calories),
        protein: num(n['proteins_100g']) ?? 0,
        carbs: num(n['carbohydrates_100g']) ?? 0,
        fat: num(n['fat_100g']) ?? 0,
      },
    };
  } catch {
    return null; // timeout / network / parse — grounding is best-effort
  } finally {
    clearTimeout(timeout);
  }
}
