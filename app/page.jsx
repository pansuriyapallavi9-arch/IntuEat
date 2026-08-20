'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sprout, Camera, Zap, MessageCircle, BarChart3, Scale, Droplets,
  ArrowRight, Sparkles, Flame, Check, Share, Plus, Download, Smartphone,
  ScanSearch, Globe, Database, Brain,
} from 'lucide-react';
import Ring from '@/components/Ring';

const MotionLink = motion.create(Link);

// Soft "expo-out" easing.
const EASE = [0.22, 1, 0.36, 1];

// All reveals use ONLY opacity + translate (GPU-composited, cheap on mobile) and run
// once. No blur/filter transitions and no infinite loops — those are what janked mobile.
const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: EASE },
};

// Stagger parent + child variants for grids and the hero column.
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};
const cardIn = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};
// Tactile press for buttons (tap only — no hover work on mobile).
const pop = { whileTap: { scale: 0.97 } };

const FEATURES = [
  {
    icon: Camera,
    title: 'Snap & Track',
    text: 'Photograph any meal — AI reads calories, protein, carbs & fat in seconds.',
  },
  {
    icon: Zap,
    title: 'Quick Add & Barcode',
    text: 'Re-log a favorite in one tap, or scan a barcode at the store.',
  },
  {
    icon: MessageCircle,
    title: 'AI Coach',
    text: 'Chat, tips, meal plans & recipes — tuned to your diet, goals & deficiencies.',
  },
  {
    icon: BarChart3,
    title: 'Insights & Trends',
    text: 'Weekly calorie charts, daily averages and streaks that keep you motivated.',
  },
  {
    icon: Scale,
    title: 'Smart Weight Tracking',
    text: 'Log weigh-ins and your daily targets adjust to your body automatically.',
  },
  {
    icon: Droplets,
    title: 'Hydration',
    text: 'Effortless water tracking with a daily goal that adapts to you.',
  },
];

const AI_STACK = [
  {
    icon: ScanSearch,
    title: 'Groq AI Vision',
    text: 'Snap any meal and a vision model identifies the dish and estimates calories, protein, carbs & fat in seconds.',
  },
  {
    icon: Globe,
    title: 'Live Web Search',
    text: 'For branded or regional foods, IntuEat searches the web in real time to pull accurate, up-to-date nutrition.',
  },
  {
    icon: Database,
    title: 'Verified Label Data',
    text: 'Packaged foods are cross-checked against the OpenFoodFacts database for real per-100g label values.',
  },
  {
    icon: Brain,
    title: 'Personal AI Coach',
    text: 'A language model tuned to your diet, goals & deficiencies powers your chat, tips, meal plans and recipes.',
  },
];

// PWA install state — beforeinstallprompt (Android/desktop) + iOS/standalone detection.
function useInstall() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setInstalled(!!standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return { canInstall: !!deferred, install, installed, isIOS };
}

export default function Landing() {
  const { canInstall, install, installed, isIOS } = useInstall();

  const scrollToInstall = () => {
    document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 pb-16">
      {/* ---- Nav ---- */}
      <motion.header
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
        className="sticky top-0 z-30 -mx-5 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(247,249,242,0.72)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <Sprout size={22} color="#fff" />
          </span>
          <span className="title-gradient text-2xl font-extrabold">IntuEat</span>
        </div>
        <div className="flex items-center gap-2">
          {!installed && (
            <motion.button {...pop} onClick={canInstall ? install : scrollToInstall}
              className="btn-secondary !hidden !px-4 !py-2 text-sm sm:!inline-flex">
              <Download size={15} /> Install app
            </motion.button>
          )}
          <MotionLink {...pop} href="/login" className="btn-secondary !px-5 !py-2 text-sm">Sign in</MotionLink>
        </div>
      </motion.header>

      {/* ---- Hero ---- */}
      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <motion.div variants={stagger} initial="hidden" animate="show" className="text-center md:text-left">
          <motion.div variants={rise}
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
            style={{ borderColor: 'var(--border-medium)', color: 'var(--primary)', background: 'var(--bg-surface)' }}>
            <Sparkles size={15} /> Powered by Groq AI Vision
          </motion.div>

          <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl">
            <motion.span variants={rise} className="title-gradient block">Know your food.</motion.span>
            <motion.span variants={rise} className="block">Just take a photo.</motion.span>
          </h1>

          <motion.p variants={rise}
            className="mx-auto mt-5 max-w-md text-lg md:mx-0" style={{ color: 'var(--text-muted)' }}>
            Your pocket AI nutritionist. Snap a meal for instant macros, get personalized
            coaching, track water & weight — all in one calming app.
          </motion.p>

          <motion.div variants={rise}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
            <MotionLink {...pop} href="/login" className="btn-primary w-full text-base sm:w-auto">
              Get started free <ArrowRight size={18} />
            </MotionLink>
            <motion.button {...pop} onClick={canInstall ? install : scrollToInstall}
              className="btn-secondary w-full text-base sm:w-auto">
              <Smartphone size={18} /> Use as an app
            </motion.button>
          </motion.div>

          <motion.p variants={rise} className="mt-4 text-xs font-medium md:text-left" style={{ color: 'var(--text-muted)' }}>
            Free forever · No app store · Works on any phone
          </motion.p>
        </motion.div>

        {/* App preview mockup — simple fade/slide in, static soft glow (painted once) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          className="relative flex justify-center">
          <div aria-hidden className="pointer-events-none absolute inset-4 -z-10"
            style={{ background: 'radial-gradient(circle at 50% 42%, rgba(108,154,106,0.28), transparent 70%)' }} />
          <AppPreview />
        </motion.div>
      </section>

      {/* ---- Features ---- */}
      <section className="py-8">
        <motion.div {...reveal} className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Everything you need to eat well</h2>
          <p className="mx-auto mt-3 max-w-xl" style={{ color: 'var(--text-muted)' }}>
            One mindful app for tracking, coaching and staying on top of your goals.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={cardIn} className="glass p-6">
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'var(--bg-glass)' }}>
                <f.icon size={24} color="var(--primary)" />
              </span>
              <h3 className="mb-1.5 text-lg font-bold">{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---- How the AI works ---- */}
      <section className="py-10">
        <motion.div {...reveal} className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
            style={{ borderColor: 'var(--border-medium)', color: 'var(--primary)', background: 'var(--bg-surface)' }}>
            <Sparkles size={15} /> Real AI, grounded in real data
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">How the AI works</h2>
          <p className="mx-auto mt-3 max-w-xl" style={{ color: 'var(--text-muted)' }}>
            IntuEat pairs fast AI models with live web search and a verified food database — so your
            numbers are accurate, not guessed.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {AI_STACK.map((a) => (
            <motion.div key={a.title} variants={cardIn} className="glass flex gap-4 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                <a.icon size={22} />
              </span>
              <div>
                <h3 className="mb-1 text-lg font-bold">{a.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{a.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* How a scan flows through the stack */}
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          className="glass mt-4 flex flex-col items-stretch gap-2 p-5 sm:flex-row sm:items-center">
          {[
            { icon: Camera, label: 'You snap or describe a meal' },
            { icon: ScanSearch, label: 'AI identifies foods & portions' },
            { icon: Globe, label: 'Web + database verify the data' },
            { icon: Check, label: 'Accurate macros, logged' },
          ].map((step, i, arr) => (
            <motion.div key={step.label} variants={cardIn} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'var(--bg-glass)', color: 'var(--primary)' }}>
                  <step.icon size={17} />
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={16} className="mx-auto hidden shrink-0 sm:block" style={{ color: 'var(--text-muted)' }} />
              )}
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Powered by Groq AI · OpenFoodFacts · Estimates are for guidance, not medical advice.
        </p>
      </section>

      {/* ---- Install / "use like an app" ---- */}
      <section id="install" className="scroll-mt-20 py-10">
        <motion.div {...reveal} className="glass overflow-hidden p-8 sm:p-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                <Smartphone size={13} /> INSTALL IN SECONDS
              </div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">Use IntuEat like a real app</h2>
              <p className="mt-3 max-w-md" style={{ color: 'var(--text-muted)' }}>
                No app store, no download bloat. Add IntuEat to your home screen and it launches
                full-screen with its own icon — just like a native app.
              </p>

              <ul className="mt-5 space-y-2.5">
                {['Full-screen, distraction-free experience',
                  'Its own icon on your home screen',
                  'Instant launch, no browser bar',
                  'Free — works on iPhone, Android & desktop',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm font-medium">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                      style={{ background: 'var(--primary)' }}>
                      <Check size={13} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                {installed ? (
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                    style={{ background: 'var(--bg-glass)', color: 'var(--primary)' }}>
                    <Check size={16} /> You're running the app — nice!
                  </div>
                ) : canInstall ? (
                  <motion.button {...pop} onClick={install} className="btn-primary text-base">
                    <Download size={18} /> Install IntuEat
                  </motion.button>
                ) : isIOS ? (
                  <div className="rounded-2xl p-4 text-sm" style={{ background: 'var(--bg-glass)' }}>
                    <p className="font-bold">On iPhone / iPad:</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      Tap <Share size={15} className="inline" /> <b>Share</b>, then
                      <b>Add to Home Screen</b> <Plus size={15} className="inline" />
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 text-sm" style={{ background: 'var(--bg-glass)' }}>
                    <p className="font-bold">Add to home screen:</p>
                    <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                      Open your browser menu (⋮) and choose <b>Install app</b> or
                      <b> Add to Home Screen</b>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Home-screen icon illustration */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-[26px] shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', boxShadow: 'var(--shadow-glow)' }}>
                  <Sprout size={56} color="#fff" />
                </div>
                <span className="text-sm font-bold">IntuEat</span>
                <div className="mt-1 flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--border-medium)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="py-8 text-center">
        <motion.div {...reveal}>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Start eating intuitively today</h2>
          <p className="mx-auto mt-3 max-w-md" style={{ color: 'var(--text-muted)' }}>
            Join in under a minute. Snap your first meal and watch your rings fill up.
          </p>
          <MotionLink {...pop} href="/login" className="btn-primary mt-6 inline-flex text-base">
            Get started free <ArrowRight size={18} />
          </MotionLink>
        </motion.div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="mt-6 flex flex-col items-center gap-2 border-t pt-8 text-sm sm:flex-row sm:justify-between"
        style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <Sprout size={15} color="#fff" />
          </span>
          <span className="font-bold" style={{ color: 'var(--text-main)' }}>IntuEat</span>
        </div>
        <p>© {new Date().getFullYear()} IntuEat · Mindful nutrition, powered by AI.</p>
      </footer>
    </main>
  );
}

/* Stylized in-app dashboard preview shown in the hero. Inner content staggers in
   after the card slides into place. */
function AppPreview() {
  const macros = [
    { label: 'Protein', value: 96, max: 150, color: 'var(--primary)' },
    { label: 'Carbs', value: 140, max: 220, color: 'var(--secondary)' },
    { label: 'Fat', value: 42, max: 65, color: '#e08f6a' },
  ];
  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}
      initial="hidden" animate="show"
      className="glass w-full max-w-[300px] p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
      <motion.div variants={cardIn} className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Today</p>
          <p className="text-lg font-extrabold">Hii Pallavi 👋</p>
        </div>
        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold text-white"
          style={{ background: 'linear-gradient(135deg, #f2994a, #e08f6a)' }}>
          <Flame size={13} /> 6
        </span>
      </motion.div>

      <motion.div variants={cardIn} className="glass mb-3 flex items-center gap-4 p-4">
        <Ring value={1240} max={2000} size={92} stroke={11}>
          <span className="text-lg font-extrabold">760</span>
          <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>kcal left</span>
        </Ring>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
            <Flame size={13} /> Today
          </div>
          <p className="text-lg font-extrabold">1240<span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}> / 2000</span></p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>3 meals logged</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        {macros.map((m) => (
          <motion.div key={m.label} variants={cardIn} className="glass flex flex-col items-center p-3">
            <Ring value={m.value} max={m.max} size={54} stroke={6} color={m.color}>
              <span className="text-xs font-extrabold">{m.value}</span>
            </Ring>
            <p className="mt-1.5 text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
