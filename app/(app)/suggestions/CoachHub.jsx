'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, MessageCircle, CalendarDays, ChefHat } from 'lucide-react';
import CoachClient from './CoachClient';
import ChatCoach from './ChatCoach';
import MealPlan from './MealPlan';
import RecipeMaker from './RecipeMaker';

const TABS = [
  { id: 'tips', label: 'Tips', icon: Lightbulb },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'plan', label: 'Plan', icon: CalendarDays },
  { id: 'recipe', label: 'Recipe', icon: ChefHat },
];

export default function CoachHub({ name, diet, deficiencies, history }) {
  const [tab, setTab] = useState('tips');

  return (
    <div>
      <div className="no-scrollbar mb-5 grid grid-cols-4 gap-1 rounded-full p-1" style={{ background: 'var(--bg-glass)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="relative flex items-center justify-center gap-1 rounded-full py-2.5 text-xs font-bold transition-colors sm:text-sm"
            style={{ color: tab === t.id ? '#fff' : 'var(--text-muted)' }}>
            {tab === t.id && (
              <motion.span layoutId="coachTab" className="absolute inset-0 rounded-full"
                style={{ background: 'var(--primary)' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
            )}
            <t.icon size={15} className="relative z-10" />
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
          {tab === 'tips' && <CoachClient diet={diet} deficiencies={deficiencies} history={history} />}
          {tab === 'chat' && <ChatCoach name={name} />}
          {tab === 'plan' && <MealPlan />}
          {tab === 'recipe' && <RecipeMaker diet={diet} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
