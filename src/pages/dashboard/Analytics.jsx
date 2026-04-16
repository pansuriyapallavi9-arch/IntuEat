import React, { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { UserContext } from '../../context/UserContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Analytics() {
  const { macros, user, history } = useContext(UserContext);

  // Hook lines array based on progress or just generic hype!
  const hookLines = [
    "Looking incredible today! Let's crush those macros. 🚀",
    "Fuel your body, elevate your mind.",
    "Neon energy unlocked. You are exactly where you need to be.",
    "Every bite is a choice. Make this one count. ⚡️",
    "Stay hydrated, stay dangerous."
  ];
  
  const randomHook = useMemo(() => hookLines[Math.floor(Math.random() * hookLines.length)], []);

  // Calculate totals from history (for today only, but for now we sum all)
  const totals = (history || []).reduce((acc, meal) => {
    return {
      cals: acc.cals + (meal.cals || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0)
    };
  }, { cals: 0, protein: 0, carbs: 0, fat: 0 });

  const targetCals = macros ? macros.calories : 2000;
  const targetProtein = macros ? macros.protein : 150;
  const targetCarbs = macros ? macros.carbs : 200;
  const targetFat = macros ? macros.fat : 65;

  const createDoughnutData = (label, consumed, target, color) => ({
    labels: ['Consumed', 'Remaining'],
    datasets: [{
      data: [Math.min(consumed, target), Math.max(target - consumed, 0)],
      backgroundColor: [color, 'rgba(108, 154, 106, 0.1)'], // Better visibility in light mode
      borderWidth: 0,
      hoverOffset: 4
    }]
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
    hover: { scale: 1.05, y: -10, transition: { type: 'spring', stiffness: 300 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Dynamic Hook Header */}
      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(108, 154, 106, 0.2)', boxShadow: '0 10px 40px rgba(108, 154, 106, 0.08)' }}>
        <motion.h1 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5, type: 'spring' }}
          className="title-gradient" 
          style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}
        >
          Welcome Back, {user?.name || 'Legend'}.
        </motion.h1>
        <p style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '1px' }}>
          {randomHook}
        </p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-5)' }}>
        <motion.div variants={cardVariants} whileHover="hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(176, 212, 179, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(108, 154, 106, 0.3)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(108, 154, 106, 0.1)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-main)' }}>Calories (kcal)</h3>
          <div style={{ width: '150px' }}>
            <Doughnut data={createDoughnutData('Calories', totals.cals, targetCals, 'var(--primary)')} options={{ plugins: { legend: { display: false } }, cutout: '80%' }} />
          </div>
          <p style={{ marginTop: 'var(--space-2)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)' }}>{Math.round(totals.cals)} / {targetCals}</p>
        </motion.div>

        <motion.div variants={cardVariants} whileHover="hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(235, 195, 149, 0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(220, 174, 120, 0.4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(220, 174, 120, 0.15)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-main)' }}>Protein (g)</h3>
          <div style={{ width: '150px' }}>
            <Doughnut data={createDoughnutData('Protein', totals.protein, targetProtein, 'var(--secondary)')} options={{ plugins: { legend: { display: false } }, cutout: '80%' }} />
          </div>
          <p style={{ marginTop: 'var(--space-2)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)' }}>{Math.round(totals.protein)} / {targetProtein}</p>
        </motion.div>

        <motion.div variants={cardVariants} whileHover="hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(152, 204, 211, 0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(125, 174, 163, 0.4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(125, 174, 163, 0.15)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-main)' }}>Carbs (g)</h3>
          <div style={{ width: '150px' }}>
            <Doughnut data={createDoughnutData('Carbs', totals.carbs, targetCarbs, 'var(--info)')} options={{ plugins: { legend: { display: false } }, cutout: '80%' }} />
          </div>
          <p style={{ marginTop: 'var(--space-2)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)' }}>{Math.round(totals.carbs)} / {targetCarbs}</p>
        </motion.div>

        <motion.div variants={cardVariants} whileHover="hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(242, 206, 141, 0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(242, 206, 141, 0.5)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 30px rgba(242, 206, 141, 0.15)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-main)' }}>Fat (g)</h3>
          <div style={{ width: '150px' }}>
            <Doughnut data={createDoughnutData('Fat', totals.fat, targetFat, 'var(--accent)')} options={{ plugins: { legend: { display: false } }, cutout: '80%' }} />
          </div>
          <p style={{ marginTop: 'var(--space-2)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)' }}>{Math.round(totals.fat)} / {targetFat}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
