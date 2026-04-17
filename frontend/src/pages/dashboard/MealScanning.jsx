import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, CheckCircle, Cpu, BrainCircuit } from 'lucide-react';
import { UserContext } from '../../context/UserContext';

export default function MealScanning() {
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [mealType, setMealType] = useState('lunch');
  const [weight, setWeight] = useState('');
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addMealToHistory } = useContext(UserContext);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Base64
        setResult(null);
        setShowWeightPrompt(true); // Now we immediately ask for weight!
      };
      reader.readAsDataURL(file);
    }
  };

  const runAgenticAnalysis = async () => {
    if (!weight) return;
    setAnalyzing(true);
    setShowWeightPrompt(false);
    try {
      // Activating Backend Multimodal Agent
      const response = await fetch('/api/agent/meal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview, weight })
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
        setShowWeightPrompt(true);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.log(err);
      alert('Internal Agent Error connecting to database.');
      setShowWeightPrompt(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (result) {
      setSaving(true);
      try {
        await addMealToHistory({
          date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          type: mealType,
          name: result.name,
          cals: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          score: result.score,
          source: 'meal-scan',
        });
        alert(`Saved ${result.name} to '${mealType}' history!`);
        setImagePreview(null);
        setResult(null);
      } catch (error) {
        alert(error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Agentic Vision Scanner</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary)', fontSize: '0.9rem' }}>
          <BrainCircuit size={20} />
          Gemini Multimodal Ready
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 'var(--space-5)' }}>
        
        {/* Input area */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {!imagePreview ? (
            <div style={{ padding: 'var(--space-6) 0' }}>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
                <Camera size={32} color="var(--primary)" />
              </motion.div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Upload a picture of your dish</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)', fontSize: '0.9rem' }}>
                Powered by Gemini 1.5 Multimodal models to guarantee 99% accuracy in food identification, unlike basic TF.js models.
              </p>
              
              <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <Upload size={18} /> Select Image
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <img src={imagePreview} alt="Meal Preview" crossOrigin="anonymous" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }} />
              
              {result && (
                <button className="btn-secondary" style={{ width: '100%' }} onClick={() => { setImagePreview(null); setResult(null); }}>
                  Scan Another Meal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quantity Prompt Modal (In Flow) */}
        <AnimatePresence>
          {showWeightPrompt && !result && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ textAlign: 'center', border: '2px solid var(--primary)' }}>
              <h3 style={{ color: 'var(--text-main)', marginBottom: 'var(--space-2)' }}>Image Captured ✨</h3>
              <p style={{ color: 'var(--text-muted)' }}>To run exact Multimodal Macro calculations, enter the estimated weight.</p>
              
              <div style={{ margin: 'var(--space-4) 0' }}>
                <label className="label">Weight in Grams (g)</label>
                <input type="number" className="input-field" value={weight} onChange={e => setWeight(e.target.value)} style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 }} />
              </div>

              <button className="btn-primary" style={{ width: '100%' }} onClick={runAgenticAnalysis} disabled={analyzing || !weight}>
                {analyzing ? <><Cpu size={18} /> Agent Orchestrating...</> : 'Analyze w/ Gemini Vision'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results area */}
        {result && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Agent Processed</div>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{result.name}</h2>
              </div>
              <div style={{ background: 'var(--primary)', color: '#000', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: '70px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{result.score}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Health Score</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) minmax(80px, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calories</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.calories} kcal</div>
              </div>
              <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Protein</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.protein} g</div>
              </div>
              <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carbs</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.carbs} g</div>
              </div>
              <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fat</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.fat} g</div>
              </div>
            </div>

            {result.fallback && (
              <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(242, 206, 141, 0.18)', border: '1px solid rgba(220, 174, 120, 0.35)', color: 'var(--text-main)' }}>
                {result.fallbackMessage || 'This result is a generic fallback estimate because Gemini is temporarily unavailable.'}
                {result.geminiError?.message && (
                  <div style={{ marginTop: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Gemini error{result.geminiError.status ? ` (${result.geminiError.status})` : ''}: {result.geminiError.message}
                  </div>
                )}
              </div>
            )}

            {result.suggestions && result.suggestions.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: 'var(--space-2)' }}>💡 Creative Pairing Ideas</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {result.suggestions.map((s, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      style={{ background: 'rgba(255, 255, 255, 0.4)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{s.title}</div>
                      <div style={{ color: 'var(--text-main)', opacity: 0.8, fontSize: '0.8rem', marginTop: 'var(--space-1)' }}>{s.reason}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-medium)', margin: 'var(--space-4) 0' }} />

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label className="label">Log as:</label>
              <select className="input-field" value={mealType} onChange={e => setMealType(e.target.value)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <button className="btn-primary" style={{ width: '100%' }} onClick={saveMeal} disabled={saving}>
              <CheckCircle size={18} /> {saving ? 'Saving...' : 'Save to History'}
            </button>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
