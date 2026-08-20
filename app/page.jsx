'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sprout, Camera, Sparkles, Droplets, LineChart, ArrowRight } from 'lucide-react';

const features = [
  { icon: Camera, title: 'Snap & Track', text: 'Photograph any meal — AI reads calories & macros in seconds.' },
  { icon: Sparkles, title: 'Smart Coaching', text: 'Llama-powered tips tuned to your goals and deficiencies.' },
  { icon: Droplets, title: 'Stay Hydrated', text: 'Effortless water tracking with a daily goal that adapts to you.' },
  { icon: LineChart, title: 'See Progress', text: 'Beautiful rings and history that keep you motivated every day.' },
];

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 pb-16">
      {/* Nav */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <Sprout size={22} color="#fff" />
          </span>
          <span className="title-gradient text-2xl font-extrabold">IntuEat</span>
        </div>
        <Link href="/login" className="btn-secondary !px-5 !py-2 text-sm">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
          style={{ borderColor: 'var(--border-medium)', color: 'var(--primary)', background: 'var(--bg-surface)' }}
        >
          <Sparkles size={15} /> Powered by Groq AI Vision
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-6xl md:text-7xl"
        >
          <span className="title-gradient">Know your food.</span>
          <br />
          Just take a photo.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-5 max-w-xl text-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          IntuEat is your pocket AI nutritionist. Snap a meal, get instant macros,
          personalized coaching, and mindful habits — all in one calming app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
        >
          <Link href="/login" className="btn-primary w-full text-base sm:w-auto">
            Get started free <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn-secondary w-full text-base sm:w-auto">
            I already have an account
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass p-5"
          >
            <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: 'var(--bg-glass)' }}>
              <f.icon size={22} color="var(--primary)" />
            </span>
            <h3 className="mb-1 text-lg font-bold">{f.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.text}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
