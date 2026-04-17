import React, { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { UserContext } from '../../context/UserContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Analytics() {
  const { macros, user, history } = useContext(UserContext);
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Hook lines array based on progress or just generic hype!
  const hookLines = [
    "Looking incredible today! Let's crush those macros. 🚀",
    "Fuel your body, elevate your mind.",
    "Neon energy unlocked. You are exactly where you need to be.",
    "Every bite is a choice. Make this one count. ⚡️",
    "Stay hydrated, stay dangerous."
  ];
  
  const randomHook = useMemo(() => hookLines[Math.floor(Math.random() * hookLines.length)], []);

  const parseMealDate = (value) => {
    if (!value) return null;

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const normalized = String(value).replace(',', '');
    const retry = new Date(normalized);
    return Number.isNaN(retry.getTime()) ? null : retry;
  };

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

  const consistencyData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysToShow = 365;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (daysToShow - 1));

    const mealCountsByDay = new Map();
    (history || []).forEach((meal) => {
      const mealDate = parseMealDate(meal.date);
      if (!mealDate) return;

      mealDate.setHours(0, 0, 0, 0);
      const key = mealDate.toISOString().slice(0, 10);
      mealCountsByDay.set(key, (mealCountsByDay.get(key) || 0) + 1);
    });

    const days = Array.from({ length: daysToShow }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const count = mealCountsByDay.get(key) || 0;

      return {
        key,
        date,
        count,
        level: count >= 4 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
    });

    const weeks = [];
    for (let index = 0; index < days.length; index += 7) {
      weeks.push(days.slice(index, index + 7));
    }

    const monthLabels = weeks.map((week, index) => {
      const firstDay = week[0];
      if (!firstDay) return '';
      if (index === 0 || firstDay.date.getMonth() !== weeks[index - 1]?.[0]?.date.getMonth()) {
        return firstDay.date.toLocaleDateString(undefined, { month: 'short' });
      }
      return '';
    });

    let currentStreak = 0;
    for (let index = days.length - 1; index >= 0; index -= 1) {
      if (days[index].count > 0) currentStreak += 1;
      else break;
    }

    const bestStreak = days.reduce(
      (streaks, day) => {
        if (day.count > 0) {
          const nextCurrent = streaks.current + 1;
          return { current: nextCurrent, best: Math.max(streaks.best, nextCurrent) };
        }
        return { current: 0, best: streaks.best };
      },
      { current: 0, best: 0 }
    ).best;

    const activeDays = days.filter((day) => day.count > 0).length;

    return {
      weeks,
      monthLabels,
      activeDays,
      currentStreak,
      bestStreak,
      totalMeals: (history || []).length,
    };
  }, [history]);

  const consistencyColors = [
    'rgba(108, 154, 106, 0.08)',
    'rgba(108, 154, 106, 0.28)',
    'rgba(108, 154, 106, 0.46)',
    'rgba(108, 154, 106, 0.68)',
    'rgba(108, 154, 106, 0.9)',
  ];

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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel"
        style={{
          marginTop: 'var(--space-6)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248, 251, 245, 0.98))',
          border: '1px solid rgba(108, 154, 106, 0.16)',
          boxShadow: '0 18px 42px rgba(43, 58, 47, 0.08)',
          padding: 'var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--text-main)', marginBottom: 'var(--space-1)' }}>Consistency Graph</h2>
            <p style={{ color: 'var(--text-muted)' }}>Your last 12 months of tracking in a compact contribution view.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '100px', padding: '0.85rem 1rem', background: 'rgba(108, 154, 106, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(108, 154, 106, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{consistencyData.currentStreak}</div>
            </div>
            <div style={{ minWidth: '100px', padding: '0.85rem 1rem', background: 'rgba(108, 154, 106, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(108, 154, 106, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Best</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{consistencyData.bestStreak}</div>
            </div>
            <div style={{ minWidth: '100px', padding: '0.85rem 1rem', background: 'rgba(108, 154, 106, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(108, 154, 106, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{consistencyData.activeDays}</div>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', paddingBottom: 'var(--space-2)' }}>
          <div style={{ width: '100%' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${consistencyData.weeks.length}, minmax(0, 1fr))`,
                gap: '4px',
                alignItems: 'flex-start',
                width: '100%',
              }}
            >
              {consistencyData.weeks.map((week, columnIndex) => (
                <div key={`week-${week[0]?.key || columnIndex}`} style={{ display: 'grid', gridTemplateRows: 'repeat(7, minmax(0, 1fr))', gap: '4px', minWidth: 0 }}>
                  {weekdayLabels.map((_, rowIndex) => {
                    const day = week[rowIndex];
                    if (!day) {
                      return <div key={`empty-${columnIndex}-${rowIndex}`} style={{ width: '100%', aspectRatio: '1 / 1' }} />;
                    }

                    return (
                      <motion.div
                        key={day.key}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.003 * (rowIndex + columnIndex) }}
                        title={`${day.label}: ${day.count} tracked meal${day.count === 1 ? '' : 's'}`}
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: '3px',
                          background: day.count > 0 ? consistencyColors[day.level] : 'rgba(108, 154, 106, 0.09)',
                          border: day.count > 0 ? '1px solid rgba(108, 154, 106, 0.1)' : '1px solid rgba(108, 154, 106, 0.05)',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${consistencyData.weeks.length}, minmax(0, 1fr))`,
                gap: '4px',
                marginTop: '10px',
                width: '100%',
              }}
            >
              {consistencyData.monthLabels.map((label, index) => (
                <div
                  key={`month-${label || index}`}
                  style={{
                    width: '100%',
                    minWidth: 0,
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {consistencyData.totalMeals} meals logged across the last {consistencyData.weeks.length} weeks.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <span>Less</span>
            {consistencyColors.map((color) => (
              <span
                key={color}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: color,
                  border: '1px solid rgba(108, 154, 106, 0.08)',
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
