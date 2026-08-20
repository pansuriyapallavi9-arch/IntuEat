'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, PenLine, Zap } from 'lucide-react';
import PhotoScanner from './PhotoScanner';
import DescribeScanner from './DescribeScanner';
import QuickAdd from './QuickAdd';

const MODES = [
  { id: 'quick', label: 'Quick', icon: Zap },
  { id: 'photo', label: 'Photo', icon: Camera },
  { id: 'describe', label: 'Text', icon: PenLine },
];

export default function ScanPage() {
  const [mode, setMode] = useState('quick');

  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold">Add food</h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
        Re-log a favorite in a tap, or add something new with a photo or a quick description.
      </p>

      {/* Mode toggle */}
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-full p-1" style={{ background: 'var(--bg-glass)' }}>
        {MODES.map((t) => (
          <button key={t.id} onClick={() => setMode(t.id)}
            className="relative flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors"
            style={{ color: mode === t.id ? '#fff' : 'var(--text-muted)' }}>
            {mode === t.id && (
              <motion.span layoutId="modePill" className="absolute inset-0 rounded-full"
                style={{ background: 'var(--primary)' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
            )}
            <t.icon size={16} className="relative z-10" />
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
          {mode === 'quick' && <QuickAdd />}
          {mode === 'photo' && <PhotoScanner />}
          {mode === 'describe' && <DescribeScanner />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
