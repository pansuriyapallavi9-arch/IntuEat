# 🌱 IntuEat — AI Nutrition Coach

A mobile-first, Cal-AI-style nutrition web app. Snap a photo of any meal and get
instant calories & macros, re-log favorites in a tap, track water, and receive
personalized AI coaching. Built as a full-stack **Next.js** app with **Supabase**
(auth + database) and **Groq** (LLM vision + text).

## ✨ Features

- **AI Photo Scanner** — take/upload a meal photo, enter the weight, and a vision LLM
  returns the dish name, calories, protein/carbs/fat, a health score, and pairing tips.
- **Describe mode** — type what you ate in plain language ("2 medium Domino's pizzas + a
  Thumbs Up") and AI parses brands, sizes & quantities into an itemized analysis.
- **Quick Add** — one-tap re-log of your favorites and recent meals.
- **Smart Dashboard** — calorie & macro rings, a logging **streak**, a 7-day calorie trend,
  water, and today's meals.
- **Insights** — weekly calorie/protein trends and **weight tracking** (targets auto-update
  as your weight changes).
- **AI Coach hub** with four tabs:
  - **Tips** — 3 tailored, diet-aware suggestions
  - **Chat** — a conversational coach that sees your targets & today's log
  - **Plan** — a one-day meal plan hitting your macro targets (log any meal in a tap)
  - **Recipe** — invent a recipe from typed ingredients or a fridge photo
- **Meal History** — grouped by day, with inline **edit**, delete, and save-to-favorites.
- **Water Tracker** and **Profile** with editable metrics and auto-recalculated daily
  targets (Mifflin-St Jeor + WHO split).
- **Auth & storage** via Supabase, with Row-Level Security so users only see their own data.
- Fully responsive: desktop sidebar + mobile bottom nav with a center "Add" FAB.

## 🧱 Tech stack

| Layer     | Choice                                            |
|-----------|---------------------------------------------------|
| Framework | Next.js 15 (App Router) + React 19                |
| Styling   | Tailwind CSS v4 + a calm earthy design system     |
| Auth + DB | Supabase (Postgres, RLS, `@supabase/ssr`)         |
| AI/LLM    | Groq (OpenAI-compatible chat completions)         |
| Motion    | Framer Motion · Icons: lucide-react               |

## 🚀 Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Environment variables live in `.env.local` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...
GROQ_VISION_MODEL=qwen/qwen3.6-27b
GROQ_TEXT_MODEL=qwen/qwen3.6-27b
```

### About the LLM model

The app calls Groq's chat-completions API. **The provided Groq key does not have access
to Meta Llama models** (Groq returns `model_not_found`), so the defaults use
`qwen/qwen3.6-27b`, the vision-capable model available on that account.

To use Meta Llama instead, enable it on your Groq account and set:

```
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
```

No code changes needed — the models are read from env.

## 🗄️ Database

Five tables (migrations `init_intueat_schema` + `add_weight_and_favorites`), all RLS-protected:

- `profiles` — one row per user; onboarding data + computed daily targets. A trigger
  auto-creates the row on sign-up.
- `meals` — logged meals with macros, score, and `source` (ai / text / quick / plan).
- `water_logs` — one row per user per day.
- `weight_logs` — one weigh-in per user per day (powers the weight trend chart).
- `favorite_foods` — saved meals for one-tap Quick Add.

## 📁 Project structure

```
app/
  page.jsx                 Landing (marketing)
  login/                   Auth (sign in / sign up)
  onboarding/              5-step profile setup -> Supabase
  (app)/                   Authenticated shell (sidebar + bottom nav)
    dashboard/  scan/  history/  water/  suggestions/  profile/
  api/
    analyze-meal/          Groq vision -> macros JSON
    suggestions/           Groq text -> coaching tips JSON
lib/
  supabase/                browser + server + middleware clients
  groq.js  nutrition.js  image.js
components/                AppShell, Ring
middleware.js              session refresh + route protection
```

## 📝 Notes

- If **"Confirm email"** is enabled in Supabase Auth, new sign-ups must click the emailed
  link before signing in (the login screen guides users through this). Disable it in the
  Supabase dashboard for frictionless local testing.
- Meal photos are downscaled client-side before upload to keep AI calls fast.
