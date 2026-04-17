import React, { useContext, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { UserContext } from '../../context/UserContext';

export default function WaterIntake() {
  const { waterIntake, macros, updateWaterIntake } = useContext(UserContext);
  const [saving, setSaving] = useState(false);
  const goal = waterIntake?.goal || macros?.waterGoals || 8;
  const glasses = waterIntake?.glasses || 0;
  const remaining = Math.max(goal - glasses, 0);
  const percentage = useMemo(() => Math.min((glasses / goal) * 100, 100), [glasses, goal]);

  const persistGlasses = async (nextGlasses) => {
    setSaving(true);
    try {
      await updateWaterIntake({ glasses: nextGlasses, goal });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (glasses < goal && !saving) persistGlasses(glasses + 1);
  };
  const handleRemove = () => {
    if (glasses > 0 && !saving) persistGlasses(glasses - 1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-5)' }}>Water Tracker</h1>
      
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)' }}>
        
        {/* Visual representation of water container */}
        <div style={{
          position: 'relative',
          width: '200px',
          height: '300px',
          border: '4px solid var(--border-medium)',
          borderRadius: '20px 20px 40px 40px',
          overflow: 'hidden',
          marginBottom: 'var(--space-5)',
          background: 'rgba(255, 255, 255, 0.3)'
        }}>
          {/* Water level */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${percentage}%` }}
            transition={{ type: 'spring', damping: 15 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(180deg, #A2C2E1 0%, #76A9D0 100%)',
              borderTop: '2px solid rgba(255,255,255,0.5)'
            }}
          />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '800', fontSize: '2rem', color: percentage > 50 ? '#fff' : 'var(--text-main)', zIndex: 10, transition: 'var(--transition-normal)' }}>
            {percentage.toFixed(0)}%
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <button className="btn-secondary" style={{ borderRadius: '50%', padding: 'var(--space-3)', border: 'none', background: 'var(--bg-glass)' }} onClick={handleRemove} disabled={saving || glasses <= 0}>
            <Minus size={24} />
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{glasses} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {goal} Glasses</span></div>
          </div>

          <button className="btn-secondary" style={{ borderRadius: '50%', padding: 'var(--space-3)', border: 'none', background: 'var(--primary)', color: '#fff' }} onClick={handleAdd} disabled={saving || glasses >= goal}>
            <Plus size={24} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
          {glasses === goal ? "Awesome! You've hit your daily goal! 🎉" : `${remaining} more glasses to reach your goal.`}
        </p>

      </div>
    </motion.div>
  );
}
