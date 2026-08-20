// Nutrition math shared across the app.

export const GOALS = [
  { id: 'lose', label: 'Lose Weight', emoji: '🔥' },
  { id: 'maintain', label: 'Maintain', emoji: '⚖️' },
  { id: 'gain_muscle', label: 'Gain Muscle', emoji: '💪' },
  { id: 'improve_immunity', label: 'Boost Immunity', emoji: '🛡️' },
  { id: 'keto_diet', label: 'Keto Diet', emoji: '🥑' },
];

export const DIETS = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'nonveg', label: 'Non-Vegetarian' },
  { id: 'eggetarian', label: 'Eggetarian' },
  { id: 'vegan', label: 'Vegan' },
];

export const DEFICIENCIES = [
  'Iron', 'Zinc', 'Omega 3', 'Vitamin B12', 'Vitamin D', 'Calcium', 'None',
];

// Mifflin-St Jeor BMR + WHO macro split. Returns daily targets.
export function calculateMacros({ age, height, weight, gender, goal }) {
  const a = Number(age) || 25;
  const h = Number(height) || 170;
  const w = Number(weight) || 70;

  let bmr = 10 * w + 6.25 * h - 5 * a;
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  // Light activity multiplier
  let calories = bmr * 1.375;
  if (goal === 'lose') calories -= 500;
  else if (goal === 'gain_muscle') calories += 500;

  // Default WHO-ish split
  let proteinPct = 0.2;
  let fatPct = 0.3;
  let carbsPct = 0.5;

  if (goal === 'gain_muscle') {
    proteinPct = 0.3; fatPct = 0.25; carbsPct = 0.45;
  } else if (goal === 'lose') {
    proteinPct = 0.35; fatPct = 0.3; carbsPct = 0.35;
  } else if (goal === 'improve_immunity') {
    proteinPct = 0.25; fatPct = 0.35; carbsPct = 0.4;
  } else if (goal === 'keto_diet') {
    proteinPct = 0.2; fatPct = 0.7; carbsPct = 0.1;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbsPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
    water: Math.max(6, Math.round(w * 0.033 * 4)), // ~250ml glasses
  };
}

// Health score 0-10 from macros (used as a fallback if the AI omits it).
export function healthScore({ protein = 0, fat = 0 }) {
  let score = 10;
  if (fat > 20) score -= (fat - 20) * 0.1;
  if (protein > 15) score += 1;
  return Number(Math.max(0, Math.min(10, score)).toFixed(1));
}
