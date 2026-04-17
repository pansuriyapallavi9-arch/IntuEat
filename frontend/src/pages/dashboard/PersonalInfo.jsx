import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save } from 'lucide-react';
import { UserContext } from '../../context/UserContext';

export default function PersonalInfo() {
  const { user, macros, saveProfile } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Set fallback state if user context is empty initially
  const [data, setData] = useState(user || {
    name: 'Please Onboard',
    age: 0,
    height: 0,
    weight: 0,
    gender: 'female',
    goal: 'maintain',
    diet: 'veg',
    deficiencies: []
  });

  useEffect(() => {
    if (user) setData(user);
  }, [user]);

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveProfile(data);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Personal Profile</h1>
        <button className="btn-secondary" onClick={() => isEditing ? handleSave() : setIsEditing(true)} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }} disabled={saving}>
          {isEditing ? <><Save size={18}/> {saving ? 'Saving...' : 'Save Profile'}</> : <><Edit2 size={18}/> Edit Profile</>}
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ border: '1px solid var(--error)', color: 'var(--error)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        <div><label className="label">Full Name</label><input type="text" name="name" value={data.name} onChange={handleChange} disabled={!isEditing} className="input-field" /></div>
        <div><label className="label">Age</label><input type="number" name="age" value={data.age} onChange={handleChange} disabled={!isEditing} className="input-field" /></div>
        <div><label className="label">Height (cm)</label><input type="number" name="height" value={data.height} onChange={handleChange} disabled={!isEditing} className="input-field" /></div>
        <div><label className="label">Weight (kg)</label><input type="number" name="weight" value={data.weight} onChange={handleChange} disabled={!isEditing} className="input-field" /></div>
        
        <div>
          <label className="label">Gender</label>
          <select name="gender" value={data.gender} onChange={handleChange} disabled={!isEditing} className="input-field" style={{ appearance: 'none' }}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        
        <div>
          <label className="label">Goal</label>
          <select name="goal" value={data.goal} onChange={handleChange} disabled={!isEditing} className="input-field" style={{ appearance: 'none' }}>
            <option value="lose">Lose Weight</option>
            <option value="maintain">Maintain</option>
            <option value="gain_muscle">Gain Muscle</option>
            <option value="improve_immunity">Improve Immunity</option>
            <option value="keto_diet">Keto Diet</option>
          </select>
        </div>

        <div>
          <label className="label">Diet Type</label>
          <select name="diet" value={data.diet} onChange={handleChange} disabled={!isEditing} className="input-field" style={{ appearance: 'none' }}>
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-Vegetarian</option>
            <option value="eggetarian">Eggetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <div>
          <label className="label">Known Deficiencies</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            {(data.deficiencies || []).map(def => (
              <span key={def} style={{ background: 'var(--accent)', color: '#fff', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 500 }}>
                {def}
              </span>
            ))}
           </div>
        </div>
      </div>

      {/* Target Daily Recommendations */}
      {macros && !isEditing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="title-gradient" style={{ fontSize: '1.8rem', marginBottom: 'var(--space-4)' }}>WHO Recommended Daily Targets</h2>
          <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Calories</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 'var(--space-1)' }}>{macros.calories}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kcal</div>
            </div>
            <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Protein</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: 'var(--space-1)' }}>{macros.protein}g</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>20-30% of calc</div>
            </div>
            <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carbs</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e9c46a', marginTop: 'var(--space-1)' }}>{macros.carbs}g</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>energy source</div>
            </div>
            <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fats</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e76f51', marginTop: 'var(--space-1)' }}>{macros.fat}g</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>healthy lipids</div>
            </div>
            <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Water</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2a9d8f', marginTop: 'var(--space-1)' }}>{macros.waterGoals}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>glasses / day</div>
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
