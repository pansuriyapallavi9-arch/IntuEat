import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContext } from '../context/UserContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile } = useContext(UserContext);
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    gender: 'female',
    goal: 'maintain',
    diet: 'veg',
    deficiencies: []
  });

  const diets = ['veg', 'nonveg', 'eggetarian', 'vegan'];
  const commonDeficiencies = ['Iron', 'Zinc', 'Omega 3', 'Vitamin B12', 'Vitamin D', 'Calcium', 'None'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleDeficiency = (def) => {
    if (def === 'None') {
      setFormData({ ...formData, deficiencies: ['None'] });
      return;
    }
    let updated = formData.deficiencies.filter(d => d !== 'None');
    if (updated.includes(def)) {
      updated = updated.filter(d => d !== def);
    } else {
      updated.push(def);
    }
    setFormData({ ...formData, deficiencies: updated });
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else submitData();
  };

  const submitData = () => {
    saveProfile(formData);
    navigate('/dashboard');
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i + 1 <= step ? 'var(--primary)' : 'var(--border-medium)', transition: 'var(--transition-normal)' }} />
          ))}
        </div>

        <motion.div className="glass-panel" key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
          
          {step === 1 && (
            <div>
              <motion.h2 className="title-gradient" animate={{ scale: [0.95, 1] }} style={{ marginBottom: 'var(--space-2)' }}>Welcome to IntuEat</motion.h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Let's get to know you.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="label">What is your name?</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                   <label className="label">Gender</label>
                   <select name="gender" value={formData.gender} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
                     <option value="female">Female</option>
                     <option value="male">Male</option>
                   </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
             <div>
               <h2 className="title-gradient" style={{ marginBottom: 'var(--space-2)' }}>Your Goals</h2>
               <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>We use WHO formulas to calculate your daily targets.</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                 {['lose', 'maintain', 'gain_muscle', 'improve_immunity', 'keto_diet'].map(g => (
                   <div key={g} onClick={() => setFormData({ ...formData, goal: g })} style={{ padding: 'var(--space-3)', border: `2px solid ${formData.goal === g ? 'var(--primary)' : 'var(--border-medium)'}`, borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer', background: formData.goal === g ? 'var(--bg-glass)' : 'transparent', color: formData.goal === g ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: formData.goal === g ? '600' : '400', textTransform: 'capitalize' }}>
                     {g.replace('_', ' ')}
                   </div>
                 ))}
               </div>
             </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="title-gradient" style={{ marginBottom: 'var(--space-2)' }}>Body Metrics</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Required for accurate metabolic calculations.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label className="label">Age (Years)</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} className="input-field" placeholder="25" />
                </div>
                <div>
                  <label className="label">Height (cm)</label>
                  <input type="number" name="height" value={formData.height} onChange={handleChange} className="input-field" placeholder="175" />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="input-field" placeholder="70" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="title-gradient" style={{ marginBottom: 'var(--space-2)' }}>Dietary Preferences</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>What type of diet do you follow?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                {diets.map(diet => (
                  <div key={diet} onClick={() => setFormData({ ...formData, diet })} style={{ padding: 'var(--space-3)', border: `2px solid ${formData.diet === diet ? 'var(--primary)' : 'var(--border-medium)'}`, borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer', textTransform: 'capitalize', background: formData.diet === diet ? 'var(--bg-glass)' : 'transparent', color: formData.diet === diet ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {diet}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="title-gradient" style={{ marginBottom: 'var(--space-2)' }}>Health Baseline</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Select any known deficiencies.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {commonDeficiencies.map(def => {
                  const isSelected = formData.deficiencies.includes(def);
                  return (
                    <div key={def} onClick={() => toggleDeficiency(def)} style={{ padding: 'var(--space-2) var(--space-4)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-medium)'}`, borderRadius: 'var(--radius-full)', cursor: 'pointer', background: isSelected ? 'var(--primary)' : 'transparent', color: isSelected ? 'var(--text-inverse)' : 'var(--text-muted)' }}>
                      {def}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-5)' }}>
             {step > 1 ? <button className="btn-secondary" onClick={() => setStep(step - 1)}>Back</button> : <div />}
            <button className="btn-primary" onClick={handleNext}>
              {step === totalSteps ? 'Complete Profile' : 'Next Step'}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
