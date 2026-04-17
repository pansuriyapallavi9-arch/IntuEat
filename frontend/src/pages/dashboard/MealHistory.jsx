import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContext } from '../../context/UserContext';

export default function MealHistory() {
  const { history } = useContext(UserContext);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-5)' }}>Meal History</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <AnimatePresence>
          {(!history || history.length === 0) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No meals tracked yet. Start scanning!
            </motion.div>
          )}

          {history && history.map(meal => (
            <motion.div key={meal.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>{meal.date || 'Today'} • <span style={{ textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600 }}>{meal.type}</span></div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: 'var(--space-1)' }}>{meal.name}</h3>
                {(meal.source === 'barcode' || meal.barcode || meal.brand) && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                    {[meal.brand, meal.barcode ? `Barcode ${meal.barcode}` : null].filter(Boolean).join(' • ')}
                  </div>
                )}
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-3)' }}>
                   <span>{meal.cals} kcal</span>
                   <span>P: {meal.protein}g</span>
                   <span>C: {meal.carbs}g</span>
                   <span>F: {meal.fat}g</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Score</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{meal.score}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
